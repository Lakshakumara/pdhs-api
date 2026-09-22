// permission.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from './permission.enum';

@Injectable()
export class PermissionService {

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────
  // Runtime permission check (Option B)
  //
  // Reads from UserPermission table — which is the single source of
  // truth for what a user can do. Expired rows (expiresAt < now()) are
  // excluded at query time; they stay in the DB for audit purposes.
  //
  // Call this from service methods:
  //   await this.permissionService.requireForUser(userId, Permission.X);
  // ─────────────────────────────────────────────────────────────────────

  async hasPermissionForUser(userId: string, permission: Permission): Promise<boolean> {
    const now = new Date();
    const record = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permission: permission as string,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });
    return !!record;
  }

  async requireForUser(userId: string, permission: Permission): Promise<void> {
    const has = await this.hasPermissionForUser(userId, permission);
    if (!has) {
      throw new ForbiddenException(
        `Permission '${permission}' is not granted for this user`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Get all active permissions for a user (for /me response + UI)
  // ─────────────────────────────────────────────────────────────────────

  async getActivePermissions(userId: string): Promise<string[]> {
    const now = new Date();
    const records = await this.prisma.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: { permission: true },
    });
    return records.map(r => r.permission);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Role-level check (synchronous) — used by ActiveRoleGuard /
  // controller-layer guards where we only have the role string, not
  // userId. Kept for backwards compatibility with existing controllers
  // that haven't been migrated to user-level checks yet.
  // ─────────────────────────────────────────────────────────────────────

  hasPermission(role: string, permission: Permission): boolean {
    // Lazy import to avoid circular dep — role-permissions.ts is a
    // static map and doesn't import any NestJS providers.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ROLE_PERMISSIONS } = require('./role-permissions');
    const permissions: Permission[] = ROLE_PERMISSIONS[role] ?? [];
    return permissions.includes(permission);
  }

  require(role: string, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new ForbiddenException('Permission denied');
    }
  }
}




/*import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Permission } from 'src/auth/permission.enum';
import { ROLE_PERMISSIONS } from 'src/auth/role-permissions';


@Injectable()
export class PermissionService {

  hasPermission(
    role: string,
    permission: Permission): boolean {

    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return permissions.includes(
      permission
    );
  }

  require(role: string, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new ForbiddenException('Permission denied');
    }
  }
}*/