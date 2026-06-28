import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { BaseQueryDto } from '../../shared/dto/base-query.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly queryBuilder: PrismaQueryBuilder,
  ) {}

  async findAuditLogs(activeRole: JwtRoleClaim, query: BaseQueryDto) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      scopeWhere,
      ['username'],
      [],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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
