import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { JwtPayload, JwtRoleClaim } from './jwt-payload.interface';
import { generateOpaqueToken, hashToken } from './crypto.util';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;
const PASSWORD_RESET_TTL_HOURS = 1;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
        permissions: { include:{ grantedBy:{ select: { id: true, fullName:true } }}},
      },
    });

    if (!user || !user.active) {
      // Same message for "no such user" and "wrong password" —
      // don't leak which one it was.
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.roles.length === 0) {
      throw new UnauthorizedException(
        'This account has no assigned roles. Contact your administrator.',
      );
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, meta);

    return {
      token: accessToken,
      refreshToken,
      user: this.toUserDto(user),
    };
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
  async logout(refreshToken: string): Promise<void> {
    const hashed = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);

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
    console.log(`[DEV] Password reset token for ${user.email}: ${plaintextToken}`);
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
  }

  // ───────────────────────────────────────────────────────────────────────
  // INTERNAL
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Signs an access token containing role/scope claims (but NOT
   * permissions — see permissions.ts for rationale).
   */
  private signAccessToken(user: { id: string; username: string; fullName: string; institutionId: string | null; roles: { role: any; scopeType: any; scopeId: string | null }[] }): string {
    const roleClaims: JwtRoleClaim[] = user.roles.map(r => ({
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
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'soft_solution_software_@_laksha_@_1227'),
      // See auth.module.ts for why this cast is needed — JwtSignOptions
      // types expiresIn as `number | StringValue`, narrower than the
      // plain `string` ConfigService.get() returns.
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '8h') as any,
    });
  }

  /**
   * Creates and persists a refresh token, returning the PLAINTEXT value
   * to send to the client. Only its SHA-256 hash is stored.
   */
  private async issueRefreshToken(userId: string, meta: RequestMeta): Promise<string> {
    const plaintextToken = generateOpaqueToken(40);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

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
      permissions:user.permissions.map((per:any)=>({
        permission:per.permission,
        grantedAt:per.grantedAt,
        note:per.note,
        expiresAt: per.expiresAt,
        grantedBy:per.grantedBy,
      })),
    };
  }
}