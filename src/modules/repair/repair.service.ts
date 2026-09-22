import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  ) { }


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
    if (wo.status !== 'DIAGNOSED') {
      throw new BadRequestException(
        `Can only escalate to vendor from DIAGNOSED status. Current status: ${wo.status}`,
      );
    }

    // Validate handover-type-specific fields
    if (dto.handoverType === 'EQUIPMENT_SENT' && !dto.dispatchDate) {
      throw new BadRequestException('dispatchDate is required when handoverType is EQUIPMENT_SENT');
    }
    if (dto.handoverType === 'FIELD_VISIT' && !dto.scheduledDate) {
      throw new BadRequestException('scheduledDate is required when handoverType is FIELD_VISIT');
    }

    const vendorRepairId = await this.idService.generate(ID_PREFIXES.VENDOR_REPAIR);

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
          dispatchDate: dto.dispatchDate,
          dispatchedBy: dto.dispatchedBy,
          courierRef: dto.courierRef,
          scheduledDate: dto.scheduledDate,
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

    return updatedWo;
  }

  // ─────────────────────────────────────────────────────────────────
  // Vendor has completed the repair — technician/admin records the
  // return and moves to VENDOR_COMPLETED for supervisor sign-off.
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
    if (!wo.vendorRepair) throw new BadRequestException('No vendor repair record found for this work order');

    if (!['ESCALATED_TO_VENDOR', 'VENDOR_IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot mark vendor completed from status: ${wo.status}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'VENDOR_COMPLETED',
          statusDate: new Date(),
        },
      }),
      this.prisma.vendorRepair.update({
        where: { workOrderId },
        data: {
          returnDate: dto.returnDate,
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
        `Equipment returned on ${dto.returnDate.toISOString().split('T')[0]}. ` +
        (dto.returnNotes ? `Notes: ${dto.returnNotes}` : 'Awaiting supervisor verification.'),
      institutionId: wo.institutionId ?? undefined,
      metadata: {
        previousStatus: wo.status,
        newStatus: 'VENDOR_COMPLETED',
        returnDate: dto.returnDate,
      },
    });

    return { workOrderId, status: 'VENDOR_COMPLETED' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Supervisor verifies and closes — works for BOTH tracks.
  // COMPLETED (internal) or VENDOR_COMPLETED (vendor) → VERIFIED_CLOSED
  // ─────────────────────────────────────────────────────────────────
  async verifyAndCloseWorkOrder(
    workOrderId: string,
    ctx: AuditContext,
  ) {
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

    return { workOrderId, status: 'VERIFIED_CLOSED' };
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

    const user = await this.prisma.user.findUnique({ where: { id: submittedByUserId } });
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
          status: 'Submitted',
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
      ['id', 'faultDescription',],
      ['priority', 'workOrder.status'],
    );
    console.log('where', where)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.repairRequest.findMany({
        where,
        skip,
        take,
        include: {
          workOrder: true,
          equipment: { include: { servicePlan: true, spareParts: true } }
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
    this.permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_VIEW);
    const where = this.scopeService.scopeWhere(activeRole);

    return this.prisma.workOrder.findFirst({
      where: { ...where, repairRequestId: requestId },
      include:
      {
        inspectedSpareParts: true, partsUsed: {
          include:
          {
            inventoryItem: true
          }
        }
      },
    });
  }

  // ── FIND ALL WORK ORDERS ───────────────────────────────────────────
  async findWorkOrders(activeRole: JwtRoleClaim, query: QueryWorkOrderDto) {
    this.permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_VIEW);
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
            include: { equipment: true, submittedByUser: true, institution: true },
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
  ) {
    const { status, payload = {} } = body;
    console.log('service received', status, payload)

    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
      include: { partsUsed: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const { inspectedSpareParts = [], ...mainPart } = payload;

    console.log('service mainPart, inspectedSpareParts', mainPart, inspectedSpareParts)

    const { partsUsed = [], ...updateWorkordertemp } = mainPart;
    console.log('updateWorkordertemp, partsUsed',
      updateWorkordertemp, '\n partsUsed', partsUsed)

    const updateData: any = { status, statusDate: new Date(), ...updateWorkordertemp };
    if (status === 'Completed') {
      updateData.completedDate = new Date();
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: workOrderId },
        data: updateData,
      });
      console.log('saving', updateData)
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
            })
          )
        );
      }
      console.log('saving Part userd', partsUsed)
      await tx.partUsed.deleteMany({
        where: { workOrderId: workOrderId }
      });
      for (const [index, part] of partsUsed.entries()) {
        console.log("part to be saved ", part)
        await tx.partUsed.upsert({
          where: { id: part.inventoryItemId },
          update: { quantity: part.quantity, },
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
      if (status === 'Completed' && workOrder.partsUsed.length > 0) {
        for (const part of workOrder.partsUsed) {
          await tx.inventoryItem.update({
            where: { id: part.inventoryItemId },
            data: { currentStock: { decrement: part.quantity } },
          });
        }
      }
      return { updated };
    });

    return result;
  }

}
