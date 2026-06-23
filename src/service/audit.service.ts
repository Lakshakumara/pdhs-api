import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

export interface AuditContext {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

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

// ───────────────────────────────────────────────────────────────────────
// AuditService — the only place audit_logs rows get created.
//
// Call from a service AFTER a write succeeds (only successful actions
// are logged):
//
//   const updated = await this.prisma.equipment.update(...);
//   await this.auditService.log(buildAuditContext(req), {
//     action: 'UPDATE',
//     entityName: 'Equipment',
//     recordId: updated.id,
//     description: `Updated warranty period for ${updated.name} to ${updated.warrantyPeriodMonths} months`,
//     institutionId: updated.assignedInstitutionId ?? undefined,
//   });
//   return updated;
// ───────────────────────────────────────────────────────────────────────
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

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
