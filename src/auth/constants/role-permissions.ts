// role-permissions.ts
//
// AUTHORIZATION POLICY — the single backend source for:
//   ROLE_PERMISSIONS  role → default permissions (applied at user create /
//                     role add; exposed via /auth/permissions/meta)
//   SCOPE_ROLES       scope level → roles assignable at that level
//   ROLE_META / SCOPE_META  display metadata (labels, colors) for the UI
// The frontend gets all of these generated into
// src/app/core/models/permission.types.ts by `npm run gen:perms`.

import { RoleType, ScopeType } from '@prisma/client';
import { Permission } from '../permission.enum';

// Roles allowed to be assigned at each scope level
export const SCOPE_ROLES: Record<ScopeType, RoleType[]> = {
  PDHS: [
    RoleType.SUPER_ADMIN_PDHS,
    RoleType.ADMIN_PDHS,
    RoleType.VIEWER_PDHS,
    RoleType.STORE_KEEPER,
    RoleType.BIOMEDICAL_TECHNICIAN,
    RoleType.PROCUREMENT_OFFICER,
  ],
  RDHS: [RoleType.SUPER_ADMIN_RDHS, RoleType.ADMIN_RDHS, RoleType.VIEWER_RDHS],
  INSTITUTE: [
    RoleType.SUPER_ADMIN_INSTITUTE,
    RoleType.ADMIN_INSTITUTE,
    RoleType.VIEWER_INSTITUTE,
    RoleType.INSTITUTION_USER,
  ],
};

// Display metadata for role badges / selects (UI only — not auth logic)
export const ROLE_META: Record<RoleType, { label: string; color: string }> = {
  SUPER_ADMIN_PDHS: { label: 'Super Admin (PDHS)', color: '#dc2626' },
  ADMIN_PDHS: { label: 'Admin (PDHS)', color: '#7c3aed' },
  VIEWER_PDHS: { label: 'Viewer (PDHS)', color: '#0284c7' },
  SUPER_ADMIN_RDHS: { label: 'Super Admin (RDHS)', color: '#ea580c' },
  ADMIN_RDHS: { label: 'Admin (RDHS)', color: '#6d28d9' },
  VIEWER_RDHS: { label: 'Viewer (RDHS)', color: '#0369a1' },
  SUPER_ADMIN_INSTITUTE: { label: 'Super Admin (Institute)', color: '#d97706' },
  ADMIN_INSTITUTE: { label: 'Admin (Institute)', color: '#5b21b6' },
  VIEWER_INSTITUTE: { label: 'Viewer (Institute)', color: '#075985' },
  STORE_KEEPER: { label: 'Store Keeper', color: '#16a34a' },
  BIOMEDICAL_TECHNICIAN: { label: 'Biomedical Technician', color: '#059669' },
  PROCUREMENT_OFFICER: { label: 'Procurement Officer', color: '#0d9488' },
  INSTITUTION_USER: { label: 'Institution User', color: '#6b7280' },
};

// Display metadata for scope level selects
export const SCOPE_META: Record<ScopeType, { label: string }> = {
  PDHS: { label: 'PDHS (System-wide)' },
  RDHS: { label: 'RDHS (District)' },
  INSTITUTE: { label: 'Institute' },
};

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  SUPER_ADMIN_PDHS: Object.values(Permission).filter(
    (v) => typeof v === 'string',
  ),

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

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.SUPPLIER_DELETE,

    Permission.WORK_ORDER_VIEW,
    Permission.WORK_ORDER_ASSIGN,
    Permission.WORK_ORDER_COMPLETE,
    Permission.WORK_ORDER_ESCALATE_VENDOR,
    Permission.WORK_ORDER_VERIFY,

    Permission.PAYMENT_RECORD,
    Permission.PAYMENT_APPROVE_PDHS,

    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,
    Permission.PROCUREMENT_APPROVE,

    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_CREATE_TEMPORARY,
    Permission.PERMISSION_REMOVE,

    Permission.AUDIT_VIEW,
  ],

  VIEWER_PDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
    Permission.WORK_ORDER_VIEW,
    Permission.PERMISSION_VIEW,
    Permission.USER_VIEW,

    Permission.AUDIT_VIEW,
  ],

  SUPER_ADMIN_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_ASSIGN,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.WORK_ORDER_VIEW,

    Permission.PAYMENT_APPROVE_RDHS,

    Permission.PROCUREMENT_VIEW,

    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_CREATE_TEMPORARY,
    Permission.PERMISSION_REMOVE,

    Permission.AUDIT_VIEW,
  ],

  ADMIN_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,

    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_ASSIGN,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.WORK_ORDER_VIEW,

    Permission.PAYMENT_APPROVE_RDHS,

    Permission.PROCUREMENT_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE_TEMPORARY,
    Permission.PERMISSION_REMOVE,
  ],

  VIEWER_RDHS: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
    Permission.WORK_ORDER_VIEW,
    Permission.PERMISSION_VIEW,
    Permission.USER_VIEW,

    Permission.AUDIT_VIEW,
  ],

  SUPER_ADMIN_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_ASSIGN,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_FEEDBACK,
    Permission.PAYMENT_APPROVE_MS,

    Permission.PROCUREMENT_VIEW,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE_TEMPORARY,
    Permission.PERMISSION_REMOVE,

    Permission.USER_VIEW,

    Permission.AUDIT_VIEW,
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

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.REPAIR_REQUEST_VIEW,

    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_FEEDBACK,
    Permission.PAYMENT_APPROVE_MS,

    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_CREATE,
    Permission.PERMISSION_CREATE_TEMPORARY,
  ],

  VIEWER_INSTITUTE: [
    Permission.INSTITUTE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.REPAIR_REQUEST_VIEW,
    Permission.WORK_ORDER_VIEW,
    Permission.PERMISSION_VIEW,
    Permission.USER_VIEW,

    Permission.AUDIT_VIEW,
  ],

  INSTITUTION_USER: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.REPAIR_REQUEST_CREATE,

    Permission.WORK_ORDER_VIEW,

    Permission.REPAIR_FEEDBACK,
  ],

  STORE_KEEPER: [
    Permission.INSTITUTE_VIEW,
    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_UPDATE,

    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,

    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_ASSIGN,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_CREATE,
    Permission.WORK_ORDER_VIEW,
  ],

  BIOMEDICAL_TECHNICIAN: [
    Permission.INSTITUTE_VIEW,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.WORK_ORDER_VIEW,
    Permission.WORK_ORDER_ASSIGN,
    Permission.WORK_ORDER_COMPLETE,
    Permission.WORK_ORDER_ESCALATE_VENDOR,
    Permission.WORK_ORDER_VERIFY,

    Permission.REPAIR_REQUEST_VIEW,
    Permission.REPAIR_REQUEST_UPDATE,

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
  ],

  PROCUREMENT_OFFICER: [
    Permission.INSTITUTE_VIEW,

    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,

    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.SUPPLIER_DELETE,

    Permission.INVENTORY_VIEW,

    Permission.EQUIPMENT_VIEW,

    Permission.PAYMENT_RECORD,
  ],
};
