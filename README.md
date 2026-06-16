# Final Backend Auth Package — File Index

This is the consolidated, final state of every backend file we built and
revised in this conversation, arranged to mirror your `src/` tree. Copy
each file into the matching path in your project.

## New files (didn't exist before)

```
src/
├── app.module.ts                          ← REPLACES your existing one
├── prisma.module.ts                       ← NEW
└── auth/
    ├── auth.module.ts                     ← NEW
    ├── auth.controller.ts                 ← NEW (login/refresh/logout/etc.)
    ├── auth.service.ts                    ← NEW
    ├── auth.guards.ts                     ← NEW (JwtAuthGuard, ActiveRoleGuard)
    ├── auth.dto.ts                        ← NEW (Login/Refresh/ChangePassword/etc. DTOs)
    ├── active.role.ts                     ← NEW (@ActiveRole() param decorator)
    ├── jwt-payload.interface.ts           ← NEW (JwtPayload, JwtRoleClaim types)
    ├── crypto.util.ts                     ← NEW (opaque token gen/hash helpers)
    └── strategies/
        └── jwt.strategy.ts                ← NEW
```

## Modified files (your existing controllers/services)

```
src/
├── controller/
│   ├── query.controller.ts                ← REPLACES — guard-based, no @Headers()
│   └── upsert.controller.ts               ← REPLACES — guard-based, no @Headers()
└── service/
    ├── query.service.ts                   ← REPLACES — JwtRoleClaim typing, minor fixes
    └── upsert.service.ts                  ← REPLACES — added missing perm/scope check
```

## Untouched (your existing files — referenced but not recreated)

These already exist in your project and are imported as-is by the files
above. No changes needed:

```
src/
├── prisma.service.ts
├── auth/
│   ├── permission.enum.ts        (Permission string enum — incl. AUDIT_VIEW, INSTITUTE_*)
│   ├── role-permissions.ts       (ROLE_PERMISSIONS map)
│   ├── permission.service.ts     (PermissionService.require())
│   └── scope.service.ts          (ScopeService.xxxWhere())
├── dto/
│   ├── index.dto.ts
│   └── type.enum.ts
├── prismaQueryBuilder-v1.ts
├── service/
│   └── equipment.service.ts
└── controller/
    └── user.controller.ts
```

## Root

```
.env.example                               ← add JWT_SECRET / JWT_EXPIRES_IN to your .env
```

---

## Setup checklist

1. **Copy all "New" and "Modified" files** into your project at the paths shown.
2. **Verify `npm` packages**: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`,
   `@nestjs/config`, `bcrypt` (+ `@types/bcrypt`, `@types/passport-jwt`).
3. **Add to `.env`**: `JWT_SECRET=<generate with: openssl rand -hex 32>`
   and optionally `JWT_EXPIRES_IN=8h`.
4. **Confirm `role-permissions.ts`** grants `BIOMEDICAL_TECHNICIAN` (and any
   other technician-style roles) both `WORK_ORDER_ASSIGN` and
   `WORK_ORDER_COMPLETE` — `upsert.service.ts`'s `updateWorkOrderStatus` now
   enforces these (previously unchecked).
5. **Run `npx prisma generate`** if you haven't since any schema changes —
   `RefreshToken` / `PasswordResetToken` models (already in your schema)
   are used by `auth.service.ts`.

## Auth flow summary

- `POST /api/auth/login` → `{ token, refreshToken, user }`. `token` is the
  JWT your frontend stores and sends as `Authorization: Bearer <token>`.
- JWT payload: `{ sub, username, fullName, institutionId, roles: [{role, scopeType, scopeId}] }`
  — no `permission` field (computed server-side from `ROLE_PERMISSIONS`,
  not trusted from the token, so permission changes apply immediately).
- `JwtAuthGuard` verifies the token → sets `req.user`.
- `ActiveRoleGuard` validates `x-role`/`x-scope-type`/`x-scope-id` headers
  against `req.user.roles` (from the signed JWT) → sets `req.activeRole`.
- `@ActiveRole()` injects `req.activeRole` into handlers.
- Handlers call `permissionService.require(activeRole.role, Permission.X)`
  and `scopeService.xxxWhere(activeRole)` — unchanged from your existing
  pattern.
