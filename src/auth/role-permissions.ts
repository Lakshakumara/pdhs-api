// role-permissions.ts

import { RoleType } from '@prisma/client';
import { Permission } from './permission.enum';

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
    Permission.EQUIPMENT_ASSIGN,
    Permission.EQUIPMENT_DISPOSE,
    
    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.USER_VIEW,
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_TEMPORARY_CREATE,
    Permission.PERMISSION_REMOVE,

    Permission.AUDIT_VIEW
  ],

  VIEWER_PDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.USER_VIEW,

    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,

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
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_TEMPORARY_CREATE,
    Permission.PERMISSION_REMOVE,

    Permission.USER_VIEW
  ],

  ADMIN_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,

    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_TEMPORARY_CREATE,
    Permission.PERMISSION_REMOVE,

  ],

  VIEWER_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
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
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_TEMPORARY_CREATE,
    Permission.PERMISSION_REMOVE,
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
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_TEMPORARY_CREATE,

  ],

  VIEWER_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
  ],

  STORE_KEEPER: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.INVENTORY_UPDATE,
    
    Permission.WORK_ORDER_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_TEMPORARY_CREATE,
  ],

  BIOMEDICAL_TECHNICIAN: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.WORK_ORDER_ASSIGN,
    Permission.WORK_ORDER_COMPLETE,
    Permission.WORK_ORDER_VIEW,
    
    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_TEMPORARY_CREATE,
  ],

  PROCUREMENT_OFFICER: [
    Permission.INSTITUTE_VIEW,

    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_TEMPORARY_CREATE,
  ],

  INSTITUTION_USER: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.PERMISSION_VIEW,

  ]
};