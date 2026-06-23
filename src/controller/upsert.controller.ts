import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { UpsertService } from 'src/service/upsert.service';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { ActiveRoleGuard, JwtAuthGuard } from 'src/common/guard/auth.guard';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { PermissionGuard } from 'src/common/guard/permission-guard';
import { Permission } from 'src/auth/permission.enum';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class UpsertController {
  constructor(private readonly service: UpsertService) { }

  // Submit Repair Request
  @Post('repair-requests')
  @RequirePermission(Permission.REPAIR_REQUEST_CREATE)
  async submitRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: any) {
    const { equipmentId, componentId, faultDescription, priority, submittedByUserId } = body;
    return this.service.submitRepairRequest(activeRole, equipmentId,
      componentId, faultDescription, priority, submittedByUserId /* submittedByUserId */);
  }

  // Update Work Order Status
  @Put('work-orders/:id/status')
  @RequirePermission((req) =>
    req.body.status === 'Completed'
      ? Permission.WORK_ORDER_COMPLETE
      : Permission.WORK_ORDER_ASSIGN
  )
  async updateWorkOrderStatus(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
  ) {
    return this.service.updateWorkOrderStatus(activeRole, workOrderId, body);
  }

  @Post('/equipment/add')
  @RequirePermission(Permission.EQUIPMENT_CREATE)
  addEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: CreateEquipmentDto,
  ) {
    return this.service.addEquipment(activeRole, data);
  }

  @Put('/equipment/update/:id')
  @RequirePermission(Permission.EQUIPMENT_UPDATE)
  updateEquipment(
    @Param('id') id: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: UpdateEquipmentDto,
  ) {
    return this.service.updateEquipment(activeRole, id, data);
  }

  // Assign Equipment
  @Post('equipment/:id/assign')
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