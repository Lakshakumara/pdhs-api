import { RoleType, ScopeType } from '@prisma/client';

/**
 * One entry per UserRole row — embedded in the JWT so ActiveRoleGuard can
 * validate x-role / x-scope-type / x-scope-id headers WITHOUT a DB
 * round-trip on every request.
 *
 * Deliberately does NOT include `permission`. Permission checks happen
 * against the UserPermission table (PermissionService.requireForUser /
 * PermissionGuard), so permission-set changes and expiring grants are
 * evaluated fresh on every request.
 *
 * `sub` (userId) is stamped into each claim at login and re-attached by
 * ActiveRoleGuard from the payload for pre-existing tokens, so service
 * level checks always know WHICH user to look up.
 */
export interface JwtRoleClaim {
  sub: string;
  role: RoleType;
  scopeType: ScopeType;
  scopeId: string | null;
}

/**
 * Set ONLY on impersonation ("View As") tokens issued by
 * POST /api/auth/impersonate/:userId. `sub`/`roles` describe the
 * IMPERSONATED user — permissions and scope resolve as that user —
 * while this field preserves the real actor for audit attribution
 * (see buildAuditContext) and for the frontend banner.
 *
 * Impersonation tokens are short-lived (15m) and are never issued a
 * refresh token, so they cannot be extended via POST /auth/refresh.
 */
export interface ImpersonatorClaim {
  sub: string; // admin's userId (the REAL actor)
  username: string;
  fullName: string;
}

export interface JwtPayload {
  sub: string; // userId
  username: string;
  fullName: string;
  institutionId: string | null;
  roles: JwtRoleClaim[];
  impersonator?: ImpersonatorClaim;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Express Request augmentation
//
// - req.user        ← populated by JwtAuthGuard (decoded JWT payload).
//                      Passport declares this as `User | undefined`; cast
//                      to JwtPayload where you need to access .sub etc.
// - req.activeRole  ← populated by ActiveRoleGuard (the JwtRoleClaim
//                      matching x-role/x-scope-* headers, or roles[0]
//                      if absent; `sub` always filled from the payload).
//                      Consume via @ActiveRole() decorator, then pass to
//                      PermissionService.requireForUser() and
//                      ScopeService.xxxWhere().
// ─────────────────────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      // NOTE: do NOT redeclare `user` here — passport already declares
      // user?: User | undefined. Use `(req.user as JwtPayload)` at
      // call-sites instead.
      activeRole?: JwtRoleClaim;
    }
  }
}
