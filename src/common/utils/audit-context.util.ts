import { Request } from 'express';
import { JwtPayload, JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { AuditContext } from 'src/service/audit.service';


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
