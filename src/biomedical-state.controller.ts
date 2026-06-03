import { Controller, Get, Post, Body, Put, Param, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Controller('biomedical-state')
export class BiomedicalStateController {
  constructor(private prisma: PrismaService) { }

  // Districts
  @Get('districts')
  async getDistricts() {
    return this.prisma.district.findMany();
  }

  // Institutions
  @Get('institutions')
  async getInstitutions() {
    return this.prisma.institution.findMany({
      include: { district: true },
    });
  }

  // Users
  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      include: { roles: true, institution: true },
    });
  }

  // Equipment
  @Get('equipment')
  async getEquipment() {
    return this.prisma.equipment.findMany({
      include: {
        servicePlan: true,
        components: true,
        assignedInstitution: true,
      },
    });
  }

  // Repair Requests
  @Get('repair-requests')
  async getRepairRequests() {
    return this.prisma.repairRequest.findMany({
      include: {
        equipment: true,
        submittedByUser: true,
        institution: true,
      },
    });
  }

  // Work Orders
  @Get('work-orders')
  async getWorkOrders() {
    return this.prisma.workOrder.findMany({
      include: {
        repairRequest: {
          include: { equipment: true, submittedByUser: true, institution: true },
        },
        assignedTechnician: true,
        institution: true,
      },
    });
  }

  // Suppliers
  @Get('suppliers')
  async getSuppliers() {
    return this.prisma.supplier.findMany();
  }

  // Inventory Items
  @Get('inventory-items')
  async getInventoryItems() {
    return this.prisma.inventoryItem.findMany();
  }

  // Procurement Plans
  @Get('procurement-plans')
  async getProcurementPlans() {
    return this.prisma.procurementPlan.findMany();
  }

  // Purchase Orders
  @Get('purchase-orders')
  async getPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        plan: true,
        supplier: true,
        items: true,
      },
    });
  }

  // GRNs
  @Get('grns')
  async getGrns() {
    return this.prisma.grn.findMany();
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: { user: true, institution: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Assignments
  @Get('assignments')
  async getAssignments() {
    return this.prisma.assignment.findMany({
      include: {
        equipment: true,
      },
    });
  }

  // === Creation / Update endpoints ===

  // Add Equipment
  @Post('equipment')
  async addEquipment(@Body() data: any) {
    const id = generateId('eq');
    const { components, servicePlan, ...equipmentData } = data;
    console.log("add eqipment ", equipmentData)
    console.log("add eqipment ", components)
    return this.prisma.equipment.create({
      data: {
        id,
        ...equipmentData,
        components: {
          create: components
        },
        servicePlan: servicePlan ? {
          create: servicePlan
        } : undefined
      }
    });
  }

  // Update Equipment
  @Put('equipment/:id')
  async updateEquipment(@Param('id') id: string, @Body() data: any) {
    const { components, servicePlan, ...equipmentData } = data;
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...equipmentData,
        servicePlan: servicePlan ? {
          upsert: {
            create: servicePlan,
            update: servicePlan
          }
        } : undefined
      }
    });
  }

  // Assign Equipment
  @Post('equipment/:id/assign')
  async assignEquipment(
    @Param('id') equipmentId: string,
    @Body() body: { toInstitutionId: string; toEntity: 'RDHS' | 'Institution'; quantity: number },
  ) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { assignedInstitution: true },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const institution = await this.prisma.institution.findUnique({
      where: { id: body.toInstitutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    const fromEntity = equipment.status === 'PDHS Store' ? 'PDHS' : 'RDHS';
    const assignmentId = generateId('asg');

    const assignment = await this.prisma.assignment.create({
      data: {
        id: assignmentId,
        equipmentId,
        fromEntity,
        toEntity: body.toEntity,
        toEntityId: body.toInstitutionId,
        quantity: body.quantity,
        assignmentDate: new Date(),
        status: 'Acknowledged',
      },
    });

    await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: 'Assigned',
        assignedInstitutionId: body.toInstitutionId,
      },
    });

    return assignment;
  }

  // Submit Repair Request
  @Post('repair-requests')
  async submitRepairRequest(@Body() body: any) {
    const { equipmentId, componentId, faultDescription, priority } = body;
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const userId = body.submittedByUserId ?? 'usr_bh_rat';
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const institutionId = equipment.assignedInstitutionId ?? 'inst_bh_rat';
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    let componentName: string | undefined;
    if (componentId) {
      const comp = await this.prisma.equipmentComponent.findFirst({
        where: { id: componentId, equipmentId },
      });
      componentName = comp?.name;
    }

    const repairRequestId = generateId('REQ');
    const repairRequest = await this.prisma.repairRequest.create({
      data: {
        id: repairRequestId,
        equipmentId,
        equipmentName: equipment.name,
        equipmentSerialNumber: equipment.serialNumber,
        componentId,
        componentName,
        faultDescription,
        priority,
        submittedByUserId: userId,
        submittedByUserName: user.fullName,
        submissionDate: new Date(),
        institutionId,
        institutionName: institution.name,
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

  // Update Work Order Status
  @Put('work-orders/:id/status')
  async updateWorkOrderStatus(
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
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

  // Add Inventory Stock
  @Post('inventory-items/:id/stock')
  async addInventoryStock(
    @Param('id') inventoryItemId: string,
    @Body() body: { quantity: number },
  ) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const updated = await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: {
          increment: body.quantity,
        },
      },
    });
    return updated;
  }

  // Add Procurement Plan
  @Post('procurement-plans')
  async addProcurementPlan(@Body() data: any) {
    const id = generateId('plan');
    return this.prisma.procurementPlan.create({ data: { id, ...data } });
  }

  // Create Purchase Order
  @Post('purchase-orders')
  async createPurchaseOrder(@Body() body: any) {
    const { planId, supplierId, items } = body;
    const poId = generateId('po');
    const poNumber = `PO-2026-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`;
    const orderDate = new Date();

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        id: poId,
        planId,
        supplierId,
        supplierName: body.supplierName ?? '',
        poNumber,
        orderDate,
        approvalStatus: 'Pending',
        totalCost: items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0),
        items: {
          create: items.map((item: any) => ({
            id: generateId('poi'),
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost,
            category: item.category,
          })),
        },
      },
      include: { items: true },
    });

    return purchaseOrder;
  }

  // Update PO Status
  @Put('purchase-orders/:id/status')
  async updatePOStatus(
    @Param('id') poId: string,
    @Body() body: { status: 'Approved' | 'Rejected' },
  ) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { approvalStatus: body.status },
    });

    if (body.status === 'Approved') {
      const grnId = generateId('grn');
      const grn = await this.prisma.grn.create({
        data: {
          id: grnId,
          purchaseOrderId: po.id,
          poNumber: po.poNumber,
          grnNumber: `GRN-2026-${Math.floor(Math.random() * 100000)
            .toString()
            .padStart(5, '0')}`,
          receivedDate: new Date(),
          status: 'Confirmed',
        },
      });

      for (const item of po.items) {
        if (item.category === 'spare part' || item.category === 'consumable') {
          const existing = await this.prisma.inventoryItem.findFirst({
            where: {
              name: {
                contains: item.description,
                mode: 'insensitive',
              },
            },
          });
          if (existing) {
            await this.prisma.inventoryItem.update({
              where: { id: existing.id },
              data: {
                currentStock: {
                  increment: item.quantity,
                },
              },
            });
          } else {
            await this.prisma.inventoryItem.create({
              data: {
                id: generateId('inv'),
                name: item.description,
                category: item.category,
                currentStock: item.quantity,
                minStockThreshold: 2,
                unitOfMeasure: 'Pcs',
                costPerUnit: item.unitCost,
              },
            });
          }
        } else if (item.category === 'new equipment') {
          const qty = Number(item.quantity);
          for (let i = 0; i < qty; i++) {
            const equipId = generateId('eq');
            await this.prisma.equipment.create({
              data: {
                id: equipId,
                name: item.description,
                description: `Procured under PO ${po.poNumber}`,
                category: 'General Medical',
                manufacturer: 'Global Health Corp',
                countryOfOrigin: 'Sri Lanka',
                supplierName: po.supplierName,
                tenderNumber: 'TND-LOCAL-PO',
                purchaseOrderNumber: po.poNumber,
                modelNumber: 'Model-Gen',
                serialNumber: `SN-${Date.now()}-${i}-${Math.floor(
                  Math.random() * 100,
                )}`,
                batchNumber: 'BATCH-AUTO',
                quantityReceived: 1,
                dateOfManufacture: new Date(),
                dateOfReceipt: new Date(),
                warrantyPeriodMonths: 12,
                components: {
                  create: [
                    {
                      id: generateId('eqc'),
                      name: 'Standard Battery Pack',
                      description: 'Internal secondary power unit',
                      partNumber: 'BAT-ST-01',
                      quantity: 1,
                      componentType: 'Consumable',
                    },
                  ],
                },
                status: 'PDHS Store',
              },
            });
          }
        }
      }
    }

    return updated;
  }

  // Receive Goods (GRN) - already handled in updatePOStatus when Approved
  @Post('purchase-orders/:id/receive')
  async receiveGoods(@Param('id') poId: string) {
    return this.updatePOStatus(poId, { status: 'Approved' });
  }

  // Switch User (set active user)
  @Post('users/switch')
  async switchUser(@Body() body: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}



