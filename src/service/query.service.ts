import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScopeService } from '../auth/scope.service';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import {
    QueryEquipmentDto, QueryEquipmentRepairHistoryDto, QueryInstitutionDto, QueryInventoryDto,
    QueryRepairRequestDto, QueryWorkOrdertDto
} from 'src/dto/index.dto';
import { PrismaQueryBuilder_v1 } from 'src/prismaQueryBuilder-v1';
import { Decimal } from '@prisma/client/runtime/client';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';

@Injectable()
export class QueryService {

    constructor(
        private prisma: PrismaService,
        private queryBuilder: PrismaQueryBuilder_v1,
        private permissionService: PermissionService,
        private scopeService: ScopeService) { }

    async organizationTree(activeRole: JwtRoleClaim) {
        const where = this.scopeService.instituteWhere(activeRole);
        const rdhsList = await this.prisma.district.findMany({
            where: {
                institutions: {
                    some: {}
                }
            }
        });
        const institutions = await this.prisma.institution.findMany({
            where,
            select: {
                id: true,
                name: true,
                type: true,
                districtId: true
            }
        });


        const grouped = new Map<string, any>();

        for (const inst of institutions) {
            if (inst.districtId === null) { continue };
            if (!grouped.has(inst.districtId)) {
                grouped.set(inst?.districtId, {
                    id: inst.districtId,
                    name: `RDHS ${inst.districtId}`,
                    type: 'RDHS',
                    institutionCount: 0,
                    children: new Map()
                });
            }

            const rdhs = grouped.get(inst.districtId);

            rdhs.institutionCount++;

            if (!rdhs.children.has(inst.type)) {

                rdhs.children.set(inst.type, {
                    id: inst.type,
                    name: inst.type,
                    type: 'CATEGORY',
                    institutionCount: 0
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
            children: Array.from(grouped.values()).map(r => ({
                ...r,
                children: Array.from(r.children.values())
            }))
        };

        const assetCount = await this.prisma.equipment.count({
            where: this.scopeService.equipmentWhere(activeRole)
        });
        const repairCount = await this.prisma.workOrder.count({
            where: {
                ...this.scopeService.scopeWhere(activeRole),
                status: {
                    not: 'Verified & Closed'
                }
            }
        });
        const [children, institutionCount] = await this.prisma.$transaction([
            this.prisma.institution.findMany({
                where,
                include: { district: true },
                orderBy: { name: 'asc' }
            }),

            this.prisma.institution.count({ where })
        ]);

        for (const rdhs of tree.children) {

            const instIds = institutions
                .filter(i => i.districtId === rdhs.id)
                .map(i => i.id);

            rdhs.assetCount = await this.prisma.equipment.count({
                where: {
                    assignedInstitutionId: { in: instIds }
                }
            });

            rdhs.repairCount = await this.prisma.workOrder.count({
                where: {
                    institutionId: { in: instIds },
                    status: { not: 'Verified & Closed' }
                }
            });
        }


        return tree;

    }

    async getDashboardSumarry(activeRole: JwtRoleClaim) {
        //this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);

        const totalAssets = await this.prisma.equipment.count({
            where: this.scopeService.equipmentWhere(activeRole)
        });

        const activeRepairs = await this.prisma.workOrder.count({
            where: {
                ...this.scopeService.scopeWhere(activeRole),
                status: {
                    not: 'Verified & Closed'
                }
            }
        });

        const pendingRequests = await this.prisma.workOrder.count({
            where: {
                ...this.scopeService.scopeWhere(activeRole),
                status: 'Submitted'
            }
        });

        const lowStockAlerts = await this.prisma.inventoryItem.count({
            where: {
                currentStock: {
                    lte: this.prisma.inventoryItem.fields.minStockThreshold
                }
            }
        });

        return {
            totalAssets,
            activeRepairs,
            pendingRequests,
            lowStockAlerts
        };

    }

    async getCategoryDistribution(activeRole: JwtRoleClaim) {
        //this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
        const categories =
            await this.prisma.equipment.groupBy({

                by: ['category'],

                where: this.scopeService.equipmentWhere(activeRole),

                _count: true
            });
        const total = categories.reduce(
            (s, c) => s + c._count,
            0
        );

        return categories.map(c => ({
            category: c.category,
            count: c._count,
            percent: Math.round(
                (c._count / total) * 100
            )
        }));

    }

    async getUrgentRepairs(activeRole: JwtRoleClaim) {
        //this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const urgentRepairs =
            await this.prisma.repairRequest.findMany({

                where: {
                    ...scopeWhere,

                    priority: {
                        in: ['Emergency', 'Urgent']
                    },

                    workOrders: {
                        some: {
                            status: {
                                not: 'Verified & Closed'
                            }
                        }
                    }
                },

                take: 5,

                include: {
                    institution: true,
                    equipment: true
                }
            });

        return { urgentRepairs };
    }
    async findDistrict(activeRole: JwtRoleClaim) {
        return this.prisma.district.findMany();
    }
    async findInstitute(activeRole: JwtRoleClaim, query: QueryInstitutionDto) {
        this.permissionService.require(activeRole.role, Permission.INSTITUTE_VIEW);
        const scopeWhere = this.scopeService.instituteWhere(activeRole);
        const { where, skip, take, page, size } =
            this.queryBuilder.build(
                query,
                scopeWhere,
                ['name'], ['districtId']
            );

        const [items, total] =
            await this.prisma.$transaction([
                this.prisma.institution.findMany({
                    where,
                    skip,
                    take,
                    include: { district: true },
                    orderBy: { name: 'asc' }
                }),

                this.prisma.institution.count({ where })
            ]);

        return {
            items,
            page: query.page,
            size: query.size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async findEquipment(activeRole: JwtRoleClaim, query: QueryEquipmentDto) {
        const scopeWhere = this.scopeService.equipmentWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['name', 'serialNumber', 'modelNumber'], ['category', 'status', 'assignedInstitutionId']
        );

        const [items, total] = await this.prisma.$transaction([
            this.prisma.equipment.findMany({
                where,
                skip,
                take,
                include: { assignedInstitution: true, spareParts: true, servicePlan: true },
                orderBy: { name: 'asc' }
            }),

            this.prisma.equipment.count({ where })
        ]);

        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async findRepairRequest(activeRole: JwtRoleClaim, query: QueryRepairRequestDto) {
        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['id', 'equipment.name', 'faultDescription'], ['priority', 'status']
        );


        const [items, total] = await this.prisma.$transaction([
            this.prisma.repairRequest.findMany({
                where,
                skip,
                take,
                include: {
                    institution: true,
                    equipment: {
                        include: { spareParts: true },
                    }
                },
                orderBy: { id: 'asc' }
            }),

            this.prisma.repairRequest.count({ where })
        ]);

        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async findEquipmentRepairHistory(activeRole: JwtRoleClaim, query: QueryEquipmentRepairHistoryDto) {

        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['faultDescription',], ['equipmentId']
        );
        console.log('repair History where ', where, query)
        const [items, total] = await this.prisma.$transaction([
            this.prisma.repairRequest.findMany({
                where: {...where,
                    equipmentId:query.equipmentId,
                },
                skip,
                take,
                include: {
                    workOrders: {
                        include: {
                            partsUsed: {
                                include: {
                                    inventoryItem: true,
                                },
                            },
                        },
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.repairRequest.count({ where })
        ]);
        console.log('history', items)
        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async findWorkOrders(activeRole: JwtRoleClaim, query: QueryWorkOrdertDto) {

        this.permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_VIEW);
        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['assignedTechnicianName'], ['repairRequestId', 'status']
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
                orderBy: { assignedTechnicianName: 'asc' }
            }),

            this.prisma.workOrder.count({ where })
        ]);

        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async inventoryItem(activeRole: JwtRoleClaim, query: QueryInventoryDto) {
        const { where, skip, take, page, size } =
            this.queryBuilder.build(
                query,
                {},
                ['name', 'category'], []
            );

        const [items, total] =
            await this.prisma.$transaction([
                this.prisma.inventoryItem.findMany({
                    where,
                    skip,
                    take: size,
                    orderBy: { name: 'asc' }
                }),

                this.prisma.inventoryItem.count({ where })
            ]);
        return convertDecimals({
            items,
            page: query.page,
            size: query.size,
            total,
            totalPages: Math.ceil(total / query.size)
        });
    }

    async auditLog(activeRole: JwtRoleClaim, query: any) {
        // const page = Number(query.page ?? 1);
        //const size = Number(query.size ?? 20);

        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['usename',], ['']
        );

        const [items, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { timestamp: 'desc' }
            }),

            this.prisma.auditLog.count({ where })
        ]);

        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };

    }
}

function convertDecimals(obj: any): any {

    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Decimal) {
        return Number(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(convertDecimals);
    }

    if (typeof obj === 'object') {

        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [
                k,
                convertDecimals(v)
            ])
        );
    }

    return obj;
}
