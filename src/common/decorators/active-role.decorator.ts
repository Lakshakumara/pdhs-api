import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';

/**
 * Extracts req.activeRole (set by ActiveRoleGuard) directly into a
 * handler parameter.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ActiveRoleGuard)
 *   @Get()
 *   findAll(@ActiveRole() activeRole: JwtRoleClaim) {
 *     this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
 *     const where = this.scopeService.equipmentWhere(activeRole);
 *     return this.prisma.equipment.findMany({ where });
 *   }
 */
export const ActiveRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtRoleClaim => {
    const req = ctx.switchToHttp().getRequest();
    return req.activeRole;
  },
);
