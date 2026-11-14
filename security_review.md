# PDHS Security Audit Report
**Date:** 2026-11-13 | **Audited by:** Antigravity Security Auditor  
**Scope:** Permission system, Role-Permission mapping, Scope enforcement, JWT auth, Frontend security

---

## Executive Summary

**Overall Risk Rating: 🟠 HIGH**

The PDHS system has a solid architectural foundation — a custom three-guard chain (`JwtAuthGuard → ActiveRoleGuard → PermissionGuard`), DB-backed per-user permission grants checked fresh on every request, and refresh token rotation with hashing. However, **4 critical vulnerabilities** exist that must be addressed immediately before any production deployment.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 7 |
| 🟡 Medium | 14 |
| 🟢 Low | 3 |
| ℹ️ Info | 4 |

**Top 4 immediate actions:**
1. Delete the unauthenticated `GET /api/developer/users` endpoint
2. Remove hardcoded JWT secret fallback from source code
3. Fix inventory scope bypass (all roles see all inventory)
4. Implement role/scope headers in the Angular interceptor

---

## 1. Guard Chain Completeness

### ✅ Controllers with correct 3-guard chain
All major controllers correctly apply `@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)`:
- `UsersController` (`api/users`)
- `SuppliersController` (`api/supplier`)
- `RepairController` (`api`)
- `InventoryController` (`api`)
- `EquipmentController` (`api/equipment`)
- `DashboardController` (`api/dashboard`)
- `OrganizationController` (`api`)
- `InstituteController` (`api/institutions`)
- `AuditController` (`api`)

---

### 🔴 CRITICAL — `DeveloperController` has NO guards whatsoever

