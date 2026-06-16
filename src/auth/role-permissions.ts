// role-permissions.ts

import { RoleType } from '@prisma/client';
import { Permission } from './permission.enum';
import { permission } from 'process';

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {

  SUPER_ADMIN_PDHS: Object.values(Permission)
    .filter(v => typeof v === 'string') as Permission[],
 
  ADMIN_PDHS: [

    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,

    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.USER_VIEW,

    Permission.AUDIT_VIEW
  ],

  VIEWER_PDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.USER_VIEW,

    Permission.AUDIT_VIEW
  ],

  SUPER_ADMIN_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,

    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.USER_VIEW
  ],

  ADMIN_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW
  ],

  VIEWER_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
  ],

  SUPER_ADMIN_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,

    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,
  ],

  ADMIN_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,
  ],

  VIEWER_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
  ],

  STORE_KEEPER: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.INVENTORY_UPDATE
  ],

  BIOMEDICAL_TECHNICIAN: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.WORK_ORDER_ASSIGN,
    Permission.WORK_ORDER_COMPLETE,
    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,
  ],

  PROCUREMENT_OFFICER: [
    Permission.INSTITUTE_VIEW,

    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW
  ],

  INSTITUTION_USER: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,
  ]
};