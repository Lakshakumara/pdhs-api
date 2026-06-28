import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from 'src/auth/permission.enum';
import { PrismaService } from 'src/prisma.service';
import { PERMISSION_KEY, PERMISSION_MODE_KEY, PermissionMode, PermissionResolver } from '../decorators/require-permission.decorator';
import { SKIP_PERMISSION_KEY } from '../decorators/skip-permission.decorator';

// ───────────────────────────────────────────────────────────────────────
// PermissionGuard
//
// Authorization lives entirely in the UserPermission table — checked
// fresh on every request, no caching (per "must be immediate" requirement).
//
// Three possible states per route, checked in this order:
//
//   1. @SkipPermission() present  -> explicitly exempt, allow through.
//      Still requires a valid JWT (JwtAuthGuard runs regardless) —
//      this only skips the UserPermission lookup, not authentication.
//
//   2. @RequirePermission(...) present -> checked against UserPermission,
//      supporting a single Permission, an array (ANY/ALL mode), or a
//      resolver function for request-dependent permissions (e.g.
//      permission depends on req.body.status).
//
//   3. Neither present -> FAIL CLOSED. A route with no permission
//      metadata at all is rejected, not silently allowed. This is what
//      catches "developer forgot to annotate a new endpoint" — distinct
//      from "this endpoint is intentionally public", which must be
//      declared explicitly via @SkipPermission().
//
// Must run AFTER JwtAuthGuard (needs req.user.sub) and, by convention,
// after ActiveRoleGuard:
//   @UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
// ───────────────────────────────────────────────────────────────────────
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.get<boolean>(
      SKIP_PERMISSION_KEY,
      context.getHandler(),
    );

    if (skip) {
      return true;
    }

    const declared = this.reflector.get<
      Permission | Permission[] | PermissionResolver
    >(PERMISSION_KEY, context.getHandler());

    const mode = this.reflector.get<PermissionMode>(
      PERMISSION_MODE_KEY,
      context.getHandler(),
    ) ?? 'ANY';

    if (!declared) {
      throw new ForbiddenException(
        'Route is missing @RequirePermission() metadata. ' +
        'If this endpoint is intentionally open to any authenticated user, ' +
        'annotate it with @SkipPermission() instead.',
      );
    }

    const req = context.switchToHttp().getRequest();

    const resolved =
      typeof declared === 'function'
        ? (declared as PermissionResolver)(req)
        : declared;

    const required: Permission[] = Array.isArray(resolved) ? resolved : [resolved];

    if (required.length === 0) {
      throw new ForbiddenException(
        'No permission could be resolved for this request',
      );
    }

    const userId: string | undefined = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('No authenticated user on request');
    }

    const grants = await this.prisma.userPermission.findMany({
      where: {
        userId,
        permission: { in: required },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { permission: true },
    });

    const grantedSet = new Set(grants.map(g => g.permission));

    const satisfied =
      mode === 'ALL'
        ? required.every(p => grantedSet.has(p))
        : required.some(p => grantedSet.has(p));

    if (!satisfied) {
      throw new ForbiddenException(
        `Missing required permission ${declared}${ required.length > 1 ? 's' : ''} (${mode}): ${required.join(', ')}`,
      );
    }

    return true;
  }
}