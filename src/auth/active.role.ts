import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtRoleClaim } from './jwt-payload.interface';

/**
 * Extracts req.activeRole (set by ActiveRoleGuard) directly into a
 * controller method parameter.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ActiveRoleGuard)
 *   @Get('/equipment')
 *   findEquipment(@ActiveRole() activeRole: JwtRoleClaim, @Query() query: QueryEquipmentDto) {
 *     return this.service.findEquipment(activeRole, query);
 *   }
 *
 * NOTE: this is a param decorator for CONTROLLERS only. Services receive
 * `activeRole` as a plain argument passed down from the controller — do
 * NOT import this into service files.
 */
export const ActiveRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtRoleClaim => {
    const req = ctx.switchToHttp().getRequest();
    return req.activeRole;
  },
);
