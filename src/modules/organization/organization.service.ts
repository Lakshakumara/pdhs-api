import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PermissionService } from '../../auth/permission.service';
import { Permission } from '../../auth/permission.enum';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { QueryInstitutionDto } from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly permissionService: PermissionService,
    private readonly queryBuilder: PrismaQueryBuilder,
  ) {}

  async findDistrict(_activeRole: JwtRoleClaim) {
    return this.prisma.district.findMany();
  }

  async findInstitute(activeRole: JwtRoleClaim, query: QueryInstitutionDto) {
    this.permissionService.require(activeRole.role, Permission.INSTITUTE_VIEW);
    const scopeWhere = this.scopeService.instituteWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['name'],
      ['districtId'],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.institution.findMany({
        where,
        skip,
        take,
        include: { district: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.institution.count({ where }),
    ]);

    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }
}
