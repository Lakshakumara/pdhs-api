import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { BaseQueryDto } from '../../shared/dto/base-query.dto';
import { AuditContext } from 'src/common/utils/audit-context.util';
import { randomUUID } from 'crypto';

export interface AuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'STATUS_CHANGE' | string;
  entityName: string;
  recordId: string;
  description: string;
  institutionId?: string;
  scopeType?: string;
  scopeId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
    private readonly queryBuilder: PrismaQueryBuilder,
  ) { }

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

  async log(ctx: AuditContext, entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: ctx.userId,
        userName: ctx.userName,
        userRole: ctx.userRole,
        ipAddress: ctx.ipAddress,
        action: entry.action,
        entityName: entry.entityName,
        recordId: entry.recordId,
        description: entry.description,
        institutionId: entry.institutionId,
        scopeType: entry.scopeType,
        scopeId: entry.scopeId,
        metadata: entry.metadata as any,
      },
    });
  }
}
