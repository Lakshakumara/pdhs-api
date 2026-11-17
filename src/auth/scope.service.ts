import { Injectable, ForbiddenException } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { JwtRoleClaim } from './jwt-payload.interface';

@Injectable()
export class ScopeService {
  private requireScopeId(activeRole: JwtRoleClaim): string {
    if (!activeRole.scopeId) {
      throw new ForbiddenException(
        `Missing scope identifier for ${activeRole.scopeType} scope`,
      );
    }
    return activeRole.scopeId;
  }

  /**
   * Scopes institution queries:
   * - PDHS: all institutions
   * - RDHS: institutions within the user's district
   * - INSTITUTE: only the user's own institution
   */
  instituteWhere(activeRole: JwtRoleClaim): Record<string, any> {
    if (!activeRole) {
      throw new ForbiddenException('No active role provided');
    }

    switch (activeRole.scopeType) {
      case ScopeType.PDHS:
        return {};

      case ScopeType.RDHS:
        return {
          districtId: this.requireScopeId(activeRole),
        };

      case ScopeType.INSTITUTE:
        return {
          id: this.requireScopeId(activeRole),
        };

      default:
        throw new ForbiddenException(`Invalid scope type: ${(activeRole as any).scopeType}`);
    }
  }

  /**
   * Scopes inventory item queries:
   * - PDHS: all inventory items
   * - RDHS: inventory items belonging to institutions in user's district
   * - INSTITUTE: inventory items belonging to user's institution
   */
  inventoryWhere(activeRole: JwtRoleClaim): Record<string, any> {
    if (!activeRole) {
      throw new ForbiddenException('No active role provided');
    }

    switch (activeRole.scopeType) {
      case ScopeType.PDHS:
        return {};

      case ScopeType.RDHS:
        return {
          institution: {
            districtId: this.requireScopeId(activeRole),
          },
        };

      case ScopeType.INSTITUTE:
        return {
          institutionId: this.requireScopeId(activeRole),
        };

      default:
        throw new ForbiddenException(`Invalid scope type: ${(activeRole as any).scopeType}`);
    }
  }

  /**
   * Scopes equipment queries:
   * - PDHS: all equipment across the province
   * - RDHS: equipment assigned to institutions in user's district
   * - INSTITUTE: equipment assigned to user's own institution
   */
  equipmentWhere(activeRole: JwtRoleClaim): Record<string, any> {
    if (!activeRole) {
      throw new ForbiddenException('No active role provided');
    }

    switch (activeRole.scopeType) {
      case ScopeType.PDHS:
        return {};

      case ScopeType.RDHS:
        return {
          assignedInstitution: {
            districtId: this.requireScopeId(activeRole),
          },
        };

      case ScopeType.INSTITUTE:
        return {
          assignedInstitutionId: this.requireScopeId(activeRole),
        };

      default:
        throw new ForbiddenException(`Invalid scope type: ${(activeRole as any).scopeType}`);
    }
  }

  /**
   * Generic scope helper for entities with an `institution` relation (e.g. WorkOrder, RepairRequest, AuditLog):
   * - PDHS: all records
   * - RDHS: records linked to an institution in user's district
   * - INSTITUTE: records linked to user's institution
   */
  scopeWhere(activeRole: JwtRoleClaim): Record<string, any> {
    if (!activeRole) {
      throw new ForbiddenException('No active role provided');
    }

    switch (activeRole.scopeType) {
      case ScopeType.PDHS:
        return {};

      case ScopeType.RDHS:
        return {
          institution: {
            districtId: this.requireScopeId(activeRole),
          },
        };

      case ScopeType.INSTITUTE:
        return {
          institutionId: this.requireScopeId(activeRole),
        };

      default:
        throw new ForbiddenException(`Invalid scope type: ${(activeRole as any).scopeType}`);
    }
  }
}
