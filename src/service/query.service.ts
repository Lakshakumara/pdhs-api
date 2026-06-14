import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScopeService } from '../auth/scope.service';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import { QueryEquipmentDto, QueryInstitutionDto, QueryInventoryDto, QueryWorkOrdertDto } from 'src/dto/index.dto';
import { Prisma } from '@prisma/client';
import { PrismaQueryBuilder_v1 } from 'src/prismaQueryBuilder-v1';
import { Decimal } from '@prisma/client/runtime/client';


@Injectable()
export class QueryService {
    constructor(
        private prisma: PrismaService,
        private queryBuilder: PrismaQueryBuilder_v1,
        private permissionService: PermissionService,
        private scopeService: ScopeService) { }

    async getDashboardSumarry(activeRole: any) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
        console.log('Where', this.scopeService.equipmentWhere(activeRole))
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

    async getCategoryDistribution(activeRole: { role: string; scopeType: string; scopeId: string; }) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
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

    async getUrgentRepairs(activeRole: { role: string; scopeType: string; scopeId: string; }) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
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

    async findInstitute(activeRole: any, query: QueryInstitutionDto) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
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

    async findEquipment(activeRole: any, query: QueryEquipmentDto) {

        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
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
                include: { assignedInstitution: true, components: true, servicePlan: true },
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

    async findRepairRequest(activeRole: any, query: QueryEquipmentDto) {

        this.permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_VIEW);
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
                        include: { components: true },
                    }
                },
                orderBy: { id: 'asc' }
            }),

            this.prisma.repairRequest.count({ where })
        ]);
        console.log('================================================================')
        console.log('fetched repair requests', total, items)
        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async findWorkOrders(activeRole: any, query: QueryWorkOrdertDto) {

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

        console.log('fetched work orders requests', total, items)
        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }

    async inventoryItem(activeRole: any, query: QueryInventoryDto) {
        this.permissionService.require(activeRole.role, Permission.INVENTORY_VIEW);
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



    /*
    before refactor
     async findEquipment(activeRole: any, query: QueryEquipmentDto) {
         this.permissionService.require(activeRole.role, Permission.EQUIPMENT_VIEW);
         const scopeWhere = this.scopeService.equipmentWhere(activeRole);
         const where: Prisma.EquipmentWhereInput = { ...scopeWhere };
 
         //
         // Name Search
         //
 
         if (query.search?.trim()) {
             where.name = {
                 contains: query.search.trim(),
                 mode: 'insensitive'
             };
         }
 
         //
         // Institution Filter
         //
 
         if (query.institutionId) {
             where.assignedInstitutionId = query.institutionId;
         }
 
         //
         // Assigned Institution Filter
         //
 
         if (query.assignedInstitutionId) {
             where.assignedInstitutionId = query.assignedInstitutionId;
         }
 
         const skip = (query.page - 1) * query.size;
 
         const take = query.size;
 
         const [items, total] =
             await this.prisma.$transaction([
                 this.prisma.equipment.findMany({
 
                     where,
 
                     skip,
 
                     take,
 
                     include: {
                         assignedInstitution: true
                     },
 
                     orderBy: {
                         name: 'asc'
                     }
 
                 }),
 
                 this.prisma.equipment.count({
                     where
                 })
             ]);
 
 
         return {
 
             items,
 
             page: query.page,
 
             size: query.size,
 
             total,
 
             totalPages: Math.ceil(total / query.size)
 
         };
     }*/
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