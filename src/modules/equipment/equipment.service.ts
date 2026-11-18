import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { IdService, ID_PREFIXES } from '../../shared/id/id.service';
import {
  CreateEquipmentDto,
  QueryEquipmentDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';
import { AuditContext } from '../../common/utils/audit-context.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly queryBuilder: PrismaQueryBuilder,
    private readonly idService: IdService,
    private readonly auditService: AuditService,
  ) {}

  // ── QUERY ─────────────────────────────────────────────────────────
  async findEquipment(activeRole: JwtRoleClaim, query: QueryEquipmentDto) {
    const scopeWhere = this.scopeService.equipmentWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['name', 'serialNumber', 'modelNumber'],
      ['category', 'status', 'assignedInstitutionId', 'supplierId'],
    );

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take,
        include: {
          assignedInstitution: true,
          spareParts: true,
          servicePlan: true,
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              contactPhone: true,
              contactEmail: true,
              rating: true,
              contactPerson: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);
    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  // ── CREATE ────────────────────────────────────────────────────────
  async addEquipment(
    activeRole: JwtRoleClaim,
    data: CreateEquipmentDto,
    ctx?: AuditContext,
  ) {
    const {
      spareParts,
      servicePlan,
      assignedInstitutionId,
      supplierId,
      ...equipmentData
    } = data;

    let resolvedSupplierName = equipmentData.supplierName;
    if (supplierId && !resolvedSupplierName) {
      const sup = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { name: true },
      });
      if (sup) resolvedSupplierName = sup.name;
    }

    const equipment = await this.prisma.equipment.create({
      data: {
        ...equipmentData,
        supplierName: resolvedSupplierName,
        assignedInstitution: assignedInstitutionId
          ? { connect: { id: assignedInstitutionId } }
          : undefined,
        supplier: supplierId
          ? { connect: { id: supplierId } }
          : undefined,
        spareParts: spareParts?.length ? { create: spareParts } : undefined,
        servicePlan: servicePlan ? { create: servicePlan } : undefined,
      },
      include: {
        assignedInstitution: true,
        supplier: true,
        spareParts: true,
        servicePlan: true,
      },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'CREATE',
        entityName: 'Equipment',
        recordId: equipment.id,
        description: `Created equipment "${equipment.name}" (${equipment.serialNumber ?? 'no serial'})`,
        institutionId: equipment.assignedInstitutionId ?? undefined,
      });
    }

    return equipment;
  }

  // ── UPDATE ────────────────────────────────────────────────────────
  async updateEquipment(
    activeRole: JwtRoleClaim,
    id: string,
    data: UpdateEquipmentDto,
    ctx?: AuditContext,
  ) {
    const {
      spareParts,
      servicePlan,
      assignedInstitutionId,
      supplierId,
      ...equipmentData
    } = data;

    let resolvedSupplierName = equipmentData.supplierName;
    if (supplierId && !resolvedSupplierName) {
      const sup = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { name: true },
      });
      if (sup) resolvedSupplierName = sup.name;
    }

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: {
        ...equipmentData,
        ...(resolvedSupplierName !== undefined
          ? { supplierName: resolvedSupplierName }
          : {}),
        assignedInstitution:
          assignedInstitutionId !== undefined
            ? assignedInstitutionId
              ? { connect: { id: assignedInstitutionId } }
              : { disconnect: true }
            : undefined,
        supplier:
          supplierId !== undefined
            ? supplierId
              ? { connect: { id: supplierId } }
              : { disconnect: true }
            : undefined,
        spareParts: spareParts
          ? { deleteMany: {}, create: spareParts }
          : undefined,
        servicePlan: servicePlan
          ? { upsert: { create: servicePlan, update: servicePlan } }
          : undefined,
      },
      include: {
        assignedInstitution: true,
        supplier: true,
        spareParts: true,
        servicePlan: true,
      },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'UPDATE',
        entityName: 'Equipment',
        recordId: updated.id,
        description: `Updated equipment "${updated.name}"`,
        institutionId: updated.assignedInstitutionId ?? undefined,
      });
    }

    return updated;
  }

  // ── ASSIGN ────────────────────────────────────────────────────────
  async assignEquipment(
    activeRole: JwtRoleClaim,
    equipmentId: string,
    toInstitutionId: string,
    toEntity: 'RDHS' | 'Institution',
    quantity: number,
    ctx?: AuditContext,
  ) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { assignedInstitution: true },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const institution = await this.prisma.institution.findUnique({
      where: { id: toInstitutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    const fromEntity = equipment.status === 'PDHS Store' ? 'PDHS' : 'RDHS';
    const assignmentId = await this.idService.generate(ID_PREFIXES.ASSIGNMENT);

    const assignment = await this.prisma.assignment.create({
      data: {
        id: assignmentId,
        equipmentId,
        fromEntity,
        toEntity,
        toEntityId: toInstitutionId,
        quantity,
        assignmentDate: new Date(),
        status: 'Acknowledged',
      },
    });

    await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: 'Assigned',
        assignedInstitutionId: toInstitutionId,
      },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'ASSIGN',
        entityName: 'Equipment',
        recordId: equipmentId,
        description: `Assigned ${quantity} × "${equipment.name}" to ${toEntity} (${institution.name})`,
        institutionId: toInstitutionId,
        metadata: {
          fromEntity,
          toEntity,
          toEntityId: toInstitutionId,
          quantity,
          assignmentId,
        },
      });
    }

    return assignment;
  }
}
