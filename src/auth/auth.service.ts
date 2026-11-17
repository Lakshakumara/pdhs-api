import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, JwtRoleClaim } from './jwt-payload.interface';
import { generateOpaqueToken, hashToken } from './crypto.util';
import {
  BCRYPT_ROUNDS,
  REFRESH_TOKEN_TTL_DAYS,
  PASSWORD_RESET_TTL_HOURS,
} from './constants/auth.constants';
import { AuditService } from '../modules/audit/audit.service';
import { AUDIT_ACTIONS } from '../modules/audit/audit.constants';
import { AuditContext } from '../common/utils/audit-context.util';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

/** Impersonation ("View As") sessions are deliberately short-lived. */
export const IMPERSONATION_TTL = '15m';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────────────────────────────────

  async login(username: string, password: string, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: true,
        institution: { include: { district: true } },
        permissions: {
          include: { grantedBy: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!user || !user.active) {
      // Only audit failures where the account EXISTS — audit_logs.userId
      // is a FK to the User table, and we also don't want a row per
      // random username probe. Same message either way: don't leak which
      // one it was.
      if (user) {
        await this.auditAuthEvent(AUDIT_ACTIONS.LOGIN_FAILED, user, meta, {
          reason: user.active ? 'invalid_password' : 'inactive_account',
        });
      }
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      await this.auditAuthEvent(AUDIT_ACTIONS.LOGIN_FAILED, user, meta, {
        reason: 'invalid_password',
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.roles.length === 0) {
      await this.auditAuthEvent(AUDIT_ACTIONS.LOGIN_FAILED, user, meta, {
        reason: 'no_roles',
      });
      throw new UnauthorizedException(
        'This account has no assigned roles. Contact your administrator.',
      );
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, meta);

    await this.auditAuthEvent(AUDIT_ACTIONS.LOGIN, user, meta);

    return {
      token: accessToken,
      refreshToken,
      user: this.toUserDto(user),
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // IMPERSONATION ("View As") — troubleshooting hospital-staff issues
  // without ever asking for their password.
  //
  // Returns a short-lived (15m) access token carrying the TARGET user's
  // claims (so permissions/scope resolve exactly as that user) plus an
  // `impersonator` claim preserving the real actor for audit attribution.
  // No refresh token is issued — the session cannot be extended.
  // ───────────────────────────────────────────────────────────────────────

  async impersonate(targetUserId: string, admin: JwtPayload, meta: RequestMeta) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        roles: true,
        institution: { include: { district: true } },
        permissions: {
          include: { grantedBy: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!target) throw new NotFoundException('User not found');
    if (!target.active) {
      throw new ForbiddenException('Cannot impersonate an inactive user');
    }
    if (target.roles.length === 0) {
      throw new ForbiddenException(
        'Cannot impersonate a user with no assigned roles',
      );
    }
    if (target.id === admin.sub) {
      throw new BadRequestException('You are already operating as yourself');
    }

    const token = this.signAccessToken(target, {
      expiresIn: IMPERSONATION_TTL,
      impersonator: {
        sub: admin.sub,
        username: admin.username,
        fullName: admin.fullName,
      },
    });

    await this.auditService.log(this.authAuditContext(admin, meta), {
      action: AUDIT_ACTIONS.IMPERSONATE_START,
      entityName: 'User',
      recordId: target.id,
      description: `${admin.fullName} started impersonating ${target.fullName} (${target.username})`,
      metadata: {
        targetUserId: target.id,
        targetUsername: target.username,
      },
    });

    return {
      token,
      user: this.toUserDto(target),
      impersonating: true,
      expiresIn: IMPERSONATION_TTL,
    };
  }

  /** Records the end of an impersonation session (audit trail bookend). */
  async endImpersonation(
    admin: JwtPayload,
    targetUserId: string | null,
    meta: RequestMeta,
  ): Promise<void> {
    const actor = admin.impersonator ?? admin;
    const target = targetUserId
      ? await this.prisma.user.findUnique({
          where: { id: targetUserId },
          select: { fullName: true, username: true },
        })
      : null;

    await this.auditService.log(this.authAuditContext(actor, meta), {
      action: AUDIT_ACTIONS.IMPERSONATE_END,
      entityName: 'User',
      recordId: targetUserId ?? actor.sub,
      description: target
        ? `${actor.fullName} ended impersonation of ${target.fullName} (${target.username})`
        : `${actor.fullName} ended an impersonation session`,
      metadata: targetUserId ? { targetUserId } : undefined,
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // REFRESH
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Validates the supplied refresh token, rotates it (revokes the old one,
   * issues a new one), and returns a fresh access token.
   *
   * Rotation means a stolen refresh token can only be used once before
   * the legitimate client's next refresh fails — making reuse detectable.
   */
  async refreshTokens(refreshToken: string, meta: RequestMeta) {
    const hashed = hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: { include: { roles: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Revoke the used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = await this.issueRefreshToken(stored.userId, meta);
    const accessToken = this.signAccessToken(stored.user);

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────────────────────────────────

  /** Revokes a single refresh token (the one used on this device). */
  async logout(refreshToken: string, meta?: RequestMeta): Promise<void> {
    const hashed = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });
    await this.prisma.refreshToken.updateMany({
      where: { token: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (stored?.user && meta) {
      await this.auditService.log(
        {
          userId: stored.user.id,
          userName: stored.user.fullName,
          userRole: 'UNKNOWN',
          ipAddress: meta.ip,
        },
        {
          action: AUDIT_ACTIONS.LOGOUT,
          entityName: 'User',
          recordId: stored.user.id,
          description: `${stored.user.fullName} signed out`,
        },
      );
    }
  }

  /** Revokes ALL active refresh tokens for a user ("log out everywhere"). */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // CHANGE PASSWORD (authenticated user changing their own password)
  // ───────────────────────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta?: RequestMeta,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      // Force re-login everywhere after a password change
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.log(
      {
        userId: user.id,
        userName: user.fullName,
        userRole: 'SELF',
        ipAddress: meta?.ip,
      },
      {
        action: AUDIT_ACTIONS.CHANGE_PASSWORD,
        entityName: 'User',
        recordId: user.id,
        description: `${user.fullName} changed their own password`,
      },
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD (self-service, via PasswordResetToken)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Always returns successfully regardless of whether the email exists —
   * prevents using this endpoint to enumerate registered email addresses.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // Invalidate any previous unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const plaintextToken = generateOpaqueToken(32);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        id: randomUUID(),
        token: hashToken(plaintextToken),
        userId: user.id,
        expiresAt,
      },
    });

    // TODO: wire up MailService and email `plaintextToken` to user.email
    // as a reset link, e.g. https://app/reset-password?token=<plaintextToken>
    console.log(
      `[DEV] Password reset token for ${user.email}: ${plaintextToken}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = hashToken(token);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: hashed },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const resetUser = await this.prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, fullName: true },
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Force re-login everywhere after a password reset
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    if (resetUser) {
      await this.auditService.log(
        {
          userId: resetUser.id,
          userName: resetUser.fullName,
          userRole: 'SELF',
        },
        {
          action: AUDIT_ACTIONS.RESET_PASSWORD,
          entityName: 'User',
          recordId: resetUser.id,
          description: `${resetUser.fullName} completed a self-service password reset`,
        },
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // INTERNAL — audit helpers
  // ───────────────────────────────────────────────────────────────────────

  /** AuditContext from a JWT payload (the authenticated actor). */
  private authAuditContext(
    actor: { sub: string; fullName: string; roles?: JwtRoleClaim[] },
    meta: RequestMeta,
  ): AuditContext {
    return {
      userId: actor.sub,
      userName: actor.fullName,
      userRole: actor.roles?.[0]?.role ?? 'UNKNOWN',
      ipAddress: meta.ip,
    };
  }

  /**
   * Writes an auth-related audit row. Best-effort: an audit failure must
   * never block the login flow itself.
   */
  private async auditAuthEvent(
    action: string,
    user: { id: string; fullName: string; roles?: { role: any }[] },
    meta: RequestMeta,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditService.log(
        {
          userId: user.id,
          userName: user.fullName,
          userRole: user.roles?.[0]?.role ?? 'UNKNOWN',
          ipAddress: meta.ip,
        },
        {
          action,
          entityName: 'User',
          recordId: user.id,
          description:
            action === AUDIT_ACTIONS.LOGIN
              ? `${user.fullName} signed in`
              : `${user.fullName} sign-in failed (${metadata?.reason ?? 'unknown'})`,
          metadata,
        },
      );
    } catch {
      // never break authentication because of an audit write failure
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // INTERNAL
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Signs an access token containing role/scope claims (but NOT
   * permissions — see permissions.ts for rationale).
   *
   * `opts.expiresIn` overrides the default TTL (used for short-lived
   * impersonation tokens); `opts.impersonator` stamps the real actor
   * onto a "View As" token.
   */
  private signAccessToken(
    user: {
      id: string;
      username: string;
      fullName: string;
      institutionId: string | null;
      roles: { role: any; scopeType: any; scopeId: string | null }[];
    },
    opts?: {
      expiresIn?: string;
      impersonator?: { sub: string; username: string; fullName: string };
    },
  ): string {
    const roleClaims: JwtRoleClaim[] = user.roles.map((r) => ({
      sub: user.id,
      role: r.role,
      scopeType: r.scopeType,
      scopeId: r.scopeId,
    }));

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      fullName: user.fullName,
      institutionId: user.institutionId,
      roles: roleClaims,
      ...(opts?.impersonator ? { impersonator: opts.impersonator } : {}),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_SECRET',
        'soft_solution_software_@_laksha_@_1227',
      ),
      // See auth.module.ts for why this cast is needed — JwtSignOptions
      // types expiresIn as `number | StringValue`, narrower than the
      // plain `string` ConfigService.get() returns.
      expiresIn: (opts?.expiresIn ??
        this.configService.get<string>('JWT_EXPIRES_IN', '8h')) as any,
    });
  }

  /**
   * Creates and persists a refresh token, returning the PLAINTEXT value
   * to send to the client. Only its SHA-256 hash is stored.
   */
  private async issueRefreshToken(
    userId: string,
    meta: RequestMeta,
  ): Promise<string> {
    const plaintextToken = generateOpaqueToken(40);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        id: randomUUID(),
        token: hashToken(plaintextToken),
        userId,
        expiresAt,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return plaintextToken;
  }

  /**
   * Maps a Prisma user (with roles + institution + district included) to
   * the UserDto shape expected by the frontend's AuthService.applySession().
   * Mirrors UsersService.mapUser — includes `permission` per role for the
   * frontend's HasPermissionDirective (UI gating only). Backend
   * enforcement happens via PermissionService.require() inside each
   * handler, using req.activeRole (set by ActiveRoleGuard) — NOT from
   * this JWT-derived value.
   */
  private toUserDto(user: any) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      active: user.active,
      mustChangePassword: user.mustChangePassword,

      institutionId: user.institution?.id ?? null,
      institutionName: user.institution?.name ?? null,

      districtId: user.institution?.district?.id ?? null,
      districtName: user.institution?.district?.name ?? null,

      roles: user.roles.map((role: any) => ({
        id: role.id,
        role: role.role,
        scopeType: role.scopeType,
        scopeId: role.scopeId,
        assignedAt: role.assignedAt,
        assignedById: role.assignedById,
      })),
      permissions: user.permissions.map((per: any) => ({
        permission: per.permission,
        grantedAt: per.grantedAt,
        note: per.note,
        expiresAt: per.expiresAt,
        grantedBy: per.grantedBy,
      })),
    };
  }
}
