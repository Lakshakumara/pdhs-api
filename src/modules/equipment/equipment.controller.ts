import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, QueryEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  // ── GET /api/equipment ─────────────────────────────────────────────
  @Get()
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  findEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryEquipmentDto,
  ) {
    return this.service.findEquipment(activeRole, query);
  }

  // ── POST /api/equipment/add ────────────────────────────────────────
  @Post('add')
  @RequirePermission(Permission.EQUIPMENT_CREATE)
  addEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: CreateEquipmentDto,
  ) {
    return this.service.addEquipment(activeRole, data);
  }

  // ── PUT /api/equipment/update/:id ──────────────────────────────────
  @Put('update/:id')
  @RequirePermission(Permission.EQUIPMENT_UPDATE)
  updateEquipment(
    @Param('id') id: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: UpdateEquipmentDto,
  ) {
    return this.service.updateEquipment(activeRole, id, data);
  }

  // ── POST /api/equipment/:id/assign ─────────────────────────────────
  @Post(':id/assign')
  @RequirePermission(Permission.EQUIPMENT_ASSIGN)
  assignEquipment(
    @Param('id') equipmentId: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: { toInstitutionId: string; toEntity: 'RDHS' | 'Institution'; quantity: number },
  ) {
    return this.service.assignEquipment(
      activeRole,
      equipmentId,
      body.toInstitutionId,
      body.toEntity,
      body.quantity,
    );
  }
}
