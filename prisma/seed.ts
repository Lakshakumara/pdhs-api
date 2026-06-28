import "dotenv/config"
import { PrismaClient, RoleType, ScopeType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedData } from "scripts/seed-data"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool, { schema: 'pdhs' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')


  // Seed Districts
  console.log('Seeding districts...')
  for (const district of seedData.districts) {
    await prisma.district.upsert({
      where: { id: district.id },
      update: district,
      create: district,
    })
  }

  // Seed Institutions
  console.log('Seeding institutions...')
  for (const institution of seedData.institutions) {
    await prisma.institution.upsert({
      where: { id: institution.id },
      update: institution,
      create: institution,
    })
  }

  // Seed Users
  console.log('Seeding users...')
  for (const user of seedData.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    })
  }

  // Seed Roles
  console.log('Seeding Roles...')
  for (const roles of seedData.userRoles) {
    /*await prisma.userRole.upsert({
      where: { id: roles.id },
      update: roles,
      create: roles,
    })*/
    await prisma.userRole.upsert({
      where: { id: roles.id },
      // Force Prisma to evaluate the role property correctly using an inline cast
      update: {
        ...roles, role: roles.role as RoleType,
        scopeType: roles.scopeType as ScopeType
      },
      create: {
        ...roles, role: roles.role as RoleType,
        scopeType: roles.scopeType as ScopeType
      },
    })
  }

  // Seed User Permission
  console.log('Seeding User Permissions...')
  for (const permission of seedData.userPermissions) {
    await prisma.userPermission.upsert({
      where: { id: permission.id },
      update: permission,
      create: permission,
    })
  }

  // Seed Suppliers
  console.log('Seeding suppliers...')
  for (const supplier of seedData.suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: supplier,
      create: supplier,
    })
  }

  // Seed Inventory Items
  console.log('Seeding inventory items...')
  for (const item of seedData.inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }

  // Seed Equipment with relations
  console.log('Seeding equipment...')
  for (const equipmentData of seedData.equipment) {
    const { servicePlan, spareParts, ...equipment } = equipmentData

    // Create equipment
    const createdEquipment = await prisma.equipment.upsert({
      where: { id: equipment.id },
      update: equipment,
      create: equipment,
    })

    // Create service plan if exists
    if (servicePlan) {
      await prisma.servicePlan.upsert({
        where: { id: servicePlan.id },
        update: { ...servicePlan, equipmentId: createdEquipment.id },
        create: { ...servicePlan, equipmentId: createdEquipment.id },
      })
    }

    // Create spareParts if exist
    if (spareParts && spareParts.length > 0) {
      for (const sparePartData of spareParts) {
        await prisma.equipmentSpareParts.upsert({
          where: { id: sparePartData.id },
          update: { ...sparePartData, equipmentId: createdEquipment.id },
          create: { ...sparePartData, equipmentId: createdEquipment.id },
        })
      }
    }
  }

  // Seed Assignments
  console.log('Seeding assignments...')
  for (const assignment of seedData.assignments) {
    await prisma.assignment.upsert({
      where: { id: assignment.id },
      update: assignment,
      create: assignment,
    })
  }

  // Seed Repair Requests
  console.log('Seeding repair requests...')
  for (const repairRequest of seedData.repairRequests) {
    await prisma.repairRequest.upsert({
      where: { id: repairRequest.id },
      update: repairRequest,
      create: repairRequest,
    })
  }

  // Seed Work Orders
  console.log('Seeding work orders...')
  for (const workOrder of seedData.workOrders) {
    const { inspectedspareParts, partsUsed, ...workOrderData } = workOrder

    // Create work order
    const createdWorkOrder = await prisma.workOrder.upsert({
      where: { id: workOrder.id },
      update: workOrderData,
      create: workOrderData,
    })

    // Create inspected spareParts if exist
    if (inspectedspareParts && inspectedspareParts.length > 0) {
      for (const inspectedsparePartData of inspectedspareParts) {
        await prisma.inspectedSparePart.upsert({
          where: { id: inspectedsparePartData.id },
          update: { ...inspectedsparePartData, workOrderId: createdWorkOrder.id },
          create: { ...inspectedsparePartData, workOrderId: createdWorkOrder.id },
        })
      }
    }

    // Create parts used if exist
    if (partsUsed && partsUsed.length > 0) {
      console.log('part Used', partsUsed)
      /*for (const partUsedData of partsUsed) {
        await prisma.partUsed.upsert({
          where: { id: partUsedData.id },
          update: { ...partUsedData, workOrderId: createdWorkOrder.id },
          create: { ...partUsedData, workOrderId: createdWorkOrder.id },
        })
      }*/
      for (const partUsedData of (partsUsed as any[])) {
        await prisma.partUsed.upsert({
          where: { id: partUsedData.id },
          update: { ...partUsedData, workOrderId: createdWorkOrder.id },
          create: { ...partUsedData, workOrderId: createdWorkOrder.id },
        })
      }
    }
  }

  // Seed Procurement Plans
  console.log('Seeding procurement plans...')
  for (const plan of seedData.procurementPlans) {
    await prisma.procurementPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    })
  }

  // Seed Purchase Orders with relations
  console.log('Seeding purchase orders...')
  for (const po of seedData.purchaseOrders) {
    const { items, ...poData } = po

    // Create purchase order
    const createdPO = await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: poData,
      create: poData,
    })

    // Create purchase order items if exist
    if (items && items.length > 0) {
      for (const itemData of items) {
        await prisma.purchaseOrderItem.upsert({
          where: { id: itemData.id },
          update: { ...itemData, purchaseOrderId: createdPO.id },
          create: { ...itemData, purchaseOrderId: createdPO.id },
        })
      }
    }
  }

  // Seed GRNs (empty in seed data, skipping)

  // Seed Audit Logs
  console.log('Seeding audit logs...')
  for (const auditLog of seedData.auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: auditLog,
      create: auditLog,
    })
  }

  console.log('Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Seed failed:', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })