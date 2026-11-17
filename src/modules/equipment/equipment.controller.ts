import {
  Body,
  Req,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { EquipmentService } from './equipment.service';
import {
  CreateEquipmentDto,
  QueryEquipmentDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';
import { buildAuditContext } from '../../common/utils/audit-context.util';

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

  // ── POST /api/equipment (+ /add) ──────────────────────────────────
  @Post(['', 'add'])
  @RequirePermission(Permission.EQUIPMENT_CREATE)
  addEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: CreateEquipmentDto,
    @Req() req: Request,  ) {
    return this.service.addEquipment(activeRole, data, buildAuditContext(req));
  }

  // ── PUT /api/equipment/:id (+ /update/:id) ─────────────────────────
  @Put([':id', 'update/:id'])
  @RequirePermission(Permission.EQUIPMENT_UPDATE)
  updateEquipment(
    @Param('id') id: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: UpdateEquipmentDto,
    @Req() req: Request,  ) {
    return this.service.updateEquipment(activeRole, id, data, buildAuditContext(req));
  }

  // ── POST /api/equipment/:id/assign ─────────────────────────────────
  @Post(':id/assign')
  @RequirePermission(Permission.EQUIPMENT_ASSIGN)
  assignEquipment(
    @Param('id') equipmentId: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Body()
    body: {
      toInstitutionId: string;
      toEntity: 'RDHS' | 'Institution';
      quantity: number;
    },
  ) {
    return this.service.assignEquipment(
      activeRole,
      equipmentId,
      body.toInstitutionId,
      body.toEntity,
      body.quantity,
      buildAuditContext(req),
    );
  }
}
