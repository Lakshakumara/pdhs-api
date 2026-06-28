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
 */
export function buildAuditContext(
  req: Request & { user: JwtPayload; activeRole?: JwtRoleClaim },
): AuditContext {
  return {
    userId: req.user.sub,
    userName: req.user.fullName,
    userRole: req.activeRole?.role ?? req.user.roles[0]?.role ?? 'UNKNOWN',
    ipAddress: req.ip,
  };
}
