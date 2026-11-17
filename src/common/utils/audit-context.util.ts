import { Request } from 'express';
import { JwtPayload, JwtRoleClaim } from '../../auth/jwt-payload.interface';

/** Captured caller context — attached to every audit log entry. */
export interface AuditContext {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

/**
 * Builds an AuditContext from an authenticated Express request.
 * Call this in service methods after a successful write to create an
 * audit log entry via AuditService.log().
 *
 * Impersonation: when the request carries an impersonation token
 * (`impersonator` claim), the entry is attributed to the REAL actor
 * (the admin) with the target user recorded in `userName`, so
 * `audit_logs.userId` always answers "who actually did this".
 */
export function buildAuditContext(req: Request): AuditContext {
  // Passport declares `user?: User`; JwtAuthGuard actually places the
  // decoded JwtPayload there. Cast once, here, instead of forcing every
  // controller to annotate its @Req() parameter.
  const user = req.user as JwtPayload | undefined;
  const activeRole = (req as { activeRole?: JwtRoleClaim }).activeRole;

  if (!user) {
    return { userId: 'unknown', userName: 'unknown', userRole: 'UNKNOWN' };
  }

  const imp = user.impersonator;
  return {
    userId: imp?.sub ?? user.sub,
    userName: imp ? `${imp.fullName} → ${user.fullName}` : user.fullName,
    userRole: activeRole?.role ?? user.roles?.[0]?.role ?? 'UNKNOWN',
    ipAddress: req.ip,
  };
}
