import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { IdService, ID_PREFIXES } from '../../shared/id/id.service';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../../common/utils/audit-context.util';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import {
  CreateInstituteDto,
  QueryInstituteDto,
  UpdateInstituteDto,
} from './dto/institute.dto';

@Injectable()
export class InstituteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly idService: IdService,
    private readonly auditService: AuditService,
  ) {}

  async findDistricts(_activeRole?: JwtRoleClaim) {
    return this.prisma.district.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findInstitutions(activeRole: JwtRoleClaim, query: QueryInstituteDto) {
    const scopeWhere = this.scopeService.instituteWhere(activeRole);

    const where: any = { ...scopeWhere };

    const search = (query.search || query.name)?.trim();
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (query.type && query.type.trim()) {
      where.type = query.type.trim();
    }

    if (query.districtId && query.districtId.trim()) {
      where.districtId = query.districtId.trim();
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 10);
    const skip = (page - 1) * size;
    const take = size;
    const orderBy: any = query.sortBy
      ? { [query.sortBy]: query.sortOrder ?? 'asc' }
      : { name: 'asc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.institution.findMany({
        where,
        skip,
        take,
        include: { district: true },
        orderBy,
      }),
      this.prisma.institution.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getInstitutionById(id: string, _activeRole?: JwtRoleClaim) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: { district: true },
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID "${id}" not found`);
    }

    return institution;
  }

  async createInstitution(dto: CreateInstituteDto, ctx?: AuditContext) {
    const id = await this.idService.generate(ID_PREFIXES.INSTITUTION);

    const institution = await this.prisma.institution.create({
      data: {
        id,
        name: dto.name.trim(),
        type: dto.type.trim(),
        districtId: dto.districtId || null,
        email: dto.email || null,
        tp: dto.tp || null,
        active: dto.active ?? true,
      },
      include: { district: true },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'CREATE',
        entityName: 'Institution',
        recordId: institution.id,
        institutionId: institution.id,
        description: `Created institution: ${institution.name} (${institution.type})`,
        metadata: {
          id: institution.id,
          name: institution.name,
          type: institution.type,
          districtId: institution.districtId,
        },
      });
    }

    return institution;
  }

  async updateInstitution(
    id: string,
    dto: UpdateInstituteDto,
    ctx?: AuditContext,
  ) {
    const existing = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Institution with ID "${id}" not found`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type.trim();
    if (dto.districtId !== undefined) data.districtId = dto.districtId || null;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.tp !== undefined) data.tp = dto.tp || null;
    if (dto.active !== undefined) data.active = dto.active;

    const updated = await this.prisma.institution.update({
      where: { id },
      data,
      include: { district: true },
    });

    if (ctx) {
      await this.auditService.log(ctx, {
        action: 'UPDATE',
        entityName: 'Institution',
        recordId: updated.id,
        institutionId: updated.id,
        description: `Updated institution: ${updated.name}`,
        metadata: {
          previous: {
            name: existing.name,
            type: existing.type,
            districtId: existing.districtId,
            active: existing.active,
          },
          updated: {
            name: updated.name,
            type: updated.type,
            districtId: updated.districtId,
            active: updated.active,
          },
        },
      });
    }

    return updated;
  }

  async deleteInstitution(id: string, ctx?: AuditContext) {
    const inst = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            equipment: true,
            users: true,
            repairRequests: true,
            workOrders: true,
          },
        },
      },
    });

    if (!inst) {
      throw new NotFoundException(`Institution with ID "${id}" not found`);
    }

    const hasRelations =
      inst._count.equipment > 0 ||
      inst._count.users > 0 ||
      inst._count.repairRequests > 0 ||
      inst._count.workOrders > 0;

    let result;
    if (hasRelations) {
      result = await this.prisma.institution.update({
        where: { id },
        data: { active: false },
      });
    } else {
      result = await this.prisma.institution.delete({
        where: { id },
      });
    }

    if (ctx) {
      await this.auditService.log(ctx, {
        action: hasRelations ? 'DEACTIVATE' : 'DELETE',
        entityName: 'Institution',
        recordId: id,
        institutionId: id,
        description: `${hasRelations ? 'Deactivated' : 'Deleted'} institution: ${inst.name}`,
        metadata: { hasRelations },
      });
    }

    return result;
  }
}
