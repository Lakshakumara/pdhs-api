import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScopeService } from '../auth/scope.service';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import { QueryEquipmentDto, QueryInstitutionDto } from 'src/dto/index.dto';
import { Prisma } from '@prisma/client';
import { PrismaQueryBuilder_v1 } from 'src/prismaQueryBuilder-v1';


@Injectable()
export class QueryService {
    constructor(
        private prisma: PrismaService,
        private queryBuilder: PrismaQueryBuilder_v1,
        private permissionService: PermissionService,
        private scopeService: ScopeService) { }

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
        if (!items) {
            console.log('fetched Institute ', items)
        }

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
                include: { assignedInstitution: true, components:true, servicePlan:true },
                orderBy: { name: 'asc' }
            }),

            this.prisma.equipment.count({ where })
        ]);

        console.log('fetched equipment', total, items)
        return {
            items,
            page,
            size,
            total,
            totalPages: Math.ceil(total / query.size)
        };
    }
    /*
    before refactor
     async findEquipment(activeRole: any, query: QueryEquipmentDto) {
         console.log('received Query ', query)
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
 
 
         console.log('fetched data', items)
         return {
 
             items,
 
             page: query.page,
 
             size: query.size,
 
             total,
 
             totalPages: Math.ceil(total / query.size)
 
         };
     }*/
}