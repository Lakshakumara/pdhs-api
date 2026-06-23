import { Permission } from "src/auth/permission.enum";

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;

  active: boolean;
  mustChangePassword: boolean;

  institutionId?: string | null;
  institutionName?: string | null;

  districtId?: string | null;
  districtName?: string | null;

  roles: UserRoleDto[];
  permissions: UserPermissionRecord[];
}

export interface UserRoleDto {
  id: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  //permission: Permission[] | null
  assignedAt: Date;
  assignedById: string | null;
}
export interface UserPermissionRecord {
  id: string;
  permission: Permission;
  grantedAt: string;
  expiresAt: string | null;
  note: string | null;
  active: boolean;
  grantedBy: { id: string; fullName: string } | null;
}