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
// scope-based where-clauses are handled by your existing
// PermissionService / ScopeService, called from within handlers.
//
// SECURITY: x-role / x-scope-type / x-scope-id are client-controlled
// headers (set by the frontend's userSessionInterceptor) and are NOT
// trusted on their own. This guard cross-checks them against
// req.user.roles — which came from the SIGNED JWT (see AuthService).
// If the requested role/scope combination isn't one the token actually
// carries, the request is rejected. A client cannot escalate by simply
// sending different header values.
//
// Must run AFTER JwtAuthGuard (needs req.user):
//
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
        r =>
          r.role === headerRole &&
          r.scopeType === headerScopeType &&
          (r.scopeId ?? '') === (headerScopeId ?? ''),
      );

      if (!activeRole) {
        // Client claimed a role/scope combination this token does not
        // actually carry — reject rather than silently falling back.
        throw new ForbiddenException(
          'The requested role/scope (x-role, x-scope-type, x-scope-id) ' +
          'is not assigned to this account',
        );
      }
    } else {
      // No active-role headers sent (e.g. single-role accounts, or
      // GET /api/users/me on first load) — default to the first role
      // on the token.
      activeRole = jwtRoles[0];
    }

    req.activeRole = activeRole;
    return true;
  }
}


/*import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization token');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.authService.validateToken(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Session expired or invalid token');
    }
  }
}*/
