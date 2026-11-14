import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PermissionService } from '../../auth/permission.service';
import { Permission } from '../../auth/permission.enum';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { IdService, ID_PREFIXES } from '../../shared/id/id.service';
import {
  QueryEquipmentRepairHistoryDto,
  QueryWorkOrderDto,
  RepairPriority,
  EscalateToVendorDto,
  VendorCompletedDto,
  SubmitFeedbackDto,
  RecordPaymentDto,
  ApproveStageDto,
} from './dto/repair.dto';
import { AuditContext } from 'src/common/utils/audit-context.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly permissionService: PermissionService,
    private readonly queryBuilder: PrismaQueryBuilder,
    private readonly idService: IdService,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // Technician escalates to vendor — transitions from DIAGNOSED to
  // ESCALATED_TO_VENDOR and creates the VendorRepair record.
  //
  // Called when the technician determines the equipment:
  //   a) is still under warranty → repairBasis: 'WARRANTY'
  //   b) needs specialist tools/expertise → repairBasis: 'PAID'
  // ─────────────────────────────────────────────────────────────────
  async escalateToVendor(
    workOrderId: string,
    dto: EscalateToVendorDto,
    ctx: AuditContext,
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { repairRequest: true },
    });

    if (!wo) throw new NotFoundException('Work order not found');

    // Can only escalate from DIAGNOSED — must have assessed it first
    const allowedEscalateStatuses = ['SUBMITTED', 'ACKNOWLEDGED', 'DIAGNOSED'];
    if (!allowedEscalateStatuses.includes(wo.status)) {
      throw new BadRequestException(
        `Can only escalate to vendor from ${allowedEscalateStatuses.join(', ')} status. Current status: ${wo.status}`,
      );
    }

    // Validate handover-type-specific fields
    const dispatchDate = dto.dispatchDate
      ? new Date(dto.dispatchDate)
      : undefined;
    const scheduledDate = dto.scheduledDate
      ? new Date(dto.scheduledDate)
      : undefined;
    if (dto.handoverType === 'EQUIPMENT_SENT' && !dispatchDate) {
      throw new BadRequestException(
        'dispatchDate is required when handoverType is EQUIPMENT_SENT',
      );
    }
    if (dto.handoverType === 'FIELD_VISIT' && !scheduledDate) {
      throw new BadRequestException(
        'scheduledDate is required when handoverType is FIELD_VISIT',
      );
    }

    const vendorRepairId = await this.idService.generate(
      ID_PREFIXES.VENDOR_REPAIR,
    );

    const [updatedWo] = await this.prisma.$transaction([
      // 1. Transition WorkOrder to vendor track
      this.prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'ESCALATED_TO_VENDOR',
          repairTrack: 'VENDOR',
          statusDate: new Date(),
        },
      }),
      // 2. Create the VendorRepair record
      this.prisma.vendorRepair.create({
        data: {
          id: vendorRepairId,
          workOrderId,
          vendorName: dto.vendorName,
          vendorContact: dto.vendorContact,
          vendorEmail: dto.vendorEmail,
          repairBasis: dto.repairBasis,
          handoverType: dto.handoverType,
          dispatchDate,
          dispatchedBy: dto.dispatchedBy,
          courierRef: dto.courierRef,
          scheduledDate,
          visitLocation: dto.visitLocation,
          vendorRefNumber: dto.vendorRefNumber,
        },
      }),
    ]);

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description:
        `Work order ${workOrderId} escalated to vendor "${dto.vendorName}" ` +
        `(${dto.repairBasis}, ${dto.handoverType}) for repair request ${wo.repairRequestId}.`,
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: 'DIAGNOSED',
        newStatus: 'ESCALATED_TO_VENDOR',
        vendorName: dto.vendorName,
        repairBasis: dto.repairBasis,
        handoverType: dto.handoverType,
      },
    });

    // TODO: i will implement additional vendor escalation logic in later
    return { ...updatedWo, updated: updatedWo };
  }

  // ─────────────────────────────────────────────────────────────────
  // Vendor has completed the repair — technician/admin records the
  // return and moves to AWAITING_FEEDBACK for end-user review.
  // ─────────────────────────────────────────────────────────────────
  async markVendorCompleted(
    workOrderId: string,
    dto: VendorCompletedDto,
    ctx: AuditContext,
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { vendorRepair: true },
    });

    if (!wo) throw new NotFoundException('Work order not found');
    if (!wo.vendorRepair)
      throw new BadRequestException(
        'No vendor repair record found for this work order',
      );

    if (!['ESCALATED_TO_VENDOR', 'VENDOR_IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot mark vendor completed from status: ${wo.status}`,
      );
    }

    const returnDate = dto.returnDate ? new Date(dto.returnDate) : new Date();
    await this.prisma.$transaction([
      // Vendor repair finished — go straight to end-user review
      this.prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'AWAITING_FEEDBACK',
          statusDate: new Date(),
          completedDate: new Date(),
        },
      }),
      this.prisma.vendorRepair.update({
        where: { workOrderId },
        data: {
          returnDate,
          returnNotes: dto.returnNotes,
        },
      }),
    ]);

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description:
        `Vendor repair completed for work order ${workOrderId}. ` +
        `Equipment returned on ${returnDate.toISOString().split('T')[0]}. ` +
        (dto.returnNotes
          ? `Notes: ${dto.returnNotes}`
          : '') +
        ` Awaiting end-user repair review.`,
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: 'AWAITING_FEEDBACK',
        returnDate,
      },
    });

    return {
      workOrderId,
      status: 'AWAITING_FEEDBACK',
      updated: { id: workOrderId, status: 'AWAITING_FEEDBACK' },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Supervisor verifies and closes — works for BOTH tracks.
  // COMPLETED (internal) or VENDOR_COMPLETED (vendor) → VERIFIED_CLOSED
  // ─────────────────────────────────────────────────────────────────
  async verifyAndCloseWorkOrder(workOrderId: string, ctx: AuditContext) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!wo) throw new NotFoundException('Work order not found');

    const verifiableStatuses = ['COMPLETED', 'VENDOR_COMPLETED'];
    if (!verifiableStatuses.includes(wo.status)) {
      throw new BadRequestException(
        `Work order must be COMPLETED or VENDOR_COMPLETED before verification. Current: ${wo.status}`,
      );
    }

    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'VERIFIED_CLOSED',
        statusDate: new Date(),
      },
    });

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description:
        `Work order ${workOrderId} verified and closed by supervisor. ` +
        `Repair track: ${wo.repairTrack}.`,
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: 'VERIFIED_CLOSED',
        repairTrack: wo.repairTrack,
      },
    });

    // TODO: i will implement additional verification logic in later
    return {
      workOrderId,
      status: 'VERIFIED_CLOSED',
      updated: { id: workOrderId, status: 'VERIFIED_CLOSED' },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // POST-REPAIR CHAIN
  //   AWAITING_FEEDBACK --feedback OK--> PAYMENT_PENDING
  //   PAYMENT_PENDING   --payment-----> MS_APPROVAL
  //   MS_APPROVAL       --MS---------> RDHS_APPROVAL
  //   RDHS_APPROVAL     --RDHS-------> PDHS_APPROVAL
  //   PDHS_APPROVAL     --PDHD-------> VERIFIED_CLOSED (auto-close)
  // Feedback NOT ok sends the order back for rework:
  //   internal → IN_REPAIR, vendor → VENDOR_IN_PROGRESS
  // ─────────────────────────────────────────────────────────────────

  async submitFeedback(
    activeRole: JwtRoleClaim,
    workOrderId: string,
    dto: SubmitFeedbackDto,
    ctx: AuditContext,
  ) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
    });

    if (!wo) throw new NotFoundException('Work order not found');

    // Tolerate legacy records that still rest at COMPLETED/VENDOR_COMPLETED
    const reviewable = ['AWAITING_FEEDBACK', 'COMPLETED', 'VENDOR_COMPLETED'];
    if (!reviewable.includes(wo.status)) {
      throw new BadRequestException(
        `Repair review can only be submitted while awaiting feedback. Current: ${wo.status}`,
      );
    }

    const nextStatus = dto.approved
      ? 'PAYMENT_PENDING'
      : wo.repairTrack === 'VENDOR'
        ? 'VENDOR_IN_PROGRESS'
        : 'IN_REPAIR';

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: nextStatus,
        statusDate: new Date(),
        feedbackComment: dto.comment ?? wo.feedbackComment,
      },
    });

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description: dto.approved
        ? `End user approved the repair — work order moved to payment processing.`
        : `End user rejected the repair review — work order returned for rework.`,
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: nextStatus,
        approved: dto.approved,
        comment: dto.comment,
      },
    });

    return { workOrderId, status: nextStatus, updated };
  }

  async recordPayment(
    activeRole: JwtRoleClaim,
    workOrderId: string,
    dto: RecordPaymentDto,
    ctx: AuditContext,
  ) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
    });

    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'PAYMENT_PENDING') {
      throw new BadRequestException(
        `Payment can only be recorded after a successful repair review. Current: ${wo.status}`,
      );
    }

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'MS_APPROVAL',
        statusDate: new Date(),
        paymentComment: dto.comment ?? wo.paymentComment,
      },
    });

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description:
        `Payment recorded for work order ${workOrderId} — sent for MS approval.` +
        (dto.comment ? ` Remarks: ${dto.comment}` : ''),
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: 'MS_APPROVAL',
        comment: dto.comment,
      },
    });

    return { workOrderId, status: 'MS_APPROVAL', updated };
  }

  async approveStage(
    activeRole: JwtRoleClaim,
    workOrderId: string,
    dto: ApproveStageDto,
    ctx: AuditContext,
  ) {
    const transitions: Record<
      'MS' | 'RDHS' | 'PDHS',
      {
        from: string;
        to: string;
        field: 'msApprovalComment' | 'rdhsApprovalComment' | 'pdhsApprovalComment';
        label: string;
      }
    > = {
      MS: {
        from: 'MS_APPROVAL',
        to: 'RDHS_APPROVAL',
        field: 'msApprovalComment',
        label: 'Medical Superintendent',
      },
      RDHS: {
        from: 'RDHS_APPROVAL',
        to: 'PDHS_APPROVAL',
        field: 'rdhsApprovalComment',
        label: 'RDHS',
      },
      PDHS: {
        from: 'PDHS_APPROVAL',
        to: 'VERIFIED_CLOSED',
        field: 'pdhsApprovalComment',
        label: 'Provincial Director (PDHD)',
      },
    };

    const t = transitions[dto.stage];
    if (!t) throw new BadRequestException('Invalid approval stage');

    const scopeWhere = this.scopeService.scopeWhere(activeRole);
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
    });

    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== t.from) {
      throw new BadRequestException(
        `${t.label} approval can only be done from ${t.from}. Current: ${wo.status}`,
      );
    }

    const data: Record<string, unknown> = {
      status: t.to,
      statusDate: new Date(),
    };
    data[t.field] = dto.comment ?? (wo as any)[t.field];

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data,
    });

    await this.auditService.log(ctx, {
      action: 'STATUS_CHANGE',
      entityName: 'WorkOrder',
      recordId: workOrderId,
      description:
        `${t.label} approved the repair stage for work order ${workOrderId} — ` +
        (t.to === 'VERIFIED_CLOSED'
          ? 'verified and closed automatically.'
          : `now awaiting next approval (${t.to}).`) +
        (dto.comment ? ` Remarks: ${dto.comment}` : ''),
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: t.to,
        stage: dto.stage,
        comment: dto.comment,
      },
    });

    return { workOrderId, status: t.to, updated };
  }

  // ── SUBMIT REPAIR REQUEST ──────────────────────────────────────────
  async submitRepairRequest(
    activeRole: JwtRoleClaim,
    equipmentId: string,
    sparePartId: string | undefined,
    faultDescription: string,
    priority: RepairPriority,
    submittedByUserId: string,
  ) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    if (!equipment.assignedInstitutionId)
      throw new NotFoundException('Equipment not assigned to an institution');

    const user = await this.prisma.user.findUnique({
      where: { id: submittedByUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const institution = await this.prisma.institution.findUnique({
      where: { id: equipment.assignedInstitutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    let sparePartName: string | undefined;
    if (sparePartId) {
      const part = await this.prisma.equipmentSpareParts.findFirst({
        where: { id: sparePartId, equipmentId },
      });
      sparePartName = part?.name;
    }

    const [repairId, workOrderId] = await Promise.all([
      this.idService.generate(ID_PREFIXES.REPAIR_REQUEST),
      this.idService.generate(ID_PREFIXES.WORK_ORDER),
    ]);

    // All writes go inside the transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const repairRequest = await tx.repairRequest.create({
        data: {
          id: repairId,
          equipmentId,
          equipmentName: equipment.name,
          equipmentSerialNumber: equipment.serialNumber,
          sparePartId,
          sparePartName,
          faultDescription,
          priority,
          submittedByUserId: user.id,
          submittedByUserName: user.fullName,
          submissionDate: new Date(),
          institutionId: institution.id,
          institutionName: institution.name,
        },
      });

      // Bug in your code: you used `repairRequestId` but it was generated via `generateId('REQ')`
      // and never used. You should use `repairId` which is the actual PK you inserted.
      const workOrder = await tx.workOrder.create({
        data: {
          id: workOrderId,
          repairRequestId: repairId, // <- use the ID you just created
          assignedTechnicianId: null,
          institutionId: equipment.assignedInstitutionId,
          status: 'SUBMITTED',
          statusDate: new Date(),
        },
      });
      return { repairRequest, workOrder };
    });
    return result;
  }

  // ── FIND REPAIR REQUESTS ───────────────────────────────────────────
  async findRepairRequest(activeRole: JwtRoleClaim, query: any) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['id', 'faultDescription'],
      ['priority', 'workOrder.status'],
    );
    console.log('where', where);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.repairRequest.findMany({
        where,
        skip,
        take,
        include: {
          workOrder: true,
          equipment: { include: { servicePlan: true, spareParts: true } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.repairRequest.count({ where }),
    ]);
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  // ── FIND EQUIPMENT REPAIR HISTORY ──────────────────────────────────
  async findEquipmentRepairHistory(
    activeRole: JwtRoleClaim,
    query: QueryEquipmentRepairHistoryDto,
  ) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['faultDescription'],
      ['equipmentId'],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.repairRequest.findMany({
        where: { ...where, equipmentId: query.equipmentId },
        skip,
        take,
        include: {
          workOrder: {
            include: {
              partsUsed: { include: { inventoryItem: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.repairRequest.count({ where }),
    ]);

    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  // ── FIND WORK ORDER BY REPAIR REQUEST ──────────────────────────────
  async findWorkOrder(activeRole: JwtRoleClaim, requestId: string) {
    this.permissionService.require(
      activeRole.role,
      Permission.REPAIR_REQUEST_VIEW,
    );
    const where = this.scopeService.scopeWhere(activeRole);

    return this.prisma.workOrder.findFirst({
      where: { ...where, repairRequestId: requestId },
      include: {
        inspectedSpareParts: true,
        partsUsed: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }

  // ── FIND ALL WORK ORDERS ───────────────────────────────────────────
  async findWorkOrders(activeRole: JwtRoleClaim, query: QueryWorkOrderDto) {
    this.permissionService.require(
      activeRole.role,
      Permission.REPAIR_REQUEST_VIEW,
    );
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['assignedTechnicianName'],
      ['repairRequestId', 'status'],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take,
        include: {
          repairRequest: {
            include: {
              equipment: true,
              submittedByUser: true,
              institution: true,
            },
          },
          assignedTechnician: true,
          institution: true,
        },
        orderBy: { assignedTechnicianName: 'asc' },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  // ── UPDATE WORK ORDER STATUS ───────────────────────────────────────
  async updateWorkOrderStatus(
    activeRole: JwtRoleClaim,
    workOrderId: string,
    body: { status: string; payload?: any },
    ctx?: AuditContext,
  ) {
    const { status, payload = {} } = body;
    console.log('service received', status, payload);

    const auditCtx: AuditContext = ctx || {
      userId: (activeRole as any)?.sub || 'SYSTEM',
      userName: (activeRole as any)?.fullName || 'System',
      userRole: activeRole?.role || 'UNKNOWN',
    };

    // 1. Escalate to Vendor
    if (status === 'ESCALATED_TO_VENDOR') {
      return this.escalateToVendor(workOrderId, payload, auditCtx);
    }

    // 2. Mark Vendor Completed
    if (status === 'VENDOR_COMPLETED') {
      return this.markVendorCompleted(workOrderId, payload, auditCtx);
    }

    // 3. Supervisor Verify & Close
    if (status === 'VERIFIED_CLOSED') {
      return this.verifyAndCloseWorkOrder(workOrderId, auditCtx);
    }

    // TODO: i will implement additional status transition logic in later

    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
      include: { partsUsed: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const { inspectedSpareParts = [], ...mainPart } = payload;

    console.log(
      'service mainPart, inspectedSpareParts',
      mainPart,
      inspectedSpareParts,
    );

    const { partsUsed = [], ...updateWorkordertemp } = mainPart;
    console.log(
      'updateWorkordertemp, partsUsed',
      updateWorkordertemp,
      '\n partsUsed',
      partsUsed,
    );

    const updateData: any = {
      status,
      statusDate: new Date(),
      ...updateWorkordertemp,
    };
    if (status === 'COMPLETED') {
      // Repair finished — record completion and move straight to
      // end-user review (the post-repair chain starts here).
      updateData.completedDate = new Date();
      updateData.status = 'AWAITING_FEEDBACK';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: workOrderId },
        data: updateData,
      });
      console.log('saving', updateData);
      // Upsert inspected spare parts
      if (inspectedSpareParts && inspectedSpareParts.length > 0) {
        await Promise.all(
          inspectedSpareParts.map((part) =>
            tx.inspectedSparePart.upsert({
              where: {
                // this must match your @@unique constraint in schema
                workOrderId_sparePartId: {
                  workOrderId: workOrderId,
                  sparePartId: part.sparePartId,
                },
              },
              update: {
                inspected: part.inspected,
                conditionNotes: part.conditionNotes,
                sparePartName: part.sparePartName,
              },
              create: {
                sparePartId: part.sparePartId,
                sparePartName: part.sparePartName,
                inspected: part.inspected,
                conditionNotes: part.conditionNotes,
                workOrderId: workOrderId,
              },
            }),
          ),
        );
      }
      console.log('saving Part userd', partsUsed);
      await tx.partUsed.deleteMany({
        where: { workOrderId: workOrderId },
      });
      for (const [index, part] of partsUsed.entries()) {
        console.log('part to be saved ', part);
        await tx.partUsed.upsert({
          where: { id: part.inventoryItemId },
          update: { quantity: part.quantity },
          create: {
            id: workOrderId + '_' + index,
            description: part.description,
            quantity: part.quantity,
            workOrderId: workOrderId,
            inventoryItemId: part.inventoryItemId,
          },
        });
      }

      // Deduct inventory when work order is completed
      if (status === 'COMPLETED' && workOrder.partsUsed.length > 0) {
        for (const part of workOrder.partsUsed) {
          await tx.inventoryItem.update({
            where: { id: part.inventoryItemId },
            data: { currentStock: { decrement: part.quantity } },
          });
        }
      }
      return { ...updated, updated };
    });

    return result;
  }
}
