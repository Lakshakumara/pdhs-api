import {
  Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { RepairService } from './repair.service';
import {
  QueryEquipmentRepairHistoryDto,
  QueryRepairRequestDto,
  QueryWorkOrderDto,
} from './dto/repair.dto';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class RepairController {
  constructor(private readonly service: RepairService) { }
  // ── POST /api/repair-requests ──────────────────────────────────────
  @Post('repair-requests')
  @RequirePermission(Permission.REPAIR_REQUEST_CREATE)
  async submitRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: any,
  ) {
    const { equipmentId, sparePartId, faultDescription, priority, submittedByUserId } = body;
    return this.service.submitRepairRequest(
      activeRole,
      equipmentId,
      sparePartId,
      faultDescription,
      priority,
      submittedByUserId,
    );
  }

  // ── GET /api/repair-requests ───────────────────────────────────────
  @Get('repair-requests')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  findRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: any,
  ) {
    return this.service.findRepairRequest(activeRole, query);
  }

  // ── GET /api/repair-history ────────────────────────────────────────
  @Get('repair-history')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  findEquipmentRepairHistory(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryEquipmentRepairHistoryDto,
  ) {
    return this.service.findEquipmentRepairHistory(activeRole, query);
  }

  // ── GET /api/work-order/:requestId ─────────────────────────────────
  @Get('work-order/:requestId')
  @SkipPermission()
  async findOne(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('requestId') requestId: string,
  ) {
    return this.service.findWorkOrder(activeRole, requestId);
  }

  // ── GET /api/work-order ────────────────────────────────────────────
  @Get('work-order')
  @RequirePermission(Permission.WORK_ORDER_VIEW)
  async getWorkOrders(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryWorkOrderDto,
  ) {
    return this.service.findWorkOrders(activeRole, query);
  }


  @Put('/work-orders/:id/status')
  @RequirePermission((req) => {
    const status = req.body?.status;
    if (status === 'VERIFIED_CLOSED') return Permission.WORK_ORDER_VERIFY;
    if (status === 'ESCALATED_TO_VENDOR') return Permission.WORK_ORDER_ESCALATE_VENDOR;
    return Permission.WORK_ORDER_ASSIGN;    // all other transitions
  })
  async updateWorkOrderStatus(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
  ) {
    return this.service.updateWorkOrderStatus(activeRole, workOrderId, body);
  }

}
