// ─────────────────────────────────────────────────────────────────────
// IdService
//
// Generates human-readable, year-resetting IDs using an atomic
// increment against the id_sequences table.
//
// Usage:
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
import { PrismaService } from '../../prisma/prisma.service';

// ── Prefix registry — one place to see every meaningful ID format ──────
// Format: PREFIX-YYYY-NNNN  e.g. REQ-2026-0001, WO-2026-0047
export const ID_PREFIXES = {
  REPAIR_REQUEST: 'REQ',
  WORK_ORDER: 'WO',
  EQUIPMENT: 'EQ',
  PURCHASE_ORDER: 'PO',
  ASSIGNMENT: 'ASN',
  INVENTORY_ITEM: 'INV',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

@Injectable()
export class IdService {
  constructor(private prisma: PrismaService) {}

  async generate(prefix: IdPrefix, year?: number): Promise<string> {
    const y = year ?? new Date().getFullYear();
    const bucketKey = `${prefix}-${y}`;

    // Atomic upsert+increment — avoids read-then-write race condition.
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

  /** Generate multiple IDs for different prefixes at once. */
  async generateMany(
    prefixes: IdPrefix[],
    year?: number,
  ): Promise<Record<IdPrefix, string>> {
    const results = await Promise.all(
      prefixes.map(async (p) => [p, await this.generate(p, year)] as const),
    );
    return Object.fromEntries(results) as Record<IdPrefix, string>;
  }

  /** Peek at the current counter without incrementing. */
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
