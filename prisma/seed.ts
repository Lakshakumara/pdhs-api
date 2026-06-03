import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import seedData from '../scripts/seed-data.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool, { schema: 'pdhs' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

  // 1. Districts
  console.log('Seeding districts...')
  for (const d of seedData.districts) {
    await prisma.district.upsert({ where: { id: d.id }, update: d, create: d })
  }

  // 2. Institutions
  console.log('Seeding institutions...')
  for (const i of seedData.institutions) {
    await prisma.institution.upsert({ where: { id: i.id }, update: i, create: i })
  }

  // 3. Users (no role/districtId fields anymore)
  console.log('Seeding users...')
  for (const u of seedData.users) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u })
  }

  // 4. UserRoles — seed AFTER users exist
  // assignedById self-reference: seed roles without assignedById first,
  // then update with assignedById to avoid FK issues
  console.log('Seeding user roles...')
  for (const ur of seedData.userRoles) {
    const { assignedById, ...urWithoutAssignedBy } = ur
    await prisma.userRole.upsert({
      where: { id: ur.id },
      update: urWithoutAssignedBy,
      create: urWithoutAssignedBy,
    })
  }
  // Now update assignedById references
  for (const ur of seedData.userRoles) {
    if (ur.assignedById) {
      await prisma.userRole.update({
        where: { id: ur.id },
        data: { assignedById: ur.assignedById },
      })
    }
  }

  // 5. Suppliers
  console.log('Seeding suppliers...')
  for (const s of seedData.suppliers) {
    await prisma.supplier.upsert({ where: { id: s.id }, update: s, create: s })
  }

  // 6. Inventory Items
  console.log('Seeding inventory items...')
  for (const item of seedData.inventoryItems) {
    await prisma.inventoryItem.upsert({ where: { id: item.id }, update: item, create: item })
  }

  // 7. Equipment + nested ServicePlan + Components
  console.log('Seeding equipment...')
  for (const equipmentData of seedData.equipment) {
    const { servicePlan, components, ...equipment } = equipmentData

    await prisma.equipment.upsert({
      where: { id: equipment.id },
      update: equipment,
      create: equipment,
    })

    if (servicePlan) {
      await prisma.servicePlan.upsert({
        where: { id: servicePlan.id },
        update: { ...servicePlan, equipmentId: equipment.id },
        create: { ...servicePlan, equipmentId: equipment.id },
      })
    }

    if (components?.length > 0) {
      for (const c of components) {
        await prisma.equipmentComponent.upsert({
          where: { id: c.id },
          update: { ...c, equipmentId: equipment.id },
          create: { ...c, equipmentId: equipment.id },
        })
      }
    }
  }

  // 8. Assignments
  console.log('Seeding assignments...')
  for (const a of seedData.assignments) {
    await prisma.assignment.upsert({ where: { id: a.id }, update: a, create: a })
  }

  // 9. Repair Requests
  console.log('Seeding repair requests...')
  for (const rr of seedData.repairRequests) {
    await prisma.repairRequest.upsert({ where: { id: rr.id }, update: rr, create: rr })
  }

  // 10. Work Orders + nested InspectedComponents + PartsUsed
  console.log('Seeding work orders...')
  for (const workOrder of seedData.workOrders) {
    const { inspectedComponents, partsUsed, ...workOrderData } = workOrder

    await prisma.workOrder.upsert({
      where: { id: workOrder.id },
      update: workOrderData,
      create: workOrderData,
    })

    if (inspectedComponents?.length > 0) {
      await prisma.inspectedComponent.createMany({
        data: inspectedComponents.map((ic: any) => ({ ...ic, workOrderId: workOrder.id })),
        skipDuplicates: true,
      })
    }

    if (partsUsed?.length > 0) {
      await prisma.partUsed.createMany({
        data: partsUsed.map((p: any) => ({ ...p, workOrderId: workOrder.id })),
        skipDuplicates: true,
      })
    }
  }

  // 11. Procurement Plans
  console.log('Seeding procurement plans...')
  for (const plan of seedData.procurementPlans) {
    await prisma.procurementPlan.upsert({ where: { id: plan.id }, update: plan, create: plan })
  }

  // 12. Purchase Orders + Items
  console.log('Seeding purchase orders...')
  for (const po of seedData.purchaseOrders) {
    const { items, ...poData } = po

    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: poData,
      create: poData,
    })

    if (items?.length > 0) {
      await prisma.purchaseOrderItem.createMany({
        data: items.map((item: any) => ({ ...item, purchaseOrderId: po.id })),
        skipDuplicates: true,
      })
    }
  }

  // 13. Audit Logs
  console.log('Seeding audit logs...')
  for (const log of seedData.auditLogs) {
    await prisma.auditLog.upsert({ where: { id: log.id }, update: log, create: log })
  }

  console.log('✅ Seeding completed successfully!')
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



/*import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import seedData from '../scripts/seed-data.js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool, { schema: 'pdhs' })
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('Starting to seed database with dummy data...')
  
  // Clear existing data (optional - uncomment if you want to clear first)
  // await prisma.auditLog.deleteMany()
  // await prisma.partUsed.deleteMany()
  // await prisma.inspectedComponent.deleteMany()
  // await prisma.workOrder.deleteMany()
  // await prisma.repairRequest.deleteMany()
  // await prisma.assignment.deleteMany()
  // await prisma.equipmentComponent.deleteMany()
  // await prisma.equipment.deleteMany()
  // await prisma.servicePlan.deleteMany()
  // await prisma.inventoryItem.deleteMany()
  // await prisma.purchaseOrderItem.deleteMany()
  // await prisma.purchaseOrder.deleteMany()
  // await prisma.procurementPlan.deleteMany()
  // await prisma.supplier.deleteMany()
  // await prisma.user.deleteMany()
  // await prisma.institution.deleteMany()
  // await prisma.district.deleteMany()
  
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
    const { servicePlan, components, ...equipment } = equipmentData
    
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
    
    // Create components if exist
    if (components && components.length > 0) {
      for (const componentData of components) {
        await prisma.equipmentComponent.upsert({
          where: { id: componentData.id },
          update: { ...componentData, equipmentId: createdEquipment.id },
          create: { ...componentData, equipmentId: createdEquipment.id },
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
    const { inspectedComponents, partsUsed, ...workOrderData } = workOrder
    
    // Create work order
    const createdWorkOrder = await prisma.workOrder.upsert({
      where: { id: workOrder.id },
      update: workOrderData,
      create: workOrderData,
    })
    
    // Create inspected components if exist
    if (inspectedComponents && inspectedComponents.length > 0) {
      for (const inspectedComponentData of inspectedComponents) {
        await prisma.inspectedComponent.upsert({
          where: { id: inspectedComponentData.id },
          update: { ...inspectedComponentData, workOrderId: createdWorkOrder.id },
          create: { ...inspectedComponentData, workOrderId: createdWorkOrder.id },
        })
      }
    }
    
    // Create parts used if exist
    if (partsUsed && partsUsed.length > 0) {
      for (const partUsedData of partsUsed) {
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
    console.error('Error seeding database:', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })

*/
/*
async function main() {
  console.log('Seeding database...')
  
  await prisma.seedSnapshot.createMany({
    data: [
      {
        name: 'initial_snapshot',
        payload: { version: '1.0.0', description: 'Initial data snapshot' },
      },
      {
        name: 'update_snapshot_1',
        payload: { version: '1.1.0', description: 'First update snapshot' },
      },
    ],
    skipDuplicates: true,
  })
  
  console.log('Seeding completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })*/