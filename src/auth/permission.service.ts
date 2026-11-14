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

  async hasPermissionForUser(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    // Fail closed — a missing userId must never match a row.
    if (!userId) return false;
    const now = new Date();
    const record = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permission: permission,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
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
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { permission: true },
    });
    return records.map((r) => r.permission);
  }
}
