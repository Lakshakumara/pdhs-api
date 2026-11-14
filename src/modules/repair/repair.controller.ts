import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import type { Request } from 'express';
import { buildAuditContext } from '../../common/utils/audit-context.util';
import { RepairService } from './repair.service';
import {
  ApproveStageDto,
  QueryEquipmentRepairHistoryDto,
  QueryWorkOrderDto,
  RecordPaymentDto,
  SubmitFeedbackDto,
} from './dto/repair.dto';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class RepairController {
  constructor(private readonly service: RepairService) {}
  // ── POST /api/repair-requests ──────────────────────────────────────
  @Post('repair-requests')
  @RequirePermission(Permission.REPAIR_REQUEST_CREATE)
  async submitRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: any,
  ) {
    const {
      equipmentId,
      sparePartId,
      faultDescription,
      priority,
      submittedByUserId,
    } = body;
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
    if (status === 'ESCALATED_TO_VENDOR')
      return [
        Permission.WORK_ORDER_ESCALATE_VENDOR,
        Permission.WORK_ORDER_ASSIGN,
      ];
    if (status === 'VENDOR_COMPLETED')
      return [Permission.WORK_ORDER_COMPLETE, Permission.WORK_ORDER_ASSIGN];
    return Permission.WORK_ORDER_ASSIGN; // all other transitions
  })
  async updateWorkOrderStatus(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
    @Req() req: Request,
  ) {
    const ctx = buildAuditContext(req as any);
    return this.service.updateWorkOrderStatus(
      activeRole,
      workOrderId,
      body,
      ctx,
    );
  }

  // ── PUT /api/work-orders/:id/feedback ─────────────────────────────
  // End-user repair review: approved → payment, rejected → rework.
  @Put('/work-orders/:id/feedback')
  @RequirePermission(Permission.REPAIR_FEEDBACK)
  async submitFeedback(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() dto: SubmitFeedbackDto,
    @Req() req: Request,
  ) {
    const ctx = buildAuditContext(req as any);
    return this.service.submitFeedback(activeRole, workOrderId, dto, ctx);
  }

  // ── PUT /api/work-orders/:id/payment ──────────────────────────────
  // Payment step: PAYMENT_PENDING → MS_APPROVAL.
  @Put('/work-orders/:id/payment')
  @RequirePermission(Permission.REPAIR_PAYMENT)
  async recordPayment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: Request,
  ) {
    const ctx = buildAuditContext(req as any);
    return this.service.recordPayment(activeRole, workOrderId, dto, ctx);
  }

  // ── PUT /api/work-orders/:id/approve ──────────────────────────────
  // Approval chain: MS → RDHS → PDHD (PDHD auto-closes the order).
  @Put('/work-orders/:id/approve')
  @RequirePermission((req) => {
    const stage = req.body?.stage;
    if (stage === 'MS') return Permission.REPAIR_APPROVE_MS;
    if (stage === 'RDHS') return Permission.REPAIR_APPROVE_RDHS;
    return Permission.REPAIR_APPROVE_PDHS; // unknown stage → strictest gate
  })
  async approveStage(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() dto: ApproveStageDto,
    @Req() req: Request,
  ) {
    const ctx = buildAuditContext(req as any);
    return this.service.approveStage(activeRole, workOrderId, dto, ctx);
  }
}
