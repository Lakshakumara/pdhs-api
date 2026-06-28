import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PermissionService } from '../../auth/permission.service';
import { Permission } from '../../auth/permission.enum';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { IdService, ID_PREFIXES } from '../../shared/id/id.service';
import {
  QueryRepairRequestDto,
  QueryEquipmentRepairHistoryDto,
  QueryWorkOrderDto,
  RepairPriority,
} from './dto/repair.dto';

@Injectable()
export class RepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly permissionService: PermissionService,
    private readonly queryBuilder: PrismaQueryBuilder,
    private readonly idService: IdService,
  ) { }

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
          institutionId:institution.id,
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
  async findRepairRequest(activeRole: JwtRoleClaim, query: QueryRepairRequestDto) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['id', 'faultDescription'],
      ['priority', 'status'],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.repairRequest.findMany({
        where,
        skip,
        take,
        include: { workOrder: true },
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

    return this.prisma.workOrder.findMany({
      where: { ...where, repairRequestId: requestId },
      include: { inspectedSpareParts: true, partsUsed: true },
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
    body: { status: string; payload?: any },) {

    const { status, payload = {} } = body;
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, ...scopeWhere },
      include: { partsUsed: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const updateData: any = { status, statusDate: new Date(), ...payload };
    if (status === 'Completed') {
      updateData.completedDate = new Date();
    }

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
    });

    // Deduct inventory when work order is completed
    if (status === 'Completed' && workOrder.partsUsed.length > 0) {
      for (const part of workOrder.partsUsed) {
        await this.prisma.inventoryItem.update({
          where: { id: part.inventoryItemId },
          data: { currentStock: { decrement: part.quantity } },
        });
      }
    }

    return updated;
  }
}
