import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { Permission } from 'src/auth/permission.enum';

export const PERMISSION_KEY = 'requiredPermission';
export const PERMISSION_MODE_KEY = 'requiredPermissionMode';

export type PermissionMode = 'ANY' | 'ALL';

/**
 * A function that inspects the request (body/params/query) and returns
 * the permission(s) actually required for THIS specific request.
 *
 * Used when the required permission depends on request content — e.g.
 * "moving a work order to Verified & Closed requires WORK_ORDER_VERIFY,
 * but any other status transition only requires WORK_ORDER_ASSIGN."
 */
export type PermissionResolver = (req: Request) => Permission | Permission[];

/**
 * Marks a route as requiring ANY of the given permissions (default), or
 * ALL of them if mode = 'ALL'. Checked by PermissionGuard against the
 * UserPermission table — NOT against role.
 *
 * Single permission:
 *   @RequirePermission(Permission.EQUIPMENT_VIEW)
 *
 * Any of several:
 *   @RequirePermission([Permission.EQUIPMENT_UPDATE, Permission.SUPER_ADMIN_OVERRIDE])
 *
 * All of several:
 *   @RequirePermission([Permission.EQUIPMENT_UPDATE, Permission.FINANCE_APPROVE], 'ALL')
 *
 * Resolved from request body/params (e.g. permission depends on a
 * `status` field in the request) — see PermissionResolver above:
 *   @RequirePermission((req) =>
 *     req.body.status === 'Verified & Closed'
 *       ? Permission.WORK_ORDER_VERIFY
 *       : Permission.WORK_ORDER_ASSIGN
 *   )
 */
export const RequirePermission = (
  permission: Permission | Permission[] | PermissionResolver,
  mode: PermissionMode = 'ANY',
) => {
  return (target: any, key?: any, descriptor?: any) => {
    SetMetadata(PERMISSION_KEY, permission)(target, key, descriptor);
    SetMetadata(PERMISSION_MODE_KEY, mode)(target, key, descriptor);
    return descriptor;
  };
};