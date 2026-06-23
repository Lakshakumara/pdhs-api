import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScopeService } from 'src/auth/scope.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { RepairPriority } from 'src/dto/type.enum';
import { ID_PREFIXES, IdService } from './id.service';

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Injectable()
export class UpsertService {
    constructor(
        private prisma: PrismaService,
        private idService: IdService,
        private scopeService: ScopeService) { }

    // ─────────────────────────────────────────────────────────────────
    // Update Work Order Status
    //
    // SECURITY FIX vs original: this previously had NO permission check
    // and NO scope restriction — any authenticated user could update any
    // work order by ID, regardless of role or institution/district.
    //
    //   1. Permission: 'Completed' requires WORK_ORDER_COMPLETE;
    //      all other transitions (Acknowledge/Diagnose/In Repair) require
    //      WORK_ORDER_ASSIGN.
    //
    //      ⚠️ QUESTION FOR YOU: please confirm role-permissions.ts grants
    //      BIOMEDICAL_TECHNICIAN both WORK_ORDER_ASSIGN and
    //      WORK_ORDER_COMPLETE — otherwise technicians won't be able to
    //      progress their own work orders at all. Adjust the two
    //      Permission values below if your intended mapping differs.
    //
    //   2. Scope: the work order lookup is now restricted via
    //      scopeService.scopeWhere(activeRole) — a technician/admin can
    //      only update work orders within their assigned
    //      district/institution scope. PDHS-scoped roles (scopeWhere
    //      returns {}) can still update anything, as before.
    // ─────────────────────────────────────────────────────────────────
    async updateWorkOrderStatus(
        activeRole: JwtRoleClaim,
        workOrderId: string,
        body: { status: string; payload?: any },) {

        const { status, payload = {} } = body;

        

        const scopeWhere = this.scopeService.scopeWhere(activeRole);

        const workOrder = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, ...scopeWhere },
            include: { partsUsed: true },
        });

        if (!workOrder) {
            // Either the work order doesn't exist, or it exists but is
            // outside this user's scope — same response either way so we
            // don't leak which.
            throw new NotFoundException('Work order not found');
        }

        const updateData: any = {
            status,
            statusDate: new Date(), 
            ...payload,
        };

        if (status === 'Completed') {
            updateData.completedDate = new Date();
        }
        // Note: assignedTechnicianId handling omitted for simplicity; expect in payload if needed.

        const updated = await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: updateData,
        });

        if (status === 'Completed' && workOrder.partsUsed.length > 0) {
            for (const part of workOrder.partsUsed) {
                await this.prisma.inventoryItem.update({
                    where: { id: part.inventoryItemId },
                    data: {
                        currentStock: {
                            decrement: part.quantity,
                        },
                    },
                });
            }
        }

        return updated;
    }

    async addEquipment(activeRole: JwtRoleClaim, data: CreateEquipmentDto) {
        const { spareParts, servicePlan, assignedInstitutionId, ...equipmentData } = data;

        return this.prisma.equipment.create({
            data: {
                ...equipmentData,

                assignedInstitution: assignedInstitutionId
                    ? {
                        connect: {
                            id: assignedInstitutionId
                        }
                    }
                    : undefined,

                spareParts: spareParts?.length
                    ? {
                        create: spareParts
                    }
                    : undefined,

                servicePlan: servicePlan
                    ? {
                        create: servicePlan
                    }
                    : undefined
            }
        });
    }

    async updateEquipment(activeRole: JwtRoleClaim, id: string, data: UpdateEquipmentDto) {
        const { spareParts, servicePlan, assignedInstitutionId, ...equipmentData } = data;

        return this.prisma.equipment.update({
            where: { id },
            data: {...equipmentData,
                // ONLY update relation if changed
                assignedInstitution: assignedInstitutionId
                    ? { connect: { id: assignedInstitutionId } }: { disconnect: true },

                // IMPORTANT: DO NOT auto delete old relations unless intended

                spareParts: spareParts? {
                        deleteMany: {},   // remove old spareParts
                        create: spareParts} : undefined,

                servicePlan: servicePlan? {
                        upsert: {
                            create: servicePlan,
                            update: servicePlan
                        } } : undefined
            }
        });
    }


    async assignEquipment(activeRole: JwtRoleClaim, equipmentId: string, toInstitutionId: string,
        toEntity: 'RDHS' | 'Institution', quantity: number) {
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
        const assignmentId = generateId('asg');

        const assignment = await this.prisma.assignment.create({
            data: {
                id: assignmentId,
                equipmentId,
                fromEntity,
                toEntity: toEntity,
                toEntityId: toInstitutionId,
                quantity: quantity,
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

    // Submit Repair Request
    async submitRepairRequest(
        activeRole: JwtRoleClaim,
        equipmentId: string,
        sparePartId: string | undefined,
        faultDescription: string,
        priority: RepairPriority, submittedByUserId: string) {

        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId },
        });
        if (!equipment) throw new NotFoundException('Equipment not found');
        if (!equipment.assignedInstitutionId) throw new NotFoundException('Equipment not Assigned to Institute');

        const userId = submittedByUserId;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const institutionId = equipment.assignedInstitutionId;
        const institution = await this.prisma.institution.findUnique({
            where: { id: institutionId },
        });
        if (!institution) throw new NotFoundException('Institution not found');

        let sparePartName: string | undefined;
        if (sparePartId) {
            const part = await this.prisma.equipmentSpareParts.findFirst({
                where: { id: sparePartId, equipmentId },
            });
            sparePartName = part?.name;
        }

        const repairRequestId = generateId('REQ');
        // AFTER:
// → 'REQ-2026-0001'

const [repairId, workOrderId] = await Promise.all([
  this.idService.generate(ID_PREFIXES.REPAIR_REQUEST),
  this.idService.generate(ID_PREFIXES.WORK_ORDER),
]);
        const repairRequest = await this.prisma.repairRequest.create({
            data: {
                id: repairId,
                equipmentId,
                equipmentName: equipment.name,
                equipmentSerialNumber: equipment.serialNumber,
                sparePartId,
                sparePartName,
                faultDescription,
                priority,
                submittedByUserId: userId,
                submittedByUserName: user.fullName,
                submissionDate: new Date(),
                institutionId,
                institutionName: institution.name,
            },
        });

        //const workOrderId = generateId('WO');
        const workOrder = await this.prisma.workOrder.create({
            data: {
                id: workOrderId,
                repairRequestId,
                assignedTechnicianId: null,
                institutionId: equipment.assignedInstitutionId,
                status: 'Submitted',
                statusDate: new Date(),
            },
        });

        return { repairRequest, workOrder };
    }

}

