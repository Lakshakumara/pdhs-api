import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { IdService, ID_PREFIXES } from '../../shared/id/id.service';
import { CreateEquipmentDto, QueryEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly queryBuilder: PrismaQueryBuilder,
    private readonly idService: IdService,
  ) {}

  // ── QUERY ─────────────────────────────────────────────────────────
  async findEquipment(activeRole: JwtRoleClaim, query: QueryEquipmentDto) {
    const scopeWhere = this.scopeService.equipmentWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['name', 'serialNumber', 'modelNumber'],
      ['category', 'status', 'assignedInstitutionId'],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.equipment.findMany({
        where,
        skip,
        take,
        include: { assignedInstitution: true, spareParts: true, servicePlan: true },
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
  async addEquipment(activeRole: JwtRoleClaim, data: CreateEquipmentDto) {
    const { spareParts, servicePlan, assignedInstitutionId, ...equipmentData } = data;

    return this.prisma.equipment.create({
      data: {
        ...equipmentData,
        assignedInstitution: assignedInstitutionId
          ? { connect: { id: assignedInstitutionId } }
          : undefined,
        spareParts: spareParts?.length ? { create: spareParts } : undefined,
        servicePlan: servicePlan ? { create: servicePlan } : undefined,
      },
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────
  async updateEquipment(activeRole: JwtRoleClaim, id: string, data: UpdateEquipmentDto) {
    const { spareParts, servicePlan, assignedInstitutionId, ...equipmentData } = data;

    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...equipmentData,
        assignedInstitution: assignedInstitutionId
          ? { connect: { id: assignedInstitutionId } }
          : { disconnect: true },
        spareParts: spareParts
          ? { deleteMany: {}, create: spareParts }
          : undefined,
        servicePlan: servicePlan
          ? { upsert: { create: servicePlan, update: servicePlan } }
          : undefined,
      },
    });
  }

  // ── ASSIGN ────────────────────────────────────────────────────────
  async assignEquipment(
    activeRole: JwtRoleClaim,
    equipmentId: string,
    toInstitutionId: string,
    toEntity: 'RDHS' | 'Institution',
    quantity: number,
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

    return assignment;
  }
}
