import { SetMetadata } from '@nestjs/common';
import { Permission } from './permission.enum';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Marks a route (or controller) as requiring a specific permission.
 * Read by PermissionGuard, which checks it against
 * ROLE_PERMISSIONS[req.activeRole.role].
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ScopeGuard, PermissionGuard)
 *   @RequirePermission(Permission.USER_VIEW)
 *   @Get()
 *   findAll() { ... }
 */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
