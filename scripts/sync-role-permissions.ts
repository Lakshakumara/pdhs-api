/**
 * sync:perms — idempotent backfill of role-default permissions.
 *
 * When ROLE_PERMISSIONS (src/auth/role-permissions.ts) gains a new entry,
 * only NEW users receive it (at user-create / role-add time). This script
 * gives every EXISTING user the missing defaults for the roles they hold.
 *
 * Rules:
 *  - only INSERTS rows where no (userId, permission) row exists at all
 *  - never touches existing rows → revoked or expired grants are respected
 *    (an expired grant means someone deliberately let it lapse)
 *
 * Run: npm run sync:perms
 */
import 'dotenv/config';
import { PrismaClient, RoleType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';
import { ROLE_PERMISSIONS } from '../src/auth/role-permissions';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'pdhs' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, roles: { select: { role: true } } },
  });

  const existing = await prisma.userPermission.findMany({
    select: { userId: true, permission: true },
  });
  const held = new Set(existing.map((e) => `${e.userId}|${e.permission}`));

  const rows: { id: string; userId: string; permission: string; note: string }[] = [];
  for (const user of users) {
    const roles = user.roles.map((r) => r.role as RoleType);
    if (roles.length === 0) continue;

    const desired = new Set<string>();
    for (const role of roles) {
      for (const p of ROLE_PERMISSIONS[role] ?? []) desired.add(p);
    }

    for (const p of desired) {
      if (!held.has(`${user.id}|${p}`)) {
        rows.push({
          id: randomUUID(),
          userId: user.id,
          permission: p,
          note: `Default grant for role${roles.length > 1 ? 's' : ''} ${roles.join(', ')} (synced)`,
        });
      }
    }
  }

  if (rows.length === 0) {
    console.log('✅ All users already hold their role defaults — nothing to do.');
  } else {
    const res = await prisma.userPermission.createMany({
      data: rows,
      skipDuplicates: true,
    });
    const perUser = new Set(rows.map((r) => r.userId)).size;
    const perPerm = [...new Set(rows.map((r) => r.permission))];
    console.log(
      `✅ Synced ${res.count} missing role-default permission(s) for ${perUser} user(s).`,
    );
    console.log(`   permissions: ${perPerm.join(', ')}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