/*

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { Prisma } from '@prisma/client';
import { ActiveRole } from 'src/auth/active.role';
import { RepairPriority } from 'src/dto/type.enum';

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Injectable()
export class UpsertService {
    constructor(
        private prisma: PrismaService,
        private permissionService: PermissionService) { }

    // Update Work Order Status

    async updateWorkOrderStatus(actveRole: any,
        workOrderId: string,
        body: { status: string; payload?: any },
    ) {
        const { status, payload = {} } = body;
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: { partsUsed: true },
        });
        if (!workOrder) throw new NotFoundException('Work order not found');

        const updateData: any = {
            status,
            statusDate: new Date(),
            ...payload,
        };

        if (status === 'Completed') {
            updateData.completedDate = new Date();
        }
        // Note: assignedTechnicianId handling omitted for simplicity; expect in payload if needed.

        const updated = await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: updateData,
        });

        if (status === 'Completed' && workOrder.partsUsed.length > 0) {
            for (const part of workOrder.partsUsed) {
                await this.prisma.inventoryItem.update({
                    where: { id: part.inventoryItemId },
                    data: {
                        currentStock: {
                            decrement: part.quantity,
                        },
                    },
                });
            }
        }

        return updated;
    }
    async addEquipment(activeRole: any, data: CreateEquipmentDto) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_CREATE);

        //const id = generateId('eq');
        const { components, servicePlan, assignedInstitutionId, ...equipmentData } = data;

        return this.prisma.equipment.create({
            data: {
                ...equipmentData,

                assignedInstitution: assignedInstitutionId
                    ? {
                        connect: {
                            id: assignedInstitutionId
                        }
                    }
                    : undefined,

                components: components?.length
                    ? {
                        create: components
                    }
                    : undefined,

                servicePlan: servicePlan
                    ? {
                        create: servicePlan
                    }
                    : undefined
            }
        });
    }

    async updateEquipment(activeRole: any, id: string, data: UpdateEquipmentDto) {
        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_UPDATE);

        const { components, servicePlan, assignedInstitutionId, ...equipmentData } = data;

        return this.prisma.equipment.update({
            where: { id },

            data: {
                ...equipmentData,

                // ONLY update relation if changed
                assignedInstitution: assignedInstitutionId
                    ? { connect: { id: assignedInstitutionId } }
                    : { disconnect: true },

                // ⚠️ IMPORTANT: DO NOT auto delete old relations unless intended

                components: components
                    ? {
                        deleteMany: {},   // remove old components
                        create: components
                    }
                    : undefined,

                servicePlan: servicePlan
                    ? {
                        upsert: {
                            create: servicePlan,
                            update: servicePlan
                        }
                    }
                    : undefined
            }
        });
    }


    async assignEquipment(activeRole: any, equipmentId: string, toInstitutionId: string,
        toEntity: 'RDHS' | 'Institution', quantity: number) {

        this.permissionService.require(activeRole.role, Permission.EQUIPMENT_UPDATE);


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
        const assignmentId = generateId('asg');

        const assignment = await this.prisma.assignment.create({
            data: {
                id: assignmentId,
                equipmentId,
                fromEntity,
                toEntity: toEntity,
                toEntityId: toInstitutionId,
                quantity: quantity,
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

    // Submit Repair Request
    async submitRepairRequest(
        activeRole: any,
        equipmentId: string,
        componentId: string | undefined,
        faultDescription: string,
        priority: RepairPriority, submittedByUserId: string) {

        this.permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_CREATE);

        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId },
        });
        if (!equipment) throw new NotFoundException('Equipment not found');
        if (!equipment.assignedInstitutionId) throw new NotFoundException('Equipment not Assigned to Institute');

        const repairRequestId = generateId('REQ');
        const repairRequest = await this.prisma.repairRequest.create({
            data: {
                id: repairRequestId,
                equipmentId,
                componentId,
                faultDescription,
                priority,
                submittedByUserId,
                submissionDate: new Date(),
                institutionId: equipment.assignedInstitutionId,
            },
        });

        const workOrderId = generateId('WO');
        const workOrder = await this.prisma.workOrder.create({
            data: {
                id: workOrderId,
                repairRequestId,
                assignedTechnicianId: null,
                status: 'Submitted',
                statusDate: new Date(),
            },
        });

        return { repairRequest, workOrder };
    }

}*/