// role-permissions.ts

import { RoleType } from '@prisma/client';
import { Permission } from './permission.enum';

export const ROLE_PERMISSIONS:Record<RoleType, Permission[]> = {

  SUPER_ADMIN_PDHS: Object.values(Permission)
    .filter(v => typeof v === 'number') as Permission[],

  ADMIN_PDHS: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,

    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,

    Permission.USER_VIEW
  ],

  VIEWER_PDHS: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW
  ],

  SUPER_ADMIN_RDHS: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW,
    Permission.USER_VIEW
  ],

  ADMIN_RDHS: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW
  ],

  VIEWER_RDHS: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW
  ],

  SUPER_ADMIN_INSTITUTE: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW
  ],

  ADMIN_INSTITUTE: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.EQUIPMENT_VIEW
  ],

  VIEWER_INSTITUTE: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW
  ],

  STORE_KEEPER: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.INVENTORY_UPDATE
  ],

  BIOMEDICAL_TECHNICIAN: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.WORK_ORDER_VIEW
  ],

  PROCUREMENT_OFFICER: [
    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW
  ],

  INSTITUTION_USER: [
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW
  ]
};