export const PERMISSIONS = {
  // Institutions
  INSTITUTE_VIEW: {
    group: 'Institutions',
    label: 'View Institutions',
    description: 'Can view institution list and details',
    icon: 'pi-building',
    action: 'view',
  },
  INSTITUTE_CREATE: {
    group: 'Institutions',
    label: 'Create Institution',
    description: 'Can create new institution',
    icon: 'pi-building',
    action: 'create',
  },
  INSTITUTE_UPDATE: {
    group: 'Institutions',
    label: 'Update Institution',
    description: 'Can update institution info',
    icon: 'pi-building',
    action: 'update',
  },
  INSTITUTE_DELETE: {
    group: 'Institutions',
    label: 'Delete Institution',
    description: 'Can delete / deactivate institution',
    icon: 'pi-building',
    action: 'delete',
  },

  // Inventory
  INVENTORY_VIEW: {
    group: 'Inventory',
    label: 'View Inventory',
    description: 'View inventory items',
    icon: 'pi-warehouse',
    action: 'view',
  },
  INVENTORY_CREATE: {
    group: 'Inventory',
    label: 'Create Inventory',
    description: 'Add new inventory items',
    icon: 'pi-warehouse',
    action: 'create',
  },
  INVENTORY_UPDATE: {
    group: 'Inventory',
    label: 'Update Inventory',
    description: 'Update inventory stock/details',
    icon: 'pi-warehouse',
    action: 'update',
  },
  INVENTORY_DELETE: {
    group: 'Inventory',
    label: 'Delete Inventory',
    description: 'Delete inventory items',
    icon: 'pi-warehouse',
    action: 'delete',
  },

  // Equipment
  EQUIPMENT_VIEW: {
    group: 'Equipment',
    label: 'View Equipment',
    description: 'View biomedical equipment',
    icon: 'pi-box',
    action: 'view',
  },
  EQUIPMENT_CREATE: {
    group: 'Equipment',
    label: 'Create Equipment',
    description: 'Register new equipment',
    icon: 'pi-box',
    action: 'create',
  },
  EQUIPMENT_UPDATE: {
    group: 'Equipment',
    label: 'Update Equipment',
    description: 'Update equipment details',
    icon: 'pi-box',
    action: 'update',
  },
  EQUIPMENT_ASSIGN: {
    group: 'Equipment',
    label: 'Assign Equipment',
    description: 'Assign equipment to institution/department',
    icon: 'pi-box',
    action: 'assign',
  },
  EQUIPMENT_DISPOSE: {
    group: 'Equipment',
    label: 'Dispose Equipment',
    description: 'Mark equipment as disposed/condemned',
    icon: 'pi-box',
    action: 'dispose',
  },
  EQUIPMENT_DELETE: {
    group: 'Equipment',
    label: 'Delete Equipment',
    description: 'Delete equipment record',
    icon: 'pi-box',
    action: 'delete',
  },

  // Repairs
  REPAIR_REQUEST_VIEW: {
    group: 'Repairs',
    label: 'View Repair Requests',
    description: 'View repair requests',
    icon: 'pi-wrench',
    action: 'view',
  },
  REPAIR_REQUEST_CREATE: {
    group: 'Repairs',
    label: 'Create Repair Request',
    description: 'Create new repair request',
    icon: 'pi-wrench',
    action: 'create',
  },
  REPAIR_REQUEST_UPDATE: {
    group: 'Repairs',
    label: 'Update Repair Request',
    description: 'Update repair request status/details',
    icon: 'pi-wrench',
    action: 'update',
  },

  // Work Orders - this is where you were missing 2
  WORK_ORDER_VIEW: {
    group: 'Work Orders',
    label: 'View Work Orders',
    description: 'View work orders',
    icon: 'pi-clipboard',
    action: 'view',
  },
  WORK_ORDER_ASSIGN: {
    group: 'Work Orders',
    label: 'Assign Work Order',
    description: 'Assign work order to technician',
    icon: 'pi-clipboard',
    action: 'assign',
  },
  WORK_ORDER_COMPLETE: {
    group: 'Work Orders',
    label: 'Complete Work Order',
    description: 'Mark work order as completed',
    icon: 'pi-clipboard',
    action: 'complete',
  },
  WORK_ORDER_ESCALATE_VENDOR: {
    group: 'Work Orders',
    label: 'Escalate to Vendor',
    description: 'Technician escalates to vendor',
    icon: 'pi-clipboard',
    action: 'escalate',
  },
  WORK_ORDER_VERIFY: {
    group: 'Work Orders',
    label: 'Verify Work Order',
    description: 'Verify completed work',
    icon: 'pi-clipboard',
    action: 'verify',
  },

  // Procurement
  PROCUREMENT_VIEW: {
    group: 'Procurement',
    label: 'View Procurement',
    description: 'View procurement requests',
    icon: 'pi-shopping-cart',
    action: 'view',
  },
  PROCUREMENT_CREATE: {
    group: 'Procurement',
    label: 'Create Procurement',
    description: 'Create procurement request',
    icon: 'pi-shopping-cart',
    action: 'create',
  },
  PROCUREMENT_APPROVE: {
    group: 'Procurement',
    label: 'Approve Procurement',
    description: 'Approve/reject procurement',
    icon: 'pi-shopping-cart',
    action: 'approve',
  },

  // Users
  USER_VIEW: {
    group: 'Users',
    label: 'View Users',
    description: 'View users',
    icon: 'pi-users',
    action: 'view',
  },
  USER_CREATE: {
    group: 'Users',
    label: 'Create User',
    description: 'Create new user',
    icon: 'pi-users',
    action: 'create',
  },
  USER_UPDATE: {
    group: 'Users',
    label: 'Update User',
    description: 'Update user details/roles',
    icon: 'pi-users',
    action: 'update',
  },
  USER_DELETE: {
    group: 'Users',
    label: 'Delete User',
    description: 'Delete/deactivate user',
    icon: 'pi-users',
    action: 'delete',
  },

  // Permission Management
  PERMISSION_VIEW: {
    group: 'Permission',
    label: 'View Permissions',
    description: 'View assigned permissions',
    icon: 'pi-key',
    action: 'view',
  },
  PERMISSION_CREATE: {
    group: 'Permission',
    label: 'Grant Permission',
    description: 'Grant permanent permission',
    icon: 'pi-key',
    action: 'create',
  },
  PERMISSION_CREATE_TEMPORARY: {
    group: 'Permission',
    label: 'Grant Temporary Permission',
    description: 'Grant time-boxed permission',
    icon: 'pi-key',
    action: 'create_temporary',
  },
  PERMISSION_REMOVE: {
    group: 'Permission',
    label: 'Remove Permission',
    description: 'Revoke permission',
    icon: 'pi-key',
    action: 'remove',
  },

  // Audit
  AUDIT_VIEW: {
    group: 'Audit',
    label: 'View Audit Logs',
    description: 'View system audit trail',
    icon: 'pi-history',
    action: 'view',
  },
} as const;

// --- Derived types - don't edit below ---
export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const PERMISSION_GROUPS = Object.values(PERMISSIONS).reduce(
  (acc, curr, idx) => {
    const key = Object.keys(PERMISSIONS)[idx] as Permission;
    const groupName = curr.group;
    let g = acc.find((x) => x.group === groupName);
    if (!g) {
      g = { group: groupName, icon: curr.icon, permissions: [] as Permission[] };
      acc.push(g);
    }
    g.permissions.push(key);
    return acc;
  },
  [] as { group: string; icon: string; permissions: Permission[] }[],
);