import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';

/**
 * Extracts req.activeRole (set by ActiveRoleGuard) directly into a
 * handler parameter.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ActiveRoleGuard)
 *   @Get()
 *   findAll(@ActiveRole() activeRole: JwtRoleClaim) { ... }
 */
export const ActiveRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtRoleClaim => {
    const req = ctx.switchToHttp().getRequest();
    return req.activeRole;
  },
);
