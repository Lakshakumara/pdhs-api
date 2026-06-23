import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ScopeService } from '../auth/scope.service';
import { PermissionService } from 'src/auth/permission.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class EquipmentService {

  constructor(
    private prisma: PrismaService,
    private scopeService: ScopeService) { }
/*
async findById(
    id: string,
    activeRole: any
  ) {

    const where =
      this.scopeService.equipmentWhere(
        activeRole
      );

    const item =
      await this.prisma.equipment.findFirst({
        where: {
          id,
          ...where
        },
        include: {
          servicePlan: true,
          components: true,
          assignedInstitution: true
        }
      });

    if (!item) {
      throw new NotFoundException(
        'Inventory item not found'
      );
    }

    return item;
  }

  async create(
    dto: any
  ) {
    return this.prisma.equipment.create({
      data: dto
    });
  }

  async update(
    id: string,
    dto: any,
    activeRole: any
  ) {

    await this.findById(id, activeRole);

    return this.prisma.equipment.update({
      where: { id },
      data: dto
    });
  }

  async delete(
    id: string,
    activeRole: any
  ) {

    await this.findById(id, activeRole);

    await this.prisma.equipment.delete({
      where: { id }
    });
  }*/
  /*
    async addStock(
      id: string,
      quantity: number,
      activeRole: any
    ) {
  
      const item =
        await this.findById(id, activeRole);
  
      return this.prisma.equipment.update({
        where: {
          id
        },
        data: {
          quantityReceived:
            item.quantityReceived + quantity
        }
      });
    }
  
    async deductStock(
      id: string,
      quantity: number,
      activeRole: any
    ) {
  
      const item =
        await this.findById(id, activeRole);
  
      const newQty =
        Math.max(
          0,
          item.currentStock - quantity
        );
  
      return this.prisma.inventoryItem.update({
        where: {
          id
        },
        data: {
          currentStock: newQty
        }
      });
    }
  
    async getLowStock(
      activeRole: any
    ) {
  
      const where =
        this.scopeService.buildInventoryWhere(
          activeRole
        );
  
      return this.prisma.inventoryItem.findMany({
        where: {
          ...where,
          currentStock: {
            lte: 10
          }
        }
      });
    }*/
}