import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../auth/scope.service';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
  ) {}

  async getDashboardSummary(activeRole: JwtRoleClaim) {
    const totalAssets = await this.prisma.equipment.count({
      where: this.scopeService.equipmentWhere(activeRole),
    });

    const activeRepairs = await this.prisma.workOrder.count({
      where: {
        ...this.scopeService.scopeWhere(activeRole),
        status: { not: 'Verified & Closed' },
      },
    });

    const pendingRequests = await this.prisma.workOrder.count({
      where: {
        ...this.scopeService.scopeWhere(activeRole),
        status: 'Submitted',
      },
    });

    const lowStockAlerts = await this.prisma.inventoryItem.count({
      where: {
        currentStock: {
          lte: this.prisma.inventoryItem.fields.minStockThreshold,
        },
      },
    });

    return { totalAssets, activeRepairs, pendingRequests, lowStockAlerts };
  }

  async getCategoryDistribution(activeRole: JwtRoleClaim) {
    const categories = await this.prisma.equipment.groupBy({
      by: ['category'],
      where: this.scopeService.equipmentWhere(activeRole),
      _count: true,
    });

    const total = categories.reduce((s, c) => s + c._count, 0);

    return categories.map((c) => ({
      category: c.category,
      count: c._count,
      percent: Math.round((c._count / total) * 100),
    }));
  }

  async getUrgentRepairs(activeRole: JwtRoleClaim) {
    const scopeWhere = this.scopeService.scopeWhere(activeRole);

    const urgentRepairs = await this.prisma.repairRequest.findMany({
      where: {
        ...scopeWhere,
        priority: { in: ['Emergency', 'Urgent'] },
        workOrder: { status: { not: 'Verified & Closed' } },
      },
      take: 5,
      include: { institution: true, equipment: true },
    });

    return { urgentRepairs };
  }

  async organizationTree(activeRole: JwtRoleClaim) {
    const where = this.scopeService.instituteWhere(activeRole);

    const institutions = await this.prisma.institution.findMany({
      where,
      select: { id: true, name: true, type: true, districtId: true },
    });

    const grouped = new Map<string, any>();

    for (const inst of institutions) {
      if (inst.districtId === null) continue;
      if (!grouped.has(inst.districtId)) {
        grouped.set(inst.districtId, {
          id: inst.districtId,
          name: `RDHS ${inst.districtId}`,
          type: 'RDHS',
          institutionCount: 0,
          children: new Map(),
        });
      }
      const rdhs = grouped.get(inst.districtId);
      rdhs.institutionCount++;
      if (!rdhs.children.has(inst.type)) {
        rdhs.children.set(inst.type, {
          id: inst.type,
          name: inst.type,
          type: 'CATEGORY',
          institutionCount: 0,
        });
      }
      rdhs.children.get(inst.type).institutionCount++;
    }

    const tree = {
      id: 'pdhs_sabaragamuwa',
      name: 'PDHS Sabaragamuwa',
      type: 'PDHS',
      institutionCount: institutions.length,
      assetCount: 0,
      repairCount: 0,
      children: Array.from(grouped.values()).map((r) => ({
        ...r,
        children: Array.from(r.children.values()),
      })),
    };

    tree.assetCount = await this.prisma.equipment.count({
      where: this.scopeService.equipmentWhere(activeRole),
    });
    tree.repairCount = await this.prisma.workOrder.count({
      where: {
        ...this.scopeService.scopeWhere(activeRole),
        status: { not: 'Verified & Closed' },
      },
    });

    for (const rdhs of tree.children) {
      const instIds = institutions
        .filter((i) => i.districtId === rdhs.id)
        .map((i) => i.id);

      rdhs.assetCount = await this.prisma.equipment.count({
        where: { assignedInstitutionId: { in: instIds } },
      });
      rdhs.repairCount = await this.prisma.workOrder.count({
        where: {
          institutionId: { in: instIds },
          status: { not: 'Verified & Closed' },
        },
      });
    }

    return tree;
  }
}
