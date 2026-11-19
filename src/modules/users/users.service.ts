import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import {
  ROLE_PERMISSIONS,
  SCOPE_ROLES,
} from '../../auth/constants/role-permissions';
import { Permission } from '../../auth/permission.enum';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { RoleType, ScopeType } from '@prisma/client';
import {
  AddRoleDto,
  CreateUserDto,
  GrantPermissionDto,
  QueryUsersDto,
  UpdateUserDto,
} from './dto/user.dto';
import { AuditContext } from '../../common/utils/audit-context.util';
import { AuditService } from '../audit/audit.service';

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'pdhs@123';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly auditService: AuditService,
  ) {}

  // ── USER SELECT ──────────────────────────────────────────────────────
  private get userSelect() {
    return {
      id: true,
      username: true,
      fullName: true,
      email: true,
      active: true,
      mustChangePassword: true,
      institutionId: true,
      createdAt: true,
      updatedAt: true,
      institution: {
        select: {
          id: true,
          name: true,
          districtId: true,
          district: { select: { id: true, name: true } },
        },
      },
      roles: {
        select: {
          id: true,
          role: true,
          scopeType: true,
          scopeId: true,
          assignedAt: true,
          assignedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { assignedAt: 'asc' as const },
      },
      permissions: {
        select: {
          id: true,
          permission: true,
          grantedAt: true,
          expiresAt: true,
          note: true,
          grantedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { grantedAt: 'asc' as const },
      },
    };
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
      institutionId: user.institutionId,
      institutionName: user.institution?.name ?? null,
      districtId: user.institution?.districtId ?? null,
      districtName: user.institution?.district?.name ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles,
      permissions: (
        (user.permissions ?? []) as Array<{ expiresAt: Date | null }>
      ).map((p) => ({
        ...p,
        active: !p.expiresAt || p.expiresAt > new Date(),
      })),
    };
  }

  // ── FIND ALL ─────────────────────────────────────────────────────────
  async findAll(activeRole: JwtRoleClaim, query: QueryUsersDto) {
    const scopeWhere = this.buildUserScopeWhere(activeRole);
    const skip = (query.page - 1) * query.size;

    const where: any = { ...scopeWhere };

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.active !== undefined) where.active = query.active;
    if (query.institutionId) where.institutionId = query.institutionId;
    if (query.districtId) where.institution = { districtId: query.districtId };
    if (query.role) {
      where.roles = { some: { role: query.role } };
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.size,
        select: this.userSelect,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.mapUser(u)),
      page: query.page,
      size: query.size,
      total,
      totalPages: Math.ceil(total / query.size),
    };
  }

  // ── GET BY ID ────────────────────────────────────────────────────────
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return this.mapUser(user);
  }

  // ── CREATE USER ──────────────────────────────────────────────────────
  async createUser(
    activeRole: JwtRoleClaim,
    createdById: string,
    dto: CreateUserDto,
    ctx?: AuditContext,
  ) {
    this.assertCanManageScope(activeRole, dto.scopeType, dto.scopeId);
    this.assertCanAssignRole(activeRole, dto.role);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        existing.username === dto.username
          ? 'Username already taken'
          : 'Email already in use',
      );
    }

    const plainPassword = dto.password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    const userId = randomUUID();
    const defaultPermissions = ROLE_PERMISSIONS[dto.role] ?? [];

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        username: dto.username,
        fullName: dto.fullName,
        email: dto.email ?? null,
        passwordHash,
        institutionId: dto.institutionId,
        mustChangePassword: dto.password
          ? (dto.mustChangePassword ?? true)
          : true,
        active: dto.active ?? true,
        roles: {
          create: [
            {
              id: randomUUID(),
              role: dto.role,
              scopeType: dto.scopeType,
              scopeId: dto.scopeId ?? null,
              assignedById: createdById,
            },
          ],
        },
        permissions: {
          create: defaultPermissions.map((p) => ({
            id: randomUUID(),
            permission: p,
            grantedById: createdById,
          })),
        },
      },
      select: this.userSelect,
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'CREATE',
        entityName: 'User',
        recordId: user.id,
        description: `Created user "${user.username}" with role ${dto.role}`,
        metadata: {
          role: dto.role,
          scopeType: dto.scopeType,
          active: dto.active ?? true,
        },
      });
    }

    return this.mapUser(user);
  }

  // ── UPDATE USER ──────────────────────────────────────────────────────
  async updateUser(
    activeRole: JwtRoleClaim,
    userId: string,
    dto: UpdateUserDto,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.institutionId !== undefined && {
          institutionId: dto.institutionId || null,
        }),
        ...(dto.mustChangePassword !== undefined && {
          mustChangePassword: dto.mustChangePassword,
        }),
      },
      select: this.userSelect,
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'UPDATE',
        entityName: 'User',
        recordId: user.id,
        description: `Updated user "${user.username}"`,
        metadata: { changes: dto as Record<string, unknown> },
      });
    }

    return this.mapUser(user);
  }

  // ── DELETE USER ──────────────────────────────────────────────────────
  async deleteUser(
    activeRole: JwtRoleClaim,
    userId: string,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    const victim = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, fullName: true },
    });
    await this.prisma.user.delete({ where: { id: userId } });

    if (ctx && victim) {
      await this.auditService.log(ctx, {
        action: 'DELETE',
        entityName: 'User',
        recordId: userId,
        description: `Deleted user "${victim.username}"`,
      });
    }
  }

  // ── SET ACTIVE ───────────────────────────────────────────────────────
  async setActive(
    activeRole: JwtRoleClaim,
    userId: string,
    active: boolean,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { active },
      select: this.userSelect,
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'UPDATE',
        entityName: 'User',
        recordId: user.id,
        description: `${active ? 'Activated' : 'Deactivated'} user "${user.username}"`,
        metadata: { active },
      });
    }

    return this.mapUser(user);
  }

  // ── RESET PASSWORD ───────────────────────────────────────────────────
  async resetPassword(
    activeRole: JwtRoleClaim,
    userId: string,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
      select: { username: true, fullName: true },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'RESET_PASSWORD',
        entityName: 'User',
        recordId: userId,
        description: `Reset password for user "${user.username}" (must change at next login)`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ROLE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  async addRole(
    activeRole: JwtRoleClaim,
    assignedById: string,
    userId: string,
    dto: AddRoleDto,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    this.assertCanManageScope(activeRole, dto.scopeType, dto.scopeId);
    this.assertCanAssignRole(activeRole, dto.role);

    const existing = await this.prisma.userPermission.findMany({
      where: { userId },
      select: { permission: true },
    });
    const existingSet = new Set(existing.map((e) => e.permission));
    const newPerms = (ROLE_PERMISSIONS[dto.role] ?? []).filter(
      (p) => !existingSet.has(p as string),
    );

    const [role] = await this.prisma.$transaction([
      this.prisma.userRole.create({
        data: {
          id: randomUUID(),
          userId,
          role: dto.role,
          scopeType: dto.scopeType,
          scopeId: dto.scopeId ?? null,
          assignedById,
        },
      }),
      ...newPerms.map((p) =>
        this.prisma.userPermission.create({
          data: {
            id: randomUUID(),
            userId,
            permission: p,
            grantedById: assignedById,
          },
        }),
      ),
    ]);

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'ASSIGN',
        entityName: 'UserRole',
        recordId: userId,
        description: `Assigned role ${dto.role} (${dto.scopeType}) to user ${userId}`,
        metadata: { role: dto.role, scopeType: dto.scopeType, newPerms },
      });
    }

    return role;
  }

  async removeRole(
    activeRole: JwtRoleClaim,
    userId: string,
    roleId: string,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);

    const role = await this.prisma.userRole.findFirst({
      where: { id: roleId, userId },
    });
    if (!role) throw new NotFoundException('Role assignment not found');

    const roleCount = await this.prisma.userRole.count({ where: { userId } });
    if (roleCount <= 1) {
      throw new BadRequestException('Cannot remove the last role from a user');
    }

    await this.prisma.userRole.delete({ where: { id: roleId } });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'DELETE',
        entityName: 'UserRole',
        recordId: userId,
        description: `Removed role ${role.role} from user ${userId}`,
        metadata: { role: role.role, scopeType: role.scopeType },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PERMISSION MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  async getPermissions(userId: string) {
    const now = new Date();
    const all = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { grantedBy: { select: { id: true, fullName: true } } },
      orderBy: { grantedAt: 'asc' },
    });
    return all.map((p) => ({
      ...p,
      active: !p.expiresAt || p.expiresAt > now,
    }));
  }

  async grantPermission(
    activeRole: JwtRoleClaim,
    grantedById: string,
    userId: string,
    dto: GrantPermissionDto,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    await this.assertCanGrantPermissions(activeRole, [
      dto.permission as Permission,
    ]);

    const granted = await this.prisma.userPermission.upsert({
      where: { userId_permission: { userId, permission: dto.permission } },
      create: {
        id: randomUUID(),
        userId,
        permission: dto.permission,
        grantedById,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        note: dto.note ?? null,
      },
      update: {
        grantedById,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        note: dto.note ?? null,
        grantedAt: new Date(),
      },
      include: { grantedBy: { select: { id: true, fullName: true } } },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'ASSIGN',
        entityName: 'UserPermission',
        recordId: userId,
        description: `Granted ${dto.permission} to user ${userId}${
          dto.expiresAt ? ` (expires ${dto.expiresAt})` : ''
        }`,
        metadata: {
          permission: dto.permission,
          expiresAt: dto.expiresAt ?? null,
        },
      });
    }

    return granted;
  }

  async revokePermission(
    activeRole: JwtRoleClaim,
    userId: string,
    permissionId: string,
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    const perm = await this.prisma.userPermission.findFirst({
      where: { id: permissionId, userId },
    });
    if (!perm) throw new NotFoundException('Permission record not found');
    await this.prisma.userPermission.delete({ where: { id: permissionId } });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'DELETE',
        entityName: 'UserPermission',
        recordId: userId,
        description: `Revoked ${perm.permission} from user ${userId}`,
        metadata: { permission: perm.permission },
      });
    }
  }

  async syncPermissions(
    activeRole: JwtRoleClaim,
    grantedById: string,
    userId: string,
    permissions: string[],
    ctx?: AuditContext,
  ) {
    await this.assertUserInScope(activeRole, userId);
    await this.assertCanGrantPermissions(
      activeRole,
      permissions.map((p) => p as Permission),
    );

    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({
        where: { userId, expiresAt: null },
      }),
      ...permissions.map((p) =>
        this.prisma.userPermission.create({
          data: { id: randomUUID(), userId, permission: p, grantedById },
        }),
      ),
    ]);

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'UPDATE',
        entityName: 'UserPermission',
        recordId: userId,
        description: `Synced ${permissions.length} permanent permission(s) for user ${userId}`,
        metadata: { permissions },
      });
    }

    return this.getPermissions(userId);
  }

  // ══════════════════════════════════════════════════════════════════
  // SCOPE & HIERARCHY GUARDS (private)
  // ══════════════════════════════════════════════════════════════════

  private buildUserScopeWhere(activeRole: JwtRoleClaim): any {
    switch (activeRole.scopeType) {
      case 'PDHS':
        return {};
      case 'RDHS':
        return {
          OR: [
            { institution: { districtId: activeRole.scopeId } },
            {
              roles: {
                some: { scopeType: 'RDHS', scopeId: activeRole.scopeId },
              },
            },
          ],
        };
      case 'INSTITUTE':
        return { institutionId: activeRole.scopeId };
      default:
        throw new ForbiddenException('Invalid scope');
    }
  }

  private async assertUserInScope(activeRole: JwtRoleClaim, userId: string) {
    const scopeWhere = this.buildUserScopeWhere(activeRole);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, ...scopeWhere },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private assertCanManageScope(
    activeRole: JwtRoleClaim,
    targetScopeType: ScopeType,
    targetScopeId?: string | null,
  ) {
    switch (activeRole.scopeType) {
      case 'PDHS':
        return;
      case 'RDHS':
        if (targetScopeType === 'PDHS') {
          throw new ForbiddenException(
            'RDHS-scoped users cannot create PDHS-level users',
          );
        }
        if (
          targetScopeType === 'RDHS' &&
          targetScopeId !== activeRole.scopeId
        ) {
          throw new ForbiddenException(
            'RDHS-scoped users can only manage users in their own district',
          );
        }
        return;
      case 'INSTITUTE':
        if (targetScopeType !== 'INSTITUTE') {
          throw new ForbiddenException(
            'Institute-scoped users can only manage users within their institution',
          );
        }
        if (targetScopeId !== activeRole.scopeId) {
          throw new ForbiddenException(
            'Institute-scoped users can only manage users in their own institution',
          );
        }
        return;
    }
  }

  private assertCanAssignRole(
    activeRole: JwtRoleClaim,
    roleToAssign: RoleType,
  ) {
    if (activeRole.scopeType === 'PDHS') return;
    const allowedRoles = SCOPE_ROLES[activeRole.scopeType as ScopeType] ?? [];
    if (!allowedRoles.includes(roleToAssign)) {
      throw new ForbiddenException(
        `Cannot assign role '${roleToAssign}' from ${activeRole.scopeType} scope`,
      );
    }
  }

  // The caller may only grant permissions they actually HOLD themselves
  // (UserPermission table — not role defaults, so revoked/customized
  // grants are respected). SUPER_ADMIN_PDHS may grant anything.
  private async assertCanGrantPermissions(
    activeRole: JwtRoleClaim,
    permissions: Permission[],
  ) {
    if (activeRole.role === 'SUPER_ADMIN_PDHS') return;
    const now = new Date();
    const held = await this.prisma.userPermission.findMany({
      where: {
        userId: activeRole.sub,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { permission: true },
    });
    const heldSet = new Set(held.map((h) => h.permission));
    const missing = permissions.filter((p) => !heldSet.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `You cannot grant permission${missing.length > 1 ? 's' : ''} ` +
          `${missing.join(', ')} — you do not hold ${missing.length > 1 ? 'them' : 'it'} yourself`,
      );
    }
  }
}
