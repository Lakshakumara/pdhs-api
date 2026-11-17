# Developer Access — Operational Procedure

How engineers get and use access to PDHS **without** a `DEVELOPER` role,
shared passwords, or any backdoor. Three pillars, all audit-ready.

---

## Pillar 1 — Named technical administrator (production)

**Do not create a `DEVELOPER` role.** `RoleType` stays 100% healthcare-domain.

1. Create ONE named account per engineer (e.g. `eng_admin`, your name).
2. Assign the existing **`SUPER_ADMIN_PDHS`** role, scope **PDHS**.
3. Give it a unique strong password — never `pdhs@123`, never shared.
4. Every action lands in `pdhs.audit_logs` stamped with that account, so
   auditors always see **which person** did what.

### Pre-deploy checklist

- [ ] No seed accounts exist in production, or their passwords were changed:
      `admin`, `super_admin`, `pdhs_director`, `rdhs_rat`, `rdhs_keg`,
      `tech_nuwan`, `store_keeper`, `proc_sajith`, `bh_rat_user`, `dh_bal_user`
      (seed default password is `pdhs@123`).
- [ ] The 16 Base Hospital review accounts (seeded for demo sessions —
      `<place>_admin` = `ADMIN_INSTITUTE`, `<place>_user` = `INSTITUTION_USER`
      for Balangoda, Kahawatta, Kalawana, Eheliyagoda, Kolonna, Mawanalla,
      Warakapola, Karawanella; all share `pdhs@123`, `mustChangePassword: false`)
      are deactivated after the review if the system goes live.
- [ ] `NODE_ENV=production` on the server (keeps dev-only code out).
- [ ] `JWT_SECRET` in `.env` is rotated away from the checked-in default.

---

## Pillar 2 — "View As" (troubleshooting a hospital user's issue)

Never ask hospital staff for their password.

1. Sign in with your named `SUPER_ADMIN_PDHS` account.
2. Go to **Users**, open the user's drawer, press the **eye** button
   ("View As"). Gated by `AUTH_IMPERSONATE` (super-admin default only).
3. Backend `POST /api/auth/impersonate/:userId`:
   - requires `JwtAuthGuard + ActiveRoleGuard + PermissionGuard` with
     `@RequirePermission(AUTH_IMPERSONATE)`;
   - issues a **15-minute** token carrying the target's roles/permissions
     **plus** an `impersonator` claim — **no refresh token**, cannot be extended;
   - writes an `IMPERSONATE_START` row to `audit_logs`.
4. An amber banner shows the target's name, role and a live countdown, with
   an **Exit View As** button (`POST /api/auth/impersonate/end` →
   `IMPERSONATE_END` row, restores your real session).
5. While impersonating, **every action you take is attributed to YOU**
   (`userId` = admin, `userName` = `"Admin → Target"`), because
   `buildAuditContext()` prefers the `impersonator` claim.

If the token expires, the frontend detects the 401 and silently restores
your admin session.

---

## Pillar 3 — Local & staging role switching

The **Dev Quick Login** panel on the login page (`ng serve` only):

- Gated by `!environment.production || isDevMode()` — a production build
  compiles the panel out entirely.
- Personas are a **static list** in `src/environments/environment.development.ts`
  (`devPersonas` + `devPassword`) — there is **no backend endpoint** behind it.
- Selecting a persona fills the form and performs a **real**
  `POST /api/auth/login`. No authentication is bypassed anywhere.

To add a test persona: add an entry to `devPersonas` (username must exist in
the seed) — nothing else.

---

## Summary

| Need | What to use |
|---|---|
| Deploying updates / maintenance | Your named `SUPER_ADMIN_PDHS` account (Pillar 1) |
| Testing new features locally | Dev Quick Login on the login page (Pillar 3) |
| Hospital user reports a bug | Audit log query, or **View As** (Pillar 2) |
| Schema / roles | Keep `RoleType` healthcare-only — never add a developer role |

## Permission plumbing (when adding to this)

`AUTH_IMPERSONATE` lives in `src/auth/constants/permission.registry.ts` and is
granted via `ROLE_PERMISSIONS.SUPER_ADMIN_PDHS` in
`src/auth/constants/role-permissions.ts`. After changing either:

```
npm run build        # regenerates FE permission files (gen:perms on prebuild)
npm run sync:perms   # backfills the new default to existing users
```
