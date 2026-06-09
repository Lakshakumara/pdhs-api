// permission.service.ts

import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Permission } from 'src/auth/permission.enum';
import { ROLE_PERMISSIONS } from 'src/auth/role-permissions';


@Injectable()
export class PermissionService {

  hasPermission(
    role: string,
    permission: Permission): boolean {

    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return permissions.includes(
      permission
    );
  }

  require(role: string, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new ForbiddenException('Permission denied');
    }
  }
}