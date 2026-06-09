
import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ScopeService {

  instituteWhere(activeRole: any) {
    switch (activeRole.scopeType) {
      case 'PDHS':
        return {};

      case 'RDHS':
        return {
          districtId:
            activeRole.scopeId
        };

      case 'INSTITUTE':
        return {
          id:
            activeRole.scopeId
        };
    }
  }
  inventoryWhere(activeRole: any) {
    switch (activeRole.scopeType) {
      case 'PDHS':
        return {};

      case 'RDHS':
        return {
          institution: {
            districtId:
              activeRole.scopeId
          }
        };

      case 'INSTITUTE':
        return {
          institutionId:
            activeRole.scopeId
        };

      default:

        throw new ForbiddenException(
          'Invalid scope'
        );
    }
  }

  equipmentWhere(activeRole: any) {
    switch (activeRole.scopeType) {
      case 'PDHS':
        return {};

      case 'RDHS':
        return {
          assignedInstitution: {
            districtId:
              activeRole.scopeId
          }
        };

      case 'INSTITUTE':
        return {
          assignedInstitutionId:
            activeRole.scopeId
        };
    }
  }

  userWhere(
    activeRole: any
  ) {

    switch (
    activeRole.scopeType
    ) {

      case 'PDHS':

        return {};

      case 'RDHS':

        return {
          institution: {
            districtId:
              activeRole.scopeId
          }
        };

      case 'INSTITUTE':

        return {
          institutionId:
            activeRole.scopeId
        };
    }
  }
}