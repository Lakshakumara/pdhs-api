import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';

// ───────────────────────────────────────────────────────────────────────
// 1. JwtAuthGuard
//
// Verifies the JWT signature + expiry (via passport-jwt / JwtStrategy)
// and populates req.user with the decoded payload — { sub, username,
// fullName, institutionId, roles: JwtRoleClaim[] }.
// ───────────────────────────────────────────────────────────────────────
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// ───────────────────────────────────────────────────────────────────────
// 2. ActiveRoleGuard
//
// Resolves req.activeRole — the single { role, scopeType, scopeId }
// that PermissionService.require() and ScopeService.xxxWhere() operate
// on. This is the ONLY thing this guard does; permission checks and
// scope-based where-clauses are handled by PermissionService /
// ScopeService, called from within service handlers.
//
// SECURITY: x-role / x-scope-type / x-scope-id are client-controlled
// headers and are NOT trusted on their own. This guard cross-checks them
// against req.user.roles — which came from the SIGNED JWT. If the
// requested role/scope combination isn't one the token actually carries,
// the request is rejected.
//
// Must run AFTER JwtAuthGuard (needs req.user):
//   @UseGuards(JwtAuthGuard, ActiveRoleGuard)
// ───────────────────────────────────────────────────────────────────────
@Injectable()
export class ActiveRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const jwtRoles: JwtRoleClaim[] = req.user?.roles ?? [];

    if (jwtRoles.length === 0) {
      throw new ForbiddenException('Account has no assigned roles');
    }

    const headerRole = req.headers['x-role'] as string | undefined;
    const headerScopeType = req.headers['x-scope-type'] as string | undefined;
    const headerScopeId = (req.headers['x-scope-id'] as string | undefined) || null;

    let activeRole: JwtRoleClaim | undefined;

    if (headerRole && headerScopeType) {
      activeRole = jwtRoles.find(
        (r) =>
          r.role === headerRole &&
          r.scopeType === headerScopeType &&
          (r.scopeId ?? '') === (headerScopeId ?? ''),
      );

      if (!activeRole) {
        throw new ForbiddenException(
          'The requested role/scope (x-role, x-scope-type, x-scope-id) ' +
            'is not assigned to this account',
        );
      }
    } else {
      // No active-role headers sent — default to the first role on the token.
      activeRole = jwtRoles[0];
    }

    req.activeRole = activeRole;
    return true;
  }
}
