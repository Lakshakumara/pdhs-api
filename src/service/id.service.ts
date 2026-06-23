// ─────────────────────────────────────────────────────────────────────
// IdService
//
// Generates human-readable, year-resetting IDs using an atomic
// increment against the id_sequences table.
//
// Usage from any service:
//   const id = await this.idService.generate(ID_PREFIXES.REPAIR_REQUEST);
//   // → 'REQ-2026-0001'
//
// WHY a dedicated table instead of COUNT(*)+1:
//   COUNT(*) races under concurrent inserts — two simultaneous requests
//   could both see COUNT=47 and both generate '-0048'. A row-level lock
//   on a dedicated sequence row is the standard safe pattern for this.
//
// WHY not Postgres SEQUENCE / SERIAL:
//   Postgres native sequences don't reset per year without a cron job
//   or DDL change each January. This table-based approach resets
//   automatically just by using a new bucket key for each year.
// ─────────────────────────────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// ─────────────────────────────────────────────────────────────────────
// Prefix registry — one place to see every meaningful ID format.
// Format: PREFIX-YYYY-NNNN  e.g. REQ-2026-0001, WO-2026-0047
// ─────────────────────────────────────────────────────────────────────
export const ID_PREFIXES = {
    REPAIR_REQUEST: 'REQ',
    WORK_ORDER: 'WO',
    EQUIPMENT: 'EQ',
    PURCHASE_ORDER: 'PO',
    ASSIGNMENT: 'ASN',
    INVENTORY_ITEM: 'INV',
} as const;

export type IdPrefix = typeof ID_PREFIXES[keyof typeof ID_PREFIXES];

/**
 * ──────────────────────────────────────────────────────────────────
// Inject IdService wherever you create records for these tables.
// Replace the old generateId() call with idService.generate().
// ─────────────────────────────────────────────────────────────────────

// ── RepairRequest ────────────────────────────────────────────────────

// BEFORE:
const id = generateId('REQ');  // 'REQ_1748012400000_4291' — not human-readable

// AFTER:
const id = await this.idService.generate(ID_PREFIXES.REPAIR_REQUEST);
// → 'REQ-2026-0001'

await this.prisma.repairRequest.create({
  data: {
    id,
    equipmentId,
    faultDescription,
    priority,
    submittedByUserId,
    submissionDate: new Date(),
    institutionId,
    // ...
  }
});


// ── WorkOrder ────────────────────────────────────────────────────────
// WorkOrder is created immediately after RepairRequest in your flow.
// Generate both IDs before the transaction so neither is wasted on a
// partial failure.

const [repairId, workOrderId] = await Promise.all([
  this.idService.generate(ID_PREFIXES.REPAIR_REQUEST),
  this.idService.generate(ID_PREFIXES.WORK_ORDER),
]);

await this.prisma.$transaction([
  this.prisma.repairRequest.create({ data: { id: repairId, ... } }),
  this.prisma.workOrder.create({ data: { id: workOrderId, repairRequestId: repairId, status: 'Submitted', ... } }),
]);


// ── Equipment ────────────────────────────────────────────────────────
const id = await this.idService.generate(ID_PREFIXES.EQUIPMENT);
// → 'EQ-2026-0003'
await this.prisma.equipment.create({ data: { id, name, serialNumber, ... } });


// ── Assignment ───────────────────────────────────────────────────────
const id = await this.idService.generate(ID_PREFIXES.ASSIGNMENT);
// → 'ASN-2026-0012'
await this.prisma.assignment.create({ data: { id, equipmentId, toEntityId, ... } });


// ── InventoryItem ────────────────────────────────────────────────────
const id = await this.idService.generate(ID_PREFIXES.INVENTORY_ITEM);
// → 'INV-2026-0007'
await this.prisma.inventoryItem.create({ data: { id, name, category, ... } });


// ── PurchaseOrder ────────────────────────────────────────────────────
// Note: PurchaseOrder already has a `poNumber` field in your schema.
// You can either:
//   a) Also use IdService for the PK `id` field → 'PO-2026-0002'
//   b) Or unify: drop poNumber and use the generated id as the PO number.
// Option (b) is cleaner — one less field to keep in sync.

const id = await this.idService.generate(ID_PREFIXES.PURCHASE_ORDER);
// → 'PO-2026-0002'
await this.prisma.purchaseOrder.create({
  data: {
    id,
    poNumber: id,   // same value — or drop poNumber entirely from schema
    planId,
    supplierId,
    // ...
  }
});

 * 
 * 
 */
@Injectable()
export class IdService {
    constructor(private prisma: PrismaService) { }

    async generate(prefix: IdPrefix, year?: number): Promise<string> {
        const y = year ?? new Date().getFullYear();
        const bucketKey = `${prefix}-${y}`;

        // executeRaw for the atomic upsert+increment in one statement.
        // This avoids a read-then-write race that would exist with two
        // separate Prisma calls (findUnique → update).
        //
        // INSERT INTO id_sequences (prefix, "lastSeq", "updatedAt")
        //   VALUES ($1, 1, now())
        //   ON CONFLICT (prefix)
        //   DO UPDATE SET "lastSeq" = id_sequences."lastSeq" + 1,
        //                 "updatedAt" = now()
        // RETURNING "lastSeq"
        const result = await this.prisma.$queryRaw<{ lastSeq: number }[]>`
      INSERT INTO id_sequences (prefix, "lastSeq", "updatedAt")
      VALUES (${bucketKey}, 1, now())
      ON CONFLICT (prefix)
      DO UPDATE SET
        "lastSeq"   = id_sequences."lastSeq" + 1,
        "updatedAt" = now()
      RETURNING "lastSeq"
    `;

        const seq = Number(result[0].lastSeq);
        const padded = String(seq).padStart(4, '0');

        return `${prefix}-${y}-${padded}`;
        // e.g. 'REQ-2026-0001', 'WO-2026-0047', 'EQ-2026-0123'
    }

    // Convenience: generate multiple IDs for different prefixes at once.
    // Each gets its own atomic increment.
    async generateMany(
        prefixes: IdPrefix[],
        year?: number,
    ): Promise<Record<IdPrefix, string>> {
        const results = await Promise.all(
            prefixes.map(async p => [p, await this.generate(p, year)] as const),
        );
        return Object.fromEntries(results) as Record<IdPrefix, string>;
    }

    // Peek at the current counter without incrementing — useful for
    // admin dashboards showing "total repair requests this year: 47".
    async currentCount(prefix: IdPrefix, year?: number): Promise<number> {
        const y = year ?? new Date().getFullYear();
        const bucketKey = `${prefix}-${y}`;
        const row = await this.prisma.idSequence.findUnique({
            where: { prefix: bucketKey },
            select: { lastSeq: true },
        });
        return row?.lastSeq ?? 0;
    }
}