**Location:** [`delete-deploy.controller.ts`](file:///D:/root/pdhs-api/src/modules/users/delete-deploy.controller.ts) (registered in [`users.module.ts`](file:///D:/root/pdhs-api/src/modules/users/users.module.ts))

**Description:** `GET /api/developer/users` returns ALL users in the system (paginated) with **full detail** including: `id`, `username`, `email`, `active`, `mustChangePassword`, `institutionId`, all roles (with `scopeType`/`scopeId`), all permissions (with `grantedBy` info), institution + district. The controller has **zero authentication or authorization decorators**.

The frontend [`user-api.service.ts`](file:///D:/root/pdhs/src/app/core/services/user-api.service.ts) `dev_getAllUsers()` method still calls this endpoint.

**Recommendation:** **Delete `DeveloperController` and `dev_getAllUsers()` immediately.** This endpoint bypasses ALL security controls and exposes the entire user directory to anyone with network access.

---

### 🟠 HIGH — `GET /api/auth/permissions/meta` publicly accessible (no guards)

**Location:** [`auth.controller.ts`](file:///D:/root/pdhs-api/src/auth/auth.controller.ts)

**Description:** The route has `@SkipPermission()` but **no guards at all** — it's publicly accessible without authentication. It returns all permission group metadata and definitions, leaking the full permission taxonomy.

The `/logout`, `/logout-all`, and `/change-password` routes also only have `@UseGuards(JwtAuthGuard)` (not the full 3-guard chain) which is acceptable since they don't need scope/permission checks.

**Recommendation:** Add `@UseGuards(JwtAuthGuard)` to `GET /auth/permissions/meta` if authentication is required, or document public access as intentional.

---

### 🟡 MEDIUM — `POST /api/users/:id/reset-password` has no permission check

**Location:** [`users.controller.ts`](file:///D:/root/pdhs-api/src/modules/users/users.controller.ts) ~L116

**Description:** Uses `@SkipPermission()`. Any authenticated user with **any active role** can reset **any user's password** to `pdhs@123` as long as that user is within their scope. Even a `VIEWER_*` role (which has no user management permissions) could call this route.

**Recommendation:** Replace `@SkipPermission()` with `@RequirePermission(Permission.USER_UPDATE)`.

---

## 2. Role-Permission Mapping

### 🟠 HIGH — `ADMIN_INSTITUTE` has `PERMISSION_CREATE` without `PERMISSION_REMOVE`

**Location:** [`role-permissions.ts`](file:///D:/root/pdhs-api/src/auth/role-permissions.ts) ~L175–200

**Description:** `ADMIN_INSTITUTE` can grant permanent permissions to any user in their institution but cannot revoke them. This creates an asymmetry — once granted, only a higher-scope admin can revoke.

Partly mitigated by `assertCanGrantPermission()` in [`users.service.ts`](file:///D:/root/pdhs-api/src/modules/users/users.service.ts) L530 (caller must hold the permission they're granting), but the revocation gap remains.

**Recommendation:** Either add `PERMISSION_REMOVE` to `ADMIN_INSTITUTE` or document this as deliberate policy.

---

### 🟡 MEDIUM — `INSTITUTION_USER` has `SUPPLIER_CREATE` and `SUPPLIER_UPDATE`

**Location:** [`role-permissions.ts`](file:///D:/root/pdhs-api/src/auth/role-permissions.ts) ~L270–288

**Description:** End users (data-entry role) have supplier management capabilities. Confirm whether this is intentional.

---

### 🟡 MEDIUM — `BIOMEDICAL_TECHNICIAN` has `SUPPLIER_CREATE` and `SUPPLIER_UPDATE`

**Location:** [`role-permissions.ts`](file:///D:/root/pdhs-api/src/auth/role-permissions.ts) ~L231–250

**Description:** Technicians having supplier management may be intentional (recommending vendors) but should be confirmed with business requirements.

---

### 🟡 MEDIUM — `STORE_KEEPER` has `INSTITUTE_CREATE`

**Location:** [`role-permissions.ts`](file:///D:/root/pdhs-api/src/auth/role-permissions.ts) ~L214–229

**Description:** A store-keeper being able to create institutions seems out of scope for their role.

**Recommendation:** Remove `INSTITUTE_CREATE` from `STORE_KEEPER` unless deliberately intended.

---

### 🟡 MEDIUM — `VIEWER_RDHS` and `VIEWER_INSTITUTE` have `AUDIT_VIEW`

**Location:** [`role-permissions.ts`](file:///D:/root/pdhs-api/src/auth/role-permissions.ts)

**Description:** Viewer roles can see audit logs including failed login events and permission changes. Consider restricting `AUDIT_VIEW` to admin roles only.

---

### ℹ️ INFO — `SUPER_ADMIN_PDHS` gets `Object.values(Permission)` (all permissions)

Includes `EQUIPMENT_DELETE` and `INVENTORY_DELETE` which no other role has. This is by design; seeds populate `UserPermission` table from `ROLE_PERMISSIONS`. Acceptable.

### ✅ PDHS > RDHS > INSTITUTE hierarchy is broadly respected

The hierarchy is maintained. Only ADMIN_PDHS has `REPAIR_APPROVE_PDHS`. Only INSTITUTE roles have `REPAIR_FEEDBACK` / `REPAIR_APPROVE_MS`. No privilege escalation across scope tiers.

---

## 3. Scope Enforcement

### 🔴 CRITICAL — `InventoryService` passes `{}` as scopeWhere (no scope enforcement)

**Location:** [`inventory.service.ts`](file:///D:/root/pdhs-api/src/modules/inventory/inventory.service.ts) ~L18

**Description:**
```ts
const { where, skip, take, page, size } = this.queryBuilder.build(
  query,
  {},      // ← EMPTY scope! All roles see ALL inventory items
  ['name', 'category'],
  [],
);
```
Every authenticated user, regardless of scope (PDHS, RDHS, or INSTITUTE), gets back the same full inventory list. An INSTITUTE user can enumerate all inventory items system-wide.

**Recommendation:** Pass `this.scopeService.inventoryWhere(activeRole)` as the second argument.

---

### 🟠 HIGH — `ScopeService.instituteWhere()` and `equipmentWhere()` have no `default` ForbiddenException

**Location:** [`scope.service.ts`](file:///D:/root/pdhs-api/src/auth/scope.service.ts)

**Description:** Both functions have no `default` case in their switch. If `activeRole.scopeType` is undefined or unexpected, they return `undefined`. Prisma with `where: undefined` = no filter at all — **all records returned**. Only `inventoryWhere()` and `scopeWhere()` correctly throw `ForbiddenException` on unknown scope.

**Recommendation:**
```ts
default: throw new ForbiddenException('Invalid scope');
```
Add this to `instituteWhere()` and `equipmentWhere()`.

---

### 🟠 HIGH — Equipment create/update/assign ignores scope

**Location:** [`equipment.service.ts`](file:///D:/root/pdhs-api/src/modules/equipment/equipment.service.ts) ~L58–144

**Description:**
- `addEquipment()` takes `assignedInstitutionId` from request body without checking if the caller is scoped to that institution.
- `updateEquipment()` accepts `assignedInstitutionId` without scope validation.
- `assignEquipment()` does not verify that `toInstitutionId` is within the caller's scope.

Any user with `EQUIPMENT_CREATE`, `EQUIPMENT_UPDATE`, or `EQUIPMENT_ASSIGN` can affect **any institution's equipment** system-wide.

**Recommendation:** Assert that target `institutionId` values are within the caller's scope before creating/updating.

---

### 🟡 MEDIUM — `SupplierService.findSupplier()` accepts `activeRole` but never uses it

**Location:** [`supplier.service.ts`](file:///D:/root/pdhs-api/src/modules/supplier/supplier.service.ts) ~L18–67

**Description:** `activeRole` is accepted as a parameter but never used. All non-deleted suppliers are returned to all roles regardless of scope.

**Recommendation:** If suppliers are truly system-wide, document this explicitly. Otherwise implement `scopeService.supplierWhere(activeRole)`.

---

### ✅ `RepairService` correctly uses `scopeService.scopeWhere(activeRole)`
### ✅ `UsersService` has correct scope enforcement via `buildUserScopeWhere()`, `assertUserInScope()`, `assertCanManageScope()`
### ✅ `AuditService.findAuditLogs()` correctly uses `scopeService.scopeWhere(activeRole)`

---

## 4. JWT & Authentication Security

### 🔴 CRITICAL — Default JWT secret hardcoded in source code

**Location:** [`auth.module.ts`](file:///D:/root/pdhs-api/src/auth/auth.module.ts) L24, [`auth.service.ts`](file:///D:/root/pdhs-api/src/auth/auth.service.ts) L271, [`jwt.strategy.ts`](file:///D:/root/pdhs-api/src/auth/strategies/jwt.strategy.ts) L13–16

**Description:** The fallback JWT secret `'soft_solution_software_@_laksha_@_1227'` is hardcoded in **three places** in source code. If `JWT_SECRET` env var is not set, all JWTs are signed with this known secret. Anyone with repository access can forge valid JWTs for any user.

**Recommendation:**
1. Remove ALL hardcoded secret fallbacks immediately
2. Throw a startup error if `JWT_SECRET` is missing rather than silently using the default
3. Rotate all tokens in production now

---

### 🟠 HIGH — Password reset token logged to console in plaintext

**Location:** [`auth.service.ts`](file:///D:/root/pdhs-api/src/auth/auth.service.ts) ~L204

**Description:**
```ts
console.log(`[DEV] Password reset token for ${user.email}: ${plaintextToken}`);
```
Any log aggregation system exposes plaintext reset tokens. The email service (`TODO: wire up MailService`) is not yet implemented — the feature is incomplete but the endpoint is live.

**Recommendation:** Remove the `console.log`. Disable the password reset endpoint until the mail service is wired.

---

### 🟡 MEDIUM — Frontend `hasValidToken()` treats tokens with no `exp` claim as valid

**Location:** [`auth.service.ts`](file:///D:/root/pdhs/src/app/core/auth/auth.service.ts) ~L109

**Description:**
```ts
if (!payload?.exp) return true; // no exp claim — let backend decide
```
A misconfigured JWT without `exp` would be treated as permanently valid on the frontend.

**Recommendation:** Treat tokens with no `exp` claim as invalid.

---

### 🟡 MEDIUM — JWT token stored in `localStorage` (XSS-accessible)

**Location:** [`auth.service.ts`](file:///D:/root/pdhs/src/app/core/auth/auth.service.ts) ~L53

**Description:** `localStorage.setItem(this.TOKEN_KEY, response.token)` — tokens are accessible to any JavaScript on the page. Standard SPA trade-off, but noted for a healthcare system.

**Recommendation:** Consider HttpOnly cookies for token storage in future. Acceptable for now given the internal deployment context.

---

### ✅ JWT does NOT include permissions (correct design)
### ✅ Refresh token rotation implemented correctly (SHA-256 hashed, revoked on reuse)
### ✅ Token expiry correctly enforced (`ignoreExpiration: false`)
### ✅ Password change and reset correctly revoke all refresh tokens

---

## 5. Permission Granularity & Design

### 🟠 HIGH — `findWorkOrder()` uses static role map check instead of live DB `UserPermission`

**Location:** [`repair.service.ts`](file:///D:/root/pdhs-api/src/modules/repair/repair.service.ts) ~L393–417

**Description:** `GET /api/work-order/:requestId` uses `@SkipPermission()`. Inside the service it calls `permissionService.require(activeRole.role, Permission.REPAIR_REQUEST_VIEW)` which checks the **static `ROLE_PERMISSIONS` map** — not the `UserPermission` table. Per-user permission revocations are **not respected** for this route.

**Recommendation:** Replace with `@RequirePermission(Permission.WORK_ORDER_VIEW)` and let `PermissionGuard` handle the DB-backed check.

---

### 🟡 MEDIUM — Supplier `PUT` route accepts `PROCUREMENT_CREATE` instead of `PROCUREMENT_UPDATE`

**Location:** [`suppliers.controller.ts`](file:///D:/root/pdhs-api/src/modules/supplier/suppliers.controller.ts) ~L70–72

**Description:** `RequirePermission([SUPPLIER_UPDATE, PROCUREMENT_CREATE])` — a user who can only CREATE procurement records can also UPDATE supplier records. These are different operations.

**Recommendation:** Change to `[SUPPLIER_UPDATE, PROCUREMENT_UPDATE]`.

---

### 🟡 MEDIUM — `PrismaQueryBuilder` exact filter logic bug

**Location:** [`prisma-query-builder.ts`](file:///D:/root/pdhs-api/src/prisma/prisma-query-builder.ts) ~L43–51

**Description:** When multiple `exactFilters` fields are configured and a value is present, the builder incorrectly generates `OR: [all filters against ONE value]` instead of `AND: [each field against its own value]`. This can return incorrect records — not a direct security issue but a data integrity bug.

**Recommendation:** Fix to use `AND` with each filter matched to its own query value.

---

### 🟡 MEDIUM — `sortBy` accepts arbitrary column name strings

**Location:** [`base-query.dto.ts`](file:///D:/root/pdhs-api/src/shared/dto/base-query.dto.ts) L17, [`PrismaQueryBuilder`](file:///D:/root/pdhs-api/src/prisma/prisma-query-builder.ts)

**Description:** `sortBy` is passed directly into Prisma `orderBy: { [query.sortBy]: ... }` without validation. Invalid values cause runtime errors that could reveal model field names through error responses.

**Recommendation:** Add `@IsIn(['name', 'createdAt', ...])` validator per DTO or validate in the query builder.

---

## 6. Frontend Security

### 🔴 CRITICAL — Frontend sends no `x-role`, `x-scope-type`, `x-scope-id` headers

**Location:** [`user-session.interceptor.ts`](file:///D:/root/pdhs/src/app/core/interceptors/user-session.interceptor.ts)

**Description:** The interceptor only sends `Authorization: Bearer <token>`. As a result, `ActiveRoleGuard` **always falls back to `jwtRoles[0]`** (the user's first role).

Consequences:
1. Multi-role users always operate under their first role regardless of intent
2. The scope-switching capability built into `ActiveRoleGuard` is completely non-functional
3. Users with a PDHS role as their first role may have broader access than intended for a given workflow

**Recommendation:** Implement the role headers in `userSessionInterceptor` using the active role from `UserFacadeService`.

---

### 🟡 MEDIUM — `users.component.ts` uses hardcoded `/api/...` paths

**Location:** [`users.component.ts`](file:///D:/root/pdhs/src/app/features/users/users.component.ts) ~L495, L518

**Description:**
```ts
this.http.post(`/api/users/${userId}/permissions`, {...})
this.http.delete(`/api/users/${userId}/permissions/${perm.id}`)
```
These use relative paths instead of `environment.apiUrl`. They bypass the interceptor chain in cross-origin deployments.

**Recommendation:** Use `environment.apiUrl + '/users/...'` consistently.

---

### 🟡 MEDIUM — Duplicate `institute` route in Angular router

**Location:** [`app.routes.ts`](file:///D:/root/pdhs/src/app/app.routes.ts) ~L41–43 and L69–71

**Description:** `path: 'institute'` registered twice — once as `loadComponent`, once as a dead `loadChildren`. Angular resolves only the first match.

**Recommendation:** Remove the dead `loadChildren` variant.

---

### ✅ All `*appHasPermission` checks are cosmetic UI gates (backend re-verifies) — by design
### ✅ `authGuard` on shell route prevents unauthenticated access to all feature routes

---

## 7. Audit Trail

> [!CAUTION]
> Audit logging is missing from the most sensitive modules. For a healthcare asset management system, this is a significant compliance gap.

| Module | Audit Logging | Notes |
|--------|-------------|-------|
| `RepairModule` | ✅ Yes | `auditService.log()` on status changes, escalations, vendor completion |
| `UsersModule` | ❌ **None** | No audit on user create/delete/role grant/permission grant — most critical gap |
| `SupplierModule` | ❌ **None** | No `AuditModule` import, no audit calls |
| `EquipmentModule` | ❌ **None** | No audit on create/update/assign |
| `InventoryModule` | ❌ **None** | Only GET endpoint exists currently |
| `InstituteModule` | ❌ **None** | No audit |
| `OrganizationModule` | ❌ **None** | No audit |
| `DashboardModule` | N/A | Reads only — acceptable |

> [!NOTE]
> The frontend's `upsertService.logAudit()` only calls `console.log()` — it does **NOT** call a backend endpoint. Frontend audit logging is completely non-functional.

**Recommendation:** Add `AuditModule` to `UsersModule`, `SupplierModule`, `EquipmentModule` and call `auditService.log()` on all write operations.

---

## 8. UserPermission (Per-User Grants)

### 🟡 MEDIUM — `syncPermissions()` skips temporary grants → potential unique constraint error

**Location:** [`users.service.ts`](file:///D:/root/pdhs-api/src/modules/users/users.service.ts) ~L425–434

**Description:**
```ts
this.prisma.userPermission.deleteMany({
  where: { userId, expiresAt: null },  // only deletes permanent grants
}),
```
Temporary (time-boxed) permissions survive a "sync". If a temporary grant exists for a permission being re-created as permanent, Prisma throws a unique constraint error (`@@unique([userId, permission])`).

**Recommendation:** Delete ALL grants (both permanent and temporary) before recreating the submitted set.

---

### 🟡 MEDIUM — `assertCanGrantPermission()` checks static role map, not live `UserPermission` table

**Location:** [`users.service.ts`](file:///D:/root/pdhs-api/src/modules/users/users.service.ts) ~L525–536

**Description:** Checks `ROLE_PERMISSIONS[activeRole.role]` (static map) instead of the user's actual DB permissions. If a user's specific permission was revoked in `UserPermission` but their role still has it in the static map, they can still grant it to others.

Additionally: a user with `PERMISSION_CREATE` could grant themselves permissions their role holds in the static map (even if revoked from their personal `UserPermission` row). **This is a subtle privilege escalation path.**

**Recommendation:** Use an async DB-backed check (`hasPermissionForUser()`) instead of the static role map.

---

### ✅ Expiring permission grants work correctly
Both `PermissionGuard` and `PermissionService.hasPermissionForUser()` filter with `OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]`.

### ✅ Refresh tokens stored as SHA-256 hashes only (plaintext never persisted)

---

## 9. Miscellaneous Risks

### 🟡 MEDIUM — CORS allows hardcoded internal IP `http://10.20.16.17:3000`

**Location:** [`main.ts`](file:///D:/root/pdhs-api/src/main.ts) ~L12–18

**Description:** Hardcoded internal IP in CORS origins. If the IP reassigns, another internal machine gains credentialed cross-origin access.

**Recommendation:** Move CORS origins to environment configuration (`CORS_ORIGINS` env var).

---

### 🟡 MEDIUM — Work order status update spreads raw `payload` into Prisma data

**Location:** [`repair.service.ts`](file:///D:/root/pdhs-api/src/modules/repair/repair.service.ts) ~L511–514

**Description:**
```ts
const updateData: any = {
  status,
  statusDate: new Date(),
  ...updateWorkordertemp,  // Raw payload spread — any remaining fields go into Prisma
};
```
`payload` is typed as `any` so `ValidationPipe({ whitelist: true })` does NOT strip unknown fields from it. Fields like `repairRequestId` or `institutionId` could be overwritten.

**Recommendation:** Define a strict DTO for each work order status transition payload.

---

### 🟡 MEDIUM — `PartUsed` upsert uses wrong key

**Location:** [`repair.service.ts`](file:///D:/root/pdhs-api/src/modules/repair/repair.service.ts) ~L561

**Description:**
```ts
await tx.partUsed.upsert({
  where: { id: part.inventoryItemId },  // Wrong! PartUsed.id is a cuid, not inventoryItemId
```
This always creates new rows instead of updating, potentially creating duplicate `PartUsed` entries and incorrect inventory deductions.

**Recommendation:** Fix the upsert key to use the correct `PartUsed` ID or a composite unique key.

---

### 🟡 MEDIUM — `BaseQueryDto.sortOrder` missing `@IsIn(['asc', 'desc'])` validator

**Location:** [`base-query.dto.ts`](file:///D:/root/pdhs-api/src/shared/dto/base-query.dto.ts) ~L20

**Recommendation:** Add `@IsIn(['asc', 'desc'])` to the `sortOrder` field.

---

### ℹ️ INFO — `IdService` uses `$queryRaw` with parameterized template literals — safe from SQL injection

### ℹ️ INFO — `ValidationPipe({ transform: true, whitelist: true })` is global — good baseline

### ℹ️ INFO — No rate limiting on `/api/auth/login` or `/api/auth/forgot-password` — brute-force risk

**Recommendation:** Add `@nestjs/throttler` with appropriate limits on auth endpoints.

### ℹ️ INFO — `supplyItem` stored as `Json?` in Prisma — no DB-level schema validation

---

## 10. Files Not Found / Unconfirmed

| Expected Path | Status |
|---|---|
| `D:\root\pdhs\src\app\features\users\user-api.service.ts` | Found at `D:\root\pdhs\src\app\core\services\user-api.service.ts` instead |
| `D:\root\pdhs-api\src\modules\organization\dto\organization.dto.ts` | Confirmed exists via imports, not directly read |
| `D:\root\pdhs-api\src\auth\auth.dto.ts` | Confirmed via usage in auth.controller.ts |

---

## Prioritized Remediation Table

| # | Severity | Finding | Location | Action |
|---|----------|---------|----------|--------|
| 1 | 🔴 Critical | Unauthenticated `GET /api/developer/users` exposes entire user directory | `delete-deploy.controller.ts`, `users.module.ts`, `user-api.service.ts` | **Delete the controller and all references immediately** |
| 2 | 🔴 Critical | Hardcoded JWT secret `'soft_solution_software_@_laksha_@_1227'` in source | `auth.module.ts`, `auth.service.ts`, `jwt.strategy.ts` | Remove all fallbacks; fail on missing env var; rotate production secret |
| 3 | 🔴 Critical | Inventory has no scope enforcement (`{}` passed as scope filter) | `inventory.service.ts` L18 | Pass `scopeService.inventoryWhere(activeRole)` |
| 4 | 🔴 Critical | Frontend sends no role/scope headers → all requests use first JWT role | `user-session.interceptor.ts` | Add `x-role`, `x-scope-type`, `x-scope-id` headers from active session |
| 5 | 🟠 High | Password reset token logged to console in plaintext | `auth.service.ts` ~L204 | Remove `console.log`; disable endpoint until mail service is wired |
| 6 | 🟠 High | `POST /api/users/:id/reset-password` has no permission check | `users.controller.ts` ~L116 | Replace `@SkipPermission()` with `@RequirePermission(USER_UPDATE)` |
| 7 | 🟠 High | Equipment create/update/assign ignores scope (can affect any institution) | `equipment.service.ts` | Add scope assertions before write operations |
| 8 | 🟠 High | No audit logging for Users, Suppliers, Equipment modules | Multiple modules | Add `AuditModule` + `auditService.log()` to all write paths |
| 9 | 🟠 High | `ScopeService.instituteWhere()` / `equipmentWhere()` missing `default` ForbiddenException | `scope.service.ts` | Add `default: throw new ForbiddenException('Invalid scope')` |
| 10 | 🟠 High | `findWorkOrder()` uses static role map check instead of DB UserPermission | `repair.service.ts` ~L393, L414 | Use `@RequirePermission()` with PermissionGuard DB-backed check |
| 11 | 🟠 High | `GET /api/auth/permissions/meta` publicly accessible (no guards) | `auth.controller.ts` | Add `@UseGuards(JwtAuthGuard)` |
| 12 | 🟡 Medium | `syncPermissions()` skips temporary grants → unique constraint error on re-sync | `users.service.ts` ~L426 | Delete all grants (permanent + temporary) before recreating |
| 13 | 🟡 Medium | `assertCanGrantPermission()` checks static map → subtle privilege escalation path | `users.service.ts` ~L530 | Use async `hasPermissionForUser()` DB check |
| 14 | 🟡 Medium | `users.component.ts` uses hardcoded `/api/...` paths bypassing interceptor | `users.component.ts` ~L495, L518 | Use `environment.apiUrl` |
| 15 | 🟡 Medium | Work order status update spreads raw `payload` into Prisma data | `repair.service.ts` ~L511 | Define per-transition DTOs with class-validator |
| 16 | 🟡 Medium | CORS origins contain hardcoded internal IP | `main.ts` ~L16 | Move to env config (`CORS_ORIGINS`) |
| 17 | 🟡 Medium | `STORE_KEEPER` has `INSTITUTE_CREATE` (out of role scope) | `role-permissions.ts` ~L217 | Remove unless deliberate |
| 18 | 🟡 Medium | `INSTITUTION_USER` has `SUPPLIER_CREATE`/`UPDATE` | `role-permissions.ts` ~L281 | Confirm business intent |
| 19 | 🟡 Medium | `ADMIN_INSTITUTE` can grant but not revoke permissions | `role-permissions.ts` ~L175 | Add `PERMISSION_REMOVE` or document as policy |
| 20 | 🟡 Medium | Supplier `PUT` accepts `PROCUREMENT_CREATE` instead of `PROCUREMENT_UPDATE` | `suppliers.controller.ts` ~L70 | Use `PROCUREMENT_UPDATE` |
| 21 | 🟡 Medium | `PrismaQueryBuilder` exact filter bug — ORs all filters against each value | `prisma-query-builder.ts` ~L47 | Fix to AND with per-field exact match |
| 22 | 🟡 Medium | `sortBy` accepts arbitrary strings; no runtime validation | `base-query.dto.ts`, `PrismaQueryBuilder` | Whitelist allowed values per DTO |
| 23 | 🟡 Medium | `PartUsed` upsert uses wrong key (`inventoryItemId` as `id`) | `repair.service.ts` ~L561 | Fix upsert key |
| 24 | 🟡 Medium | `sortOrder` missing `@IsIn(['asc', 'desc'])` validator | `base-query.dto.ts` ~L20 | Add `@IsIn` validator |
| 25 | 🟡 Medium | FE `hasValidToken()` treats tokens with no `exp` claim as valid | `auth.service.ts` (FE) ~L109 | Treat missing `exp` as invalid |
| 26 | 🟢 Low | No rate limiting on auth endpoints (brute-force risk) | `auth.controller.ts` | Add `@nestjs/throttler` |
| 27 | 🟢 Low | Duplicate `institute` route in Angular router | `app.routes.ts` ~L69 | Remove dead `loadChildren` variant |
| 28 | 🟢 Low | JWT stored in `localStorage` (XSS-accessible) | `auth.service.ts` (FE) ~L53 | Consider HttpOnly cookies long-term |
