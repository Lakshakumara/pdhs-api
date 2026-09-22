import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/inventory.dto';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('inventory-items')
  @RequirePermission(Permission.INVENTORY_VIEW)
  getInventoryItems(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInventoryDto,
  ) {
    return this.service.findInventoryItems(activeRole, query);
  }
}
