import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { Prisma } from '@prisma/client';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Injectable()
export class UpsertService {
    constructor(
        private prisma: PrismaService,
        private permissionService: PermissionService) { }

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
         toEntity: 'RDHS' | 'Institution', quantity: number ) {

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

    }