
import { Permission } from '../src/auth/permission.enum';
import { ROLE_PERMISSIONS } from '../src/auth/constants/role-permissions';
import { RoleType } from '@prisma/client';

// Default password for all seeded users: pdhs@123

// Hash generated with bcrypt saltRounds=10
const DEFAULT_PASSWORD_HASH = '$2b$10$guml/x4W4RiFVpSX0Y0q2ufbhxAOm60rqTmQbCGUgivHoAMzEYtwe'

// ─────────────────────────────────────────────
// ROLE PERMISSIONS (mirrors role-permissions.ts)
// ─────────────────────────────────────────────
/*const ROLE_PERMISSIONS = {
  SUPER_ADMIN_PDHS: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE','INSTITUTE_DELETE',
    'INVENTORY_VIEW','INVENTORY_CREATE','INVENTORY_UPDATE','INVENTORY_DELETE',
    'EQUIPMENT_VIEW','EQUIPMENT_CREATE','EQUIPMENT_UPDATE','EQUIPMENT_ASSIGN','EQUIPMENT_DISPOSE','EQUIPMENT_DELETE',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE','REPAIR_REQUEST_UPDATE',
    'WORK_ORDER_VIEW','WORK_ORDER_ASSIGN','WORK_ORDER_COMPLETE',
    'PROCUREMENT_VIEW','PROCUREMENT_CREATE','PROCUREMENT_APPROVE',
    'USER_VIEW','USER_CREATE','USER_UPDATE','USER_DELETE',
    'PERMISSION_VIEW','PERMISSION_CREATE','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  ADMIN_PDHS: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE','INSTITUTE_DELETE',
    'INVENTORY_VIEW','INVENTORY_CREATE','INVENTORY_UPDATE',
    'EQUIPMENT_VIEW','EQUIPMENT_CREATE','EQUIPMENT_UPDATE','EQUIPMENT_ASSIGN','EQUIPMENT_DISPOSE',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE','REPAIR_REQUEST_UPDATE',
    'WORK_ORDER_VIEW','WORK_ORDER_ASSIGN','WORK_ORDER_COMPLETE',
    'PROCUREMENT_VIEW','PROCUREMENT_CREATE','PROCUREMENT_APPROVE',
    'USER_VIEW','USER_CREATE','USER_UPDATE',
    'PERMISSION_VIEW','PERMISSION_CREATE','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  VIEWER_PDHS: [
    'INSTITUTE_VIEW','INVENTORY_VIEW','EQUIPMENT_VIEW',
    'REPAIR_REQUEST_VIEW','WORK_ORDER_VIEW','USER_VIEW','PERMISSION_VIEW',
    'AUDIT_VIEW'
  ],
  SUPER_ADMIN_RDHS: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE','INSTITUTE_DELETE',
    'INVENTORY_VIEW',
    'EQUIPMENT_VIEW','EQUIPMENT_ASSIGN',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE','REPAIR_REQUEST_UPDATE',
    'WORK_ORDER_VIEW',
    'PROCUREMENT_VIEW',
    'USER_VIEW',
    'PERMISSION_VIEW','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  ADMIN_RDHS: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE',
    'INVENTORY_VIEW','INVENTORY_UPDATE',
    'EQUIPMENT_VIEW','EQUIPMENT_ASSIGN',
    'REPAIR_REQUEST_VIEW','WORK_ORDER_VIEW',
    'PROCUREMENT_VIEW',
    'PERMISSION_VIEW','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  VIEWER_RDHS: [
    'INSTITUTE_VIEW','INVENTORY_VIEW','EQUIPMENT_VIEW',
    'REPAIR_REQUEST_VIEW','WORK_ORDER_VIEW','USER_VIEW','PERMISSION_VIEW',
    'AUDIT_VIEW'
  ],
  SUPER_ADMIN_INSTITUTE: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE','INSTITUTE_DELETE',
    'INVENTORY_VIEW',
    'EQUIPMENT_VIEW','EQUIPMENT_ASSIGN',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE','REPAIR_REQUEST_UPDATE',
    'WORK_ORDER_VIEW',
    'PROCUREMENT_VIEW',
    'USER_VIEW',
    'PERMISSION_VIEW','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  ADMIN_INSTITUTE: [
    'INSTITUTE_VIEW','INSTITUTE_CREATE','INSTITUTE_UPDATE',
    'INVENTORY_VIEW','INVENTORY_UPDATE',
    'EQUIPMENT_VIEW','EQUIPMENT_ASSIGN',
    'REPAIR_REQUEST_VIEW','WORK_ORDER_VIEW',
    'PROCUREMENT_VIEW',
    'PERMISSION_VIEW','PERMISSION_TEMPORARY_CREATE','PERMISSION_REMOVE',
    'AUDIT_VIEW'
  ],
  VIEWER_INSTITUTE: [
    'INSTITUTE_VIEW','INVENTORY_VIEW','EQUIPMENT_VIEW',
    'REPAIR_REQUEST_VIEW','WORK_ORDER_VIEW','USER_VIEW','PERMISSION_VIEW',
    'AUDIT_VIEW'
  ],

  STORE_KEEPER: [
    'INSTITUTE_VIEW',
    'INVENTORY_VIEW','INVENTORY_CREATE','INVENTORY_UPDATE','INVENTORY_DELETE',
    'EQUIPMENT_VIEW','EQUIPMENT_CREATE','EQUIPMENT_UPDATE','EQUIPMENT_ASSIGN',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE',
    'WORK_ORDER_VIEW',
  ],
  BIOMEDICAL_TECHNICIAN: [
    'INSTITUTE_VIEW',
    'INVENTORY_VIEW',
    'EQUIPMENT_VIEW',
    'WORK_ORDER_VIEW','WORK_ORDER_ASSIGN','WORK_ORDER_COMPLETE',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_UPDATE',
  ],
  PROCUREMENT_OFFICER: [
    'INSTITUTE_VIEW',
    'PROCUREMENT_VIEW','PROCUREMENT_CREATE',
    'INVENTORY_VIEW',
    'EQUIPMENT_VIEW'
  ],
  INSTITUTION_USER: [
    'INSTITUTE_VIEW','INVENTORY_VIEW','EQUIPMENT_VIEW',
    'REPAIR_REQUEST_VIEW','REPAIR_REQUEST_CREATE','REPAIR_REQUEST_UPDATE',
    'WORK_ORDER_VIEW',
  ]
}*/

// Helper: generate UserPermission rows for a user from their role
/*function seedPermissions(userId, role, grantedById) {
  const perms = ROLE_PERMISSIONS[role] || []
  
  return perms.map(permission => ({
    id: `up_${userId}_${permission}`,
    userId,
    permission,
    grantedById: grantedById || null,
    expiresAt: null,
    note: `Granted by ${role}`
  }))
}*/
function seedPermissions(
  userId: string,
  role: RoleType,
  grantedById,
) {
  const perms: Permission[] = ROLE_PERMISSIONS[role] ?? [];

  return perms.map(permission => ({
    id: `up_${userId}_${permission}`,
    userId,
    permission,                           // Permission enum value === DB string
    grantedById: grantedById ?? null,
    expiresAt: null,
    note: `Default grant for role ${role}`,
  }));
}

export const seedData = {

  // ─────────────────────────────────────────────
  // DISTRICTS
  // ─────────────────────────────────────────────
  districts: [
    { id: 'dist_rat', name: 'Rathnapura' },
    { id: 'dist_keg', name: 'Kegalle' }
  ],

  // ─────────────────────────────────────────────
  // INSTITUTIONS
  // ─────────────────────────────────────────────
  institutions: [
    { id: 'inst_pdhs', name: 'Sabaragamuwa PDHS Office', type: 'PDHS Office', active: true },
    { id: 'inst_rdhs_rat', name: 'Rathnapura RDHS Office', type: 'RDHS Office', districtId: 'dist_rat', active: true },
    { id: 'inst_rdhs_keg', name: 'Kegalle RDHS Office', type: 'RDHS Office', districtId: 'dist_keg', active: true },
    { id: 'inst_bh_rat', name: 'Rathnapura Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_keg', name: 'Kegalle Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_dh_bal', name: 'Balangoda Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_dh_kar', name: 'Karawanella Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_pmcu_kal', name: 'Kalawana Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_kahawatta', name: 'Kahawatta Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_eheliyagoda', name: 'Eheliyagoda Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_kolonna', name: 'Kolonna Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_mawanalla', name: 'Mawanalla Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_bh_warakapola', name: 'Warakapola Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_moh_rat', name: 'MOH Office Rathnapura', type: 'MOH Office', districtId: 'dist_rat', active: true },
    { id: 'inst_clinic_std', name: 'STD Clinic Rathnapura', type: 'STD Clinic', districtId: 'dist_rat', active: true },
    { id: 'inst_rmsd_rat', name: 'RMSD Rathnapura', type: 'Regional Medical Supply Division (RMSD)', districtId: 'dist_rat', active: true }
  ],

  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      fullName: 'YML Kumara (super_admin)',
      email: 'admin@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_super_admin',
      username: 'super_admin',
      fullName: 'Super Administrator',
      email: 'superadmin@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_tech1',
      username: 'tech_nuwan',
      fullName: 'Nuwan Perera (Technician)',
      email: 'nuwan.perera@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_proc1',
      username: 'proc_sajith',
      fullName: 'Sajith Bandara (Procurement)',
      email: 'sajith.bandara@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_store1',
      username: 'store_keeper',
      fullName: 'Kamal Rathnayake (Store Keeper)',
      email: 'kamal.r@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_viewer',
      username: 'pdhs_director',
      fullName: 'Dr. K. Pathirana (PDHS Director)',
      email: 'director@pdhs.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_pdhs'
    },
    {
      id: 'usr_rdhs_rat',
      username: 'rdhs_rat',
      fullName: 'Mrs. D. Wickramasinghe (RDHS Rat)',
      email: 'rdhs.rat@health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_rdhs_rat'
    },
    {
      id: 'usr_rdhs_keg',
      username: 'rdhs_keg',
      fullName: 'Mr. S. Jayasena (RDHS Keg)',
      email: 'rdhs.keg@health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_rdhs_keg'
    },
    {
      id: 'usr_bh_rat',
      username: 'bh_rat_user',
      fullName: 'Dr. Saman Silva (Rathnapura BH)',
      email: 'saman.silva@bh-rat.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_bh_rat'
    },
    {
      id: 'usr_dh_bal',
      username: 'dh_bal_user',
      fullName: 'Sister Priyanthi (Balangoda BH)',
      email: 'priyanthi@dh-bal.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
      active: true,
      institutionId: 'inst_dh_bal'
    },

    // ── Base Hospital review accounts (8 BHs × admin + user) ──
    // Demo credentials: username + pdhs@123, no forced password change.
    {
      id: 'usr_bh_balangoda_admin',
      username: 'balangoda_admin',
      fullName: 'Balangoda BH Admin',
      email: 'balangoda.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_dh_bal'
    },
    {
      id: 'usr_bh_balangoda_user',
      username: 'balangoda_user',
      fullName: 'Balangoda BH User',
      email: 'balangoda.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_dh_bal'
    },
    {
      id: 'usr_bh_kahawatta_admin',
      username: 'kahawatta_admin',
      fullName: 'Kahawatta BH Admin',
      email: 'kahawatta.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_kahawatta'
    },
    {
      id: 'usr_bh_kahawatta_user',
      username: 'kahawatta_user',
      fullName: 'Kahawatta BH User',
      email: 'kahawatta.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_kahawatta'
    },
    {
      id: 'usr_bh_kalawana_admin',
      username: 'kalawana_admin',
      fullName: 'Kalawana BH Admin',
      email: 'kalawana.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_pmcu_kal'
    },
    {
      id: 'usr_bh_kalawana_user',
      username: 'kalawana_user',
      fullName: 'Kalawana BH User',
      email: 'kalawana.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_pmcu_kal'
    },
    {
      id: 'usr_bh_eheliyagoda_admin',
      username: 'eheliyagoda_admin',
      fullName: 'Eheliyagoda BH Admin',
      email: 'eheliyagoda.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_eheliyagoda'
    },
    {
      id: 'usr_bh_eheliyagoda_user',
      username: 'eheliyagoda_user',
      fullName: 'Eheliyagoda BH User',
      email: 'eheliyagoda.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_eheliyagoda'
    },
    {
      id: 'usr_bh_kolonna_admin',
      username: 'kolonna_admin',
      fullName: 'Kolonna BH Admin',
      email: 'kolonna.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_kolonna'
    },
    {
      id: 'usr_bh_kolonna_user',
      username: 'kolonna_user',
      fullName: 'Kolonna BH User',
      email: 'kolonna.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_kolonna'
    },
    {
      id: 'usr_bh_mawanalla_admin',
      username: 'mawanalla_admin',
      fullName: 'Mawanalla BH Admin',
      email: 'mawanalla.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_mawanalla'
    },
    {
      id: 'usr_bh_mawanalla_user',
      username: 'mawanalla_user',
      fullName: 'Mawanalla BH User',
      email: 'mawanalla.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_mawanalla'
    },
    {
      id: 'usr_bh_warakapola_admin',
      username: 'warakapola_admin',
      fullName: 'Warakapola BH Admin',
      email: 'warakapola.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_warakapola'
    },
    {
      id: 'usr_bh_warakapola_user',
      username: 'warakapola_user',
      fullName: 'Warakapola BH User',
      email: 'warakapola.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_bh_warakapola'
    },
    {
      id: 'usr_bh_karawanella_admin',
      username: 'karawanella_admin',
      fullName: 'Karawanella BH Admin',
      email: 'karawanella.admin@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_dh_kar'
    },
    {
      id: 'usr_bh_karawanella_user',
      username: 'karawanella_user',
      fullName: 'Karawanella BH User',
      email: 'karawanella.user@bh.health.lk',
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: false,
      active: true,
      institutionId: 'inst_dh_kar'
    }
  ],

  // ─────────────────────────────────────────────
  // USER ROLES
  // scopeType: PDHS | RDHS | INSTITUTE
  // scopeId:
  //   PDHS      → null
  //   RDHS      → districtId
  //   INSTITUTE → institutionId
  // ─────────────────────────────────────────────
  userRoles: [
    // ── PDHS Level ──
    { id: 'ur_001', userId: 'usr_super_admin', role: 'SUPER_ADMIN_PDHS', scopeType: 'PDHS', scopeId: null, assignedById: 'usr_admin' },
    { id: 'ur_002', userId: 'usr_admin', role: 'SUPER_ADMIN_PDHS', scopeType: 'PDHS', scopeId: null, assignedById: null },
    { id: 'ur_003', userId: 'usr_viewer', role: 'VIEWER_PDHS', scopeType: 'PDHS', scopeId: null, assignedById: 'usr_super_admin' },
    { id: 'ur_004', userId: 'usr_tech1', role: 'BIOMEDICAL_TECHNICIAN', scopeType: 'PDHS', scopeId: null, assignedById: 'usr_admin' },
    { id: 'ur_005', userId: 'usr_proc1', role: 'PROCUREMENT_OFFICER', scopeType: 'PDHS', scopeId: null, assignedById: 'usr_admin' },
    { id: 'ur_006', userId: 'usr_store1', role: 'STORE_KEEPER', scopeType: 'PDHS', scopeId: null, assignedById: 'usr_admin' },
    // ── RDHS Level ──
    { id: 'ur_007', userId: 'usr_rdhs_rat', role: 'SUPER_ADMIN_RDHS', scopeType: 'RDHS', scopeId: 'dist_rat', assignedById: 'usr_super_admin' },
    { id: 'ur_008', userId: 'usr_rdhs_keg', role: 'ADMIN_RDHS', scopeType: 'RDHS', scopeId: 'dist_keg', assignedById: 'usr_super_admin' },
    // ── Institute Level ──
    { id: 'ur_009', userId: 'usr_bh_rat', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_rat', assignedById: 'usr_rdhs_rat' },
    { id: 'ur_010', userId: 'usr_dh_bal', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_dh_bal', assignedById: 'usr_rdhs_rat' },
    // ── Base Hospital review accounts (8 BHs × admin + user) ──
    { id: 'ur_bh_balangoda_admin', userId: 'usr_bh_balangoda_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_dh_bal', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_balangoda_user', userId: 'usr_bh_balangoda_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_dh_bal', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kahawatta_admin', userId: 'usr_bh_kahawatta_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_bh_kahawatta', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kahawatta_user', userId: 'usr_bh_kahawatta_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_kahawatta', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kalawana_admin', userId: 'usr_bh_kalawana_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_pmcu_kal', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kalawana_user', userId: 'usr_bh_kalawana_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_pmcu_kal', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_eheliyagoda_admin', userId: 'usr_bh_eheliyagoda_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_bh_eheliyagoda', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_eheliyagoda_user', userId: 'usr_bh_eheliyagoda_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_eheliyagoda', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kolonna_admin', userId: 'usr_bh_kolonna_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_bh_kolonna', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_kolonna_user', userId: 'usr_bh_kolonna_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_kolonna', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_mawanalla_admin', userId: 'usr_bh_mawanalla_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_bh_mawanalla', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_mawanalla_user', userId: 'usr_bh_mawanalla_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_mawanalla', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_warakapola_admin', userId: 'usr_bh_warakapola_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_bh_warakapola', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_warakapola_user', userId: 'usr_bh_warakapola_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_bh_warakapola', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_karawanella_admin', userId: 'usr_bh_karawanella_admin', role: 'ADMIN_INSTITUTE', scopeType: 'INSTITUTE', scopeId: 'inst_dh_kar', assignedById: 'usr_super_admin' },
    { id: 'ur_bh_karawanella_user', userId: 'usr_bh_karawanella_user', role: 'INSTITUTION_USER', scopeType: 'INSTITUTE', scopeId: 'inst_dh_kar', assignedById: 'usr_super_admin' }
  ],

  // ─────────────────────────────────────────────
  // USER PERMISSIONS
  // Seeded from each user's assigned role via ROLE_PERMISSIONS.
  // After seeding, admins can add/remove individual permissions
  // via the User Management UI. Temporary grants use expiresAt.
  // ─────────────────────────────────────────────

  userPermissions: [
    // usr_super_admin → SUPER_ADMIN_PDHS (all permissions, no granter)
    ...seedPermissions('usr_super_admin', RoleType.SUPER_ADMIN_PDHS, null),

    // usr_admin → ADMIN_PDHS
    ...seedPermissions('usr_admin', RoleType.ADMIN_PDHS, 'usr_super_admin'),

    // usr_viewer → VIEWER_PDHS
    ...seedPermissions('usr_viewer', RoleType.VIEWER_PDHS, 'usr_super_admin'),

    // usr_tech1 → BIOMEDICAL_TECHNICIAN
    ...seedPermissions('usr_tech1', RoleType.BIOMEDICAL_TECHNICIAN, 'usr_super_admin'),

    // usr_proc1 → PROCUREMENT_OFFICER
    ...seedPermissions('usr_proc1', RoleType.PROCUREMENT_OFFICER, 'usr_super_admin'),

    // usr_store1 → STORE_KEEPER
    ...seedPermissions('usr_store1', RoleType.STORE_KEEPER, 'usr_super_admin'),

    // usr_rdhs_rat → SUPER_ADMIN_RDHS
    ...seedPermissions('usr_rdhs_rat', RoleType.SUPER_ADMIN_RDHS, 'usr_super_admin'),

    // usr_rdhs_keg → ADMIN_RDHS
    ...seedPermissions('usr_rdhs_keg', RoleType.ADMIN_RDHS, 'usr_super_admin'),

    // usr_bh_rat → INSTITUTION_USER
    ...seedPermissions('usr_bh_rat', RoleType.INSTITUTION_USER, 'usr_super_admin'),

    // usr_dh_bal → INSTITUTION_USER
    ...seedPermissions('usr_dh_bal', RoleType.INSTITUTION_USER, 'usr_super_admin'),

    // ── Base Hospital review accounts → role defaults ──
    ...seedPermissions('usr_bh_balangoda_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_balangoda_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kahawatta_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kahawatta_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kalawana_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kalawana_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_eheliyagoda_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_eheliyagoda_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kolonna_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_kolonna_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_mawanalla_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_mawanalla_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_warakapola_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_warakapola_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),
    ...seedPermissions('usr_bh_karawanella_admin', RoleType.ADMIN_INSTITUTE, 'usr_super_admin'),
    ...seedPermissions('usr_bh_karawanella_user', RoleType.INSTITUTION_USER, 'usr_super_admin'),

    // ── Temporary / extra grants (hand-written, not role-derived) ────
    // These stay here explicitly because they're exceptions beyond the
    // role default — exactly the kind of thing that should be visible
    // and intentional in the seed, not hidden in a helper.
    {
      id: 'up_usr_dh_bal_INVENTORY_CREATE_temp',
      userId: 'usr_dh_bal',
      permission: Permission.INVENTORY_CREATE,
      grantedById: 'usr_rdhs_rat',
      expiresAt: new Date('2026-07-01T23:59:59Z'),
      note: 'Temporary access for Q2 inventory data entry batch',
    },
  ],

  // ─────────────────────────────────────────────
  // SUPPLIERS
  // ─────────────────────────────────────────────
  suppliers: [
    { id: 'sup_prime', name: 'Prime Diagnostics Ltd', contactPerson: 'M. Fernando', phone: '+94 11 2345678', email: 'sales@primediag.lk', performanceNotes: 'Excellent support on MRI/CT calibrations.', rating: 5 },
    { id: 'sup_medi', name: 'MediEquipment Pvt Ltd', contactPerson: 'K. Ratnayake', phone: '+94 11 7654321', email: 'service@mediequip.lk', performanceNotes: 'Prompt delivery of parts, pricing moderate.', rating: 4 },
    { id: 'sup_supplies', name: 'Sabaragamuwa Medical Supplies', contactPerson: 'R. Perera', phone: '+94 45 2234123', email: 'sabsupplies@gmail.com', performanceNotes: 'Good local supplier for consumables.', rating: 3 }
  ],

  // ─────────────────────────────────────────────
  // INVENTORY ITEMS
  // ─────────────────────────────────────────────
  inventoryItems: [
    { id: 'inv_bat_philips', name: 'Philips Defibrillator Battery M5070A', category: 'spare part', currentStock: 2, minStockThreshold: 3, unitOfMeasure: 'Pcs', costPerUnit: 25000 },
    { id: 'inv_spo2_goldway', name: 'Goldway SpO2 Sensor (Reusable)', category: 'spare part', currentStock: 8, minStockThreshold: 5, unitOfMeasure: 'Pcs', costPerUnit: 12000 },
    { id: 'inv_ecg_leads', name: '3-Lead ECG Patient Cable', category: 'spare part', currentStock: 15, minStockThreshold: 10, unitOfMeasure: 'Pcs', costPerUnit: 6000 },
    { id: 'inv_helium', name: 'Helium Refill Cylinder 50L', category: 'consumable', currentStock: 1, minStockThreshold: 2, unitOfMeasure: 'Cylinder', costPerUnit: 150000 },
    { id: 'inv_nibp_cuff', name: 'Adult NIBP Cuff (Double Tube)', category: 'consumable', currentStock: 10, minStockThreshold: 8, unitOfMeasure: 'Pcs', costPerUnit: 4500 }
  ],

  // ─────────────────────────────────────────────
  // EQUIPMENT
  // ─────────────────────────────────────────────
  equipment: [
    {
      id: 'eq_mri_01',
      name: 'Siemens Magnetom Altea 1.5T MRI',
      description: 'High-end diagnostic magnetic resonance imaging scanner.',
      category: 'Radiology',
      manufacturer: 'Siemens Healthineers',
      countryOfOrigin: 'Germany',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      tenderNumber: 'TND/2024/MED/089',
      purchaseOrderNumber: 'PO-2024-88392',
      modelNumber: 'Magnetom Altea 1.5T',
      serialNumber: 'SN-MRI-88329-SIE',
      batchNumber: 'BATCH-2024-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-02-15'),
      dateOfReceipt: new Date('2024-06-20'),
      warrantyPeriodMonths: 60,
      status: 'PDHS Store',
      servicePlan: {
        id: 'sp_mri_01',
        agreementReference: 'SVC-SIE-9902',
        expiryDate: new Date('2029-06-20'),
        noOfFreeService: 2,
        servicePerAnnum: 2,
        serviceCosts: { year1: 250000, year2: 260000, year3: 270000, year4: 280000, year5: 290000 },
        labourCosts: { year1: 80000, year2: 85000, year3: 90000, year4: 95000, year5: 100000 },
        transportCosts: { year1: 20000, year2: 20000, year3: 22000, year4: 22000, year5: 25000 },
        otherCosts: { year1: 10000, year2: 10000, year3: 12000, year4: 12000, year5: 15000 },
        totalCosts: { year1: 360000, year2: 375000, year3: 394000, year4: 409000, year5: 430000 },
        sparePartsCosts: [
          { name: 'Helium Refill 50L', year1: 150000, year2: 150000, year3: 155000, year4: 155000, year5: 160000 },
          { name: 'RF Body Coil Replacement', year1: 0, year2: 0, year3: 200000, year4: 0, year5: 200000 }
        ]
      },
      spareParts: [
        { id: 'eqc_mri_01_1', name: 'RF Body Coil', partNumber: 'RF-B-101', serialNumber: 'COIL-7762', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2029-06-20') },
        { id: 'eqc_mri_01_2', name: 'Helium Compressor Unit', partNumber: 'HC-COMP-99', serialNumber: 'COMP-11029', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2029-06-20') },
        { id: 'eqc_mri_01_3', name: 'Console PC Workstation', partNumber: 'WS-SIE-X8', serialNumber: 'PC-998827', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2027-06-20') },
        { id: 'eqc_mri_01_4', name: 'MRI Patient Table', partNumber: 'TBL-ALTEA', quantity: 1, sparePartType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_defib_01',
      name: 'Philips HeartStart XL+ Defibrillator',
      description: 'Biphasic defibrillator/monitor with pacing and ECG recording.',
      category: 'Life Support',
      manufacturer: 'Philips Healthcare',
      countryOfOrigin: 'USA',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      tenderNumber: 'TND/2023/MED/102',
      purchaseOrderNumber: 'PO-2023-77402',
      modelNumber: 'HeartStart XL+',
      serialNumber: 'SN-DF-77632-PHI',
      batchNumber: 'B-PHI-2023',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-01-10'),
      dateOfReceipt: new Date('2023-04-15'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_rat',
      spareParts: [
        { id: 'eqc_defib_1_1', name: 'Rechargeable Li-Ion Battery', partNumber: 'M5070A', serialNumber: 'BATT-99281', quantity: 1, sparePartType: 'Consumable', expiryOrWarrantyDate: new Date('2025-04-15') },
        { id: 'eqc_defib_1_2', name: 'External Defibrillating Paddles', partNumber: 'PADDLE-XL', serialNumber: 'PAD-66271', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2025-04-15') },
        { id: 'eqc_defib_1_3', name: '3-Lead ECG Patient Cable', partNumber: 'ECG-3L', quantity: 1, sparePartType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_monitor_01',
      name: 'Goldway G30E Patient Monitor',
      description: 'Multi-parameter bedside monitor tracking SpO2, NIBP, Pulse, and Temp.',
      category: 'Diagnostic',
      manufacturer: 'Goldway (Philips)',
      countryOfOrigin: 'China',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      tenderNumber: 'TND/2024/MED/012',
      purchaseOrderNumber: 'PO-2024-11029',
      modelNumber: 'G30E',
      serialNumber: 'SN-PM-55419-GW',
      batchNumber: 'B-GW-2024',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-01-05'),
      dateOfReceipt: new Date('2024-03-10'),
      warrantyPeriodMonths: 12,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_bal',
      spareParts: [
        { id: 'eqc_mon_1_1', name: 'SpO2 Finger Sensor', partNumber: 'SPO2-GW-01', serialNumber: 'SPO2-8819', quantity: 1, sparePartType: 'Consumable', expiryOrWarrantyDate: new Date('2025-03-10') },
        { id: 'eqc_mon_1_2', name: 'NIBP Cuff Adult', partNumber: 'NIBP-GW-A', quantity: 1, sparePartType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_xray_01',
      name: 'Shimadzu RADspeed Fit Digital X-Ray',
      description: 'Ceiling suspension digital radiography system.',
      category: 'Radiology',
      manufacturer: 'Shimadzu Corp',
      countryOfOrigin: 'Japan',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      tenderNumber: 'TND/2022/MED/115',
      purchaseOrderNumber: 'PO-2022-44102',
      modelNumber: 'RADspeed Fit',
      serialNumber: 'SN-XR-11928-SHI',
      batchNumber: 'B-SHI-2022',
      quantityReceived: 1,
      dateOfManufacture: new Date('2022-05-18'),
      dateOfReceipt: new Date('2022-09-05'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_keg',
      spareParts: [
        { id: 'eqc_xr_1_1', name: 'X-Ray Tube Assembly', partNumber: 'TUBE-SHI-150', serialNumber: 'TUBE-2291', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2025-09-05') },
        { id: 'eqc_xr_1_2', name: 'Digital Flat Panel Detector', partNumber: 'FPD-SHI-CX', serialNumber: 'FPD-00392', quantity: 1, sparePartType: 'Serialized', expiryOrWarrantyDate: new Date('2025-09-05') }
      ]
    },

    // ─────────────────────────────────────────────
    // BASE HOSPITAL DEMO EQUIPMENT (2 per BH, assigned → scoped to that BH)
    // ─────────────────────────────────────────────
    {
      id: 'eq_bh_balangoda_01',
      name: 'Mindray uMEC12 Patient Monitor',
      description: 'Bedside multi-parameter monitor: ECG, SpO2, NIBP, pulse, temperature.',
      category: 'Diagnostic',
      manufacturer: 'Mindray',
      countryOfOrigin: 'China',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'uMEC12',
      serialNumber: 'SN-BAL-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-08-12'),
      dateOfReceipt: new Date('2025-01-20'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_bal'
    },
    {
      id: 'eq_bh_balangoda_02',
      name: 'Bionote CardioLab ECG Machine',
      description: '12-lead resting ECG system with thermal printer and interpretation software.',
      category: 'Diagnostic',
      manufacturer: 'Bionote',
      countryOfOrigin: 'South Korea',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      modelNumber: 'CardioLab 300',
      serialNumber: 'SN-BAL-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-11-02'),
      dateOfReceipt: new Date('2024-02-14'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_bal'
    },
    {
      id: 'eq_bh_kahawatta_01',
      name: 'Philips EverFlo Q Oxygen Concentrator',
      description: 'Stationary 5 LPM oxygen concentrator for ward oxygen supply.',
      category: 'Life Support',
      manufacturer: 'Philips Healthcare',
      countryOfOrigin: 'USA',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'EverFlo Q',
      serialNumber: 'SN-KAH-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-04-18'),
      dateOfReceipt: new Date('2025-06-05'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_kahawatta'
    },
    {
      id: 'eq_bh_kahawatta_02',
      name: 'GE CARESCAPE B550 Patient Monitor',
      description: 'Ward patient monitor with alarm management and central station connectivity.',
      category: 'Diagnostic',
      manufacturer: 'GE HealthCare',
      countryOfOrigin: 'USA',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      modelNumber: 'CARESCAPE B550',
      serialNumber: 'SN-KAH-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-02-27'),
      dateOfReceipt: new Date('2025-03-11'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_kahawatta'
    },
    {
      id: 'eq_bh_kalawana_01',
      name: 'Schiller AT-12 Plus ECG Machine',
      description: 'Compact 12-lead ECG with automatic report printing.',
      category: 'Diagnostic',
      manufacturer: 'Schiller',
      countryOfOrigin: 'Switzerland',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'AT-12 Plus',
      serialNumber: 'SN-KAL-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-09-09'),
      dateOfReceipt: new Date('2024-05-22'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_pmcu_kal'
    },
    {
      id: 'eq_bh_kalawana_02',
      name: 'B. Braun Infusomat Space Infusion Pump',
      description: 'Volumetric infusion pump with drug library and dose error reduction.',
      category: 'Therapeutic',
      manufacturer: 'B. Braun',
      countryOfOrigin: 'Germany',
      supplierId: 'sup_supplies',
      supplierName: 'Sabaragamuwa Medical Supplies',
      modelNumber: 'Infusomat Space',
      serialNumber: 'SN-KAL-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-06-30'),
      dateOfReceipt: new Date('2025-08-19'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_pmcu_kal'
    },
    {
      id: 'eq_bh_eheliyagoda_01',
      name: 'Getinge HS6617 Steam Sterilizer',
      description: 'Benchtop autoclave for CSSD instrument sterilization, 170 L chamber.',
      category: 'Sterilization',
      manufacturer: 'Getinge',
      countryOfOrigin: 'Sweden',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      modelNumber: 'HS6617',
      serialNumber: 'SN-EHE-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-12-05'),
      dateOfReceipt: new Date('2024-07-30'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_eheliyagoda'
    },
    {
      id: 'eq_bh_eheliyagoda_02',
      name: 'Datex-Ohmeda Capnomac Ultima Patient Monitor',
      description: 'Multiparameter monitor with capnography for operation theatre use.',
      category: 'Diagnostic',
      manufacturer: 'Datex-Ohmeda (GE)',
      countryOfOrigin: 'Finland',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'Capnomac Ultima',
      serialNumber: 'SN-EHE-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2022-10-14'),
      dateOfReceipt: new Date('2023-03-08'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_eheliyagoda'
    },
    {
      id: 'eq_bh_kolonna_01',
      name: 'Laerdal LSU 7 Suction Unit',
      description: 'Portable emergency suction unit with battery backup.',
      category: 'Life Support',
      manufacturer: 'Laerdal',
      countryOfOrigin: 'Norway',
      supplierId: 'sup_supplies',
      supplierName: 'Sabaragamuwa Medical Supplies',
      modelNumber: 'LSU 7',
      serialNumber: 'SN-KOL-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-01-23'),
      dateOfReceipt: new Date('2025-04-16'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_kolonna'
    },
    {
      id: 'eq_bh_kolonna_02',
      name: 'Nihon Kohden Cardiofax G ECG Machine',
      description: '12-lead ECG with paperless review and USB report export.',
      category: 'Diagnostic',
      manufacturer: 'Nihon Kohden',
      countryOfOrigin: 'Japan',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      modelNumber: 'Cardiofax G',
      serialNumber: 'SN-KOL-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-05-07'),
      dateOfReceipt: new Date('2025-09-02'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_kolonna'
    },
    {
      id: 'eq_bh_mawanalla_01',
      name: 'Philips IntelliVue MP40 Patient Monitor',
      description: 'ICU-grade multiparameter monitor with ECG, SpO2, NIBP and EtCO2 module.',
      category: 'Diagnostic',
      manufacturer: 'Philips Healthcare',
      countryOfOrigin: 'Netherlands',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'IntelliVue MP40',
      serialNumber: 'SN-MAW-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-03-19'),
      dateOfReceipt: new Date('2025-05-27'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_mawanalla'
    },
    {
      id: 'eq_bh_mawanalla_02',
      name: 'Airsep VisionAire 5 Oxygen Concentrator',
      description: '5 LPM stationary oxygen concentrator for casualty ward.',
      category: 'Life Support',
      manufacturer: 'Airsep (CAIRE)',
      countryOfOrigin: 'USA',
      supplierId: 'sup_supplies',
      supplierName: 'Sabaragamuwa Medical Supplies',
      modelNumber: 'VisionAire 5',
      serialNumber: 'SN-MAW-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-08-11'),
      dateOfReceipt: new Date('2024-11-04'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_mawanalla'
    },
    {
      id: 'eq_bh_warakapola_01',
      name: 'B. Braun Perfusor Space Syringe Pump',
      description: 'Syringe infusion pump for controlled drug delivery in wards.',
      category: 'Therapeutic',
      manufacturer: 'B. Braun',
      countryOfOrigin: 'Germany',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'Perfusor Space',
      serialNumber: 'SN-WAR-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-07-25'),
      dateOfReceipt: new Date('2025-10-13'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_warakapola'
    },
    {
      id: 'eq_bh_warakapola_02',
      name: 'Priorclave Q 130 Autoclave',
      description: '130 L front-loading steam sterilizer for theater instrument sets.',
      category: 'Sterilization',
      manufacturer: 'Priorclave',
      countryOfOrigin: 'United Kingdom',
      supplierId: 'sup_prime',
      supplierName: 'Prime Diagnostics Ltd',
      modelNumber: 'Q 130',
      serialNumber: 'SN-WAR-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-05-30'),
      dateOfReceipt: new Date('2024-09-25'),
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_warakapola'
    },
    {
      id: 'eq_bh_karawanella_01',
      name: 'Fukuda FX-7102 ECG Machine',
      description: '12-lead ECG with auto-interpretation, used in outpatient clinic.',
      category: 'Diagnostic',
      manufacturer: 'Fukuda Denshi',
      countryOfOrigin: 'Japan',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      modelNumber: 'FX-7102',
      serialNumber: 'SN-KAR-01',
      quantityReceived: 1,
      dateOfManufacture: new Date('2024-02-01'),
      dateOfReceipt: new Date('2025-02-18'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_kar'
    },
    {
      id: 'eq_bh_karawanella_02',
      name: 'Ohio 776 Suction Machine',
      description: 'Electric surgical suction unit with dual jar configuration.',
      category: 'Life Support',
      manufacturer: 'Ohio Medical',
      countryOfOrigin: 'USA',
      supplierId: 'sup_supplies',
      supplierName: 'Sabaragamuwa Medical Supplies',
      modelNumber: '776',
      serialNumber: 'SN-KAR-02',
      quantityReceived: 1,
      dateOfManufacture: new Date('2023-06-16'),
      dateOfReceipt: new Date('2024-10-09'),
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_kar'
    }
  ],

  // ─────────────────────────────────────────────
  // ASSIGNMENTS
  // ─────────────────────────────────────────────
  assignments: [
    { id: 'asg_01', equipmentId: 'eq_defib_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: new Date('2023-04-16'), status: 'Delivered' },
    { id: 'asg_02', equipmentId: 'eq_defib_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_rat', quantity: 1, assignmentDate: new Date('2023-04-18'), status: 'Acknowledged' },
    { id: 'asg_03', equipmentId: 'eq_monitor_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: new Date('2024-03-12'), status: 'Delivered' },
    { id: 'asg_04', equipmentId: 'eq_monitor_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_bal', quantity: 1, assignmentDate: new Date('2024-03-15'), status: 'Acknowledged' },
    { id: 'asg_05', equipmentId: 'eq_xray_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_keg', quantity: 1, assignmentDate: new Date('2022-09-08'), status: 'Delivered' },
    { id: 'asg_06', equipmentId: 'eq_xray_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_keg', quantity: 1, assignmentDate: new Date('2022-09-10'), status: 'Acknowledged' },
    // ── Base Hospital demo equipment deliveries ──
    { id: 'asg_bh_balangoda_01', equipmentId: 'eq_bh_balangoda_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_bal', quantity: 1, assignmentDate: new Date('2025-01-24'), status: 'Acknowledged' },
    { id: 'asg_bh_balangoda_02', equipmentId: 'eq_bh_balangoda_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_bal', quantity: 1, assignmentDate: new Date('2024-02-19'), status: 'Acknowledged' },
    { id: 'asg_bh_kahawatta_01', equipmentId: 'eq_bh_kahawatta_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_kahawatta', quantity: 1, assignmentDate: new Date('2025-06-10'), status: 'Acknowledged' },
    { id: 'asg_bh_kahawatta_02', equipmentId: 'eq_bh_kahawatta_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_kahawatta', quantity: 1, assignmentDate: new Date('2025-03-17'), status: 'Acknowledged' },
    { id: 'asg_bh_kalawana_01', equipmentId: 'eq_bh_kalawana_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_pmcu_kal', quantity: 1, assignmentDate: new Date('2024-05-28'), status: 'Acknowledged' },
    { id: 'asg_bh_kalawana_02', equipmentId: 'eq_bh_kalawana_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_pmcu_kal', quantity: 1, assignmentDate: new Date('2025-08-25'), status: 'Acknowledged' },
    { id: 'asg_bh_eheliyagoda_01', equipmentId: 'eq_bh_eheliyagoda_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_eheliyagoda', quantity: 1, assignmentDate: new Date('2024-08-05'), status: 'Acknowledged' },
    { id: 'asg_bh_eheliyagoda_02', equipmentId: 'eq_bh_eheliyagoda_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_eheliyagoda', quantity: 1, assignmentDate: new Date('2023-03-14'), status: 'Acknowledged' },
    { id: 'asg_bh_kolonna_01', equipmentId: 'eq_bh_kolonna_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_kolonna', quantity: 1, assignmentDate: new Date('2025-04-22'), status: 'Acknowledged' },
    { id: 'asg_bh_kolonna_02', equipmentId: 'eq_bh_kolonna_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_kolonna', quantity: 1, assignmentDate: new Date('2025-09-08'), status: 'Acknowledged' },
    { id: 'asg_bh_mawanalla_01', equipmentId: 'eq_bh_mawanalla_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_mawanalla', quantity: 1, assignmentDate: new Date('2025-06-02'), status: 'Acknowledged' },
    { id: 'asg_bh_mawanalla_02', equipmentId: 'eq_bh_mawanalla_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_mawanalla', quantity: 1, assignmentDate: new Date('2024-11-11'), status: 'Acknowledged' },
    { id: 'asg_bh_warakapola_01', equipmentId: 'eq_bh_warakapola_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_warakapola', quantity: 1, assignmentDate: new Date('2025-10-20'), status: 'Acknowledged' },
    { id: 'asg_bh_warakapola_02', equipmentId: 'eq_bh_warakapola_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_warakapola', quantity: 1, assignmentDate: new Date('2024-10-01'), status: 'Acknowledged' },
    { id: 'asg_bh_karawanella_01', equipmentId: 'eq_bh_karawanella_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_kar', quantity: 1, assignmentDate: new Date('2025-02-24'), status: 'Acknowledged' },
    { id: 'asg_bh_karawanella_02', equipmentId: 'eq_bh_karawanella_02', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_kar', quantity: 1, assignmentDate: new Date('2024-10-15'), status: 'Acknowledged' }
  ],

  // ─────────────────────────────────────────────
  // REPAIR REQUESTS
  // ─────────────────────────────────────────────
  repairRequests: [
    {
      id: 'REQ-2026-001',
      equipmentId: 'eq_defib_01',
      sparePartId: 'eqc_defib_1_2',
      faultDescription: 'Defibrillator fails to discharge shock. Warning alert on screen points to paddle calibration/connection issue.',
      priority: 'Emergency',
      submittedByUserId: 'usr_bh_rat',
      submissionDate: new Date('2026-05-24T10:30:00Z'),
      institutionId: 'inst_bh_rat'
    },
    {
      id: 'REQ-2026-002',
      equipmentId: 'eq_monitor_01',
      sparePartId: 'eqc_mon_1_1',
      faultDescription: 'SpO2 sensor cord is frayed. Monitor reads "Sensor Disconnected" constantly.',
      priority: 'Routine',
      submittedByUserId: 'usr_dh_bal',
      submissionDate: new Date('2026-05-25T14:15:00Z'),
      institutionId: 'inst_dh_bal'
    },
    // ── Base Hospital demo requests (1 per BH, raised by the BH _user account) ──
    {
      id: 'REQ-2026-101',
      equipmentId: 'eq_bh_balangoda_01',
      faultDescription: 'Patient monitor freezes on the SpO2 waveform every few minutes; power cycling clears it temporarily.',
      priority: 'Urgent',
      submittedByUserId: 'usr_bh_balangoda_user',
      submissionDate: new Date('2026-11-09T08:40:00Z'),
      institutionId: 'inst_dh_bal'
    },
    {
      id: 'REQ-2026-102',
      equipmentId: 'eq_bh_kahawatta_01',
      faultDescription: 'Oxygen concentrator delivers low flow (approx. 2 LPM instead of 5) and the purity alarm sounds after 10 minutes.',
      priority: 'Emergency',
      submittedByUserId: 'usr_bh_kahawatta_user',
      submissionDate: new Date('2026-11-09T11:15:00Z'),
      institutionId: 'inst_bh_kahawatta'
    },
    {
      id: 'REQ-2026-103',
      equipmentId: 'eq_bh_kalawana_01',
      faultDescription: 'ECG prints continuous baseline wander on lead II; calibration done but artifact persists.',
      priority: 'Routine',
      submittedByUserId: 'usr_bh_kalawana_user',
      submissionDate: new Date('2026-11-10T09:05:00Z'),
      institutionId: 'inst_pmcu_kal'
    },
    {
      id: 'REQ-2026-104',
      equipmentId: 'eq_bh_eheliyagoda_01',
      faultDescription: 'Autoclave cycle aborts at 134°C with E14 error; door seal looks worn and steam leaks from the left hinge.',
      priority: 'Urgent',
      submittedByUserId: 'usr_bh_eheliyagoda_user',
      submissionDate: new Date('2026-11-11T07:50:00Z'),
      institutionId: 'inst_bh_eheliyagoda'
    },
    {
      id: 'REQ-2026-105',
      equipmentId: 'eq_bh_kolonna_01',
      faultDescription: 'Suction unit does not hold vacuum; jar gasket damaged and pump runs louder than usual.',
      priority: 'Routine',
      submittedByUserId: 'usr_bh_kolonna_user',
      submissionDate: new Date('2026-11-11T13:30:00Z'),
      institutionId: 'inst_bh_kolonna'
    },
    {
      id: 'REQ-2026-106',
      equipmentId: 'eq_bh_mawanalla_01',
      faultDescription: 'Monitor NIBP readings fail intermittently on adult cuff; inflation stops halfway through the cycle.',
      priority: 'Emergency',
      submittedByUserId: 'usr_bh_mawanalla_user',
      submissionDate: new Date('2026-11-12T10:20:00Z'),
      institutionId: 'inst_bh_mawanalla'
    },
    {
      id: 'REQ-2026-107',
      equipmentId: 'eq_bh_warakapola_01',
      faultDescription: 'Syringe pump throws occlusion alarm with a free-flowing line; plunger drive seems to slip.',
      priority: 'Urgent',
      submittedByUserId: 'usr_bh_warakapola_user',
      submissionDate: new Date('2026-11-13T08:10:00Z'),
      institutionId: 'inst_bh_warakapola'
    },
    {
      id: 'REQ-2026-108',
      equipmentId: 'eq_bh_karawanella_01',
      faultDescription: 'ECG thermal printer feeds blank paper; print head likely needs replacement.',
      priority: 'Routine',
      submittedByUserId: 'usr_bh_karawanella_user',
      submissionDate: new Date('2026-11-14T09:45:00Z'),
      institutionId: 'inst_dh_kar'
    }
  ],

  // ─────────────────────────────────────────────
  // WORK ORDERS
  // ─────────────────────────────────────────────
  workOrders: [
    {
      id: 'WO-2026-001',
      repairRequestId: 'REQ-2026-001',
      assignedTechnicianId: 'usr_tech1',
      assignedTechnicianName: 'Nuwan Perera (Technician)',
      diagnosisNotes: 'Diagnostic check indicates internal paddle contacts are worn. The cables have continuity but discharge resistance is too high. Replaced standard wiring assembly.',
      status: 'IN_REPAIR',
      statusDate: new Date('2026-05-25T08:00:00Z'),
      institutionId: 'inst_bh_rat',
      inspectedspareParts: [
        { id: 'ic_wo001_1', sparePartId: 'eqc_defib_1_1', sparePartName: 'Rechargeable Li-Ion Battery', inspected: true, conditionNotes: 'Healthy, capacity at 92%' },
        { id: 'ic_wo001_2', sparePartId: 'eqc_defib_1_2', sparePartName: 'External Defibrillating Paddles', inspected: true, conditionNotes: 'Damaged contacts, high resistance' },
        { id: 'ic_wo001_3', sparePartId: 'eqc_defib_1_3', sparePartName: '3-Lead ECG Patient Cable', inspected: true, conditionNotes: 'Good condition' }
      ],
      partsUsed: []
    },
    {
      id: 'WO-2026-002',
      repairRequestId: 'REQ-2026-002',
      assignedTechnicianId: 'usr_tech1',
      assignedTechnicianName: 'Nuwan Perera (Technician)',
      status: 'SUBMITTED',
      statusDate: new Date('2026-05-25T14:15:00Z'),
      institutionId: 'inst_dh_bal',
      inspectedspareParts: [],
      partsUsed: []
    }
  ],

  // ─────────────────────────────────────────────
  // PROCUREMENT PLANS
  // ─────────────────────────────────────────────
  procurementPlans: [
    { id: 'plan_01', itemDescription: 'Procurement of Life Support Spare Batteries (M5070A)', estimatedQuantity: 5, estimatedCost: 125000, procurementMethod: 'Quotation' },
    { id: 'plan_02', itemDescription: 'Annual Calibration Consumables sab-province', estimatedQuantity: 100, estimatedCost: 350000, procurementMethod: 'Limited Tender' }
  ],

  // ─────────────────────────────────────────────
  // PURCHASE ORDERS
  // ─────────────────────────────────────────────
  purchaseOrders: [
    {
      id: 'po_01',
      planId: 'plan_01',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      poNumber: 'PO-2026-00049',
      orderDate: new Date('2026-05-10'),
      approvalStatus: 'Approved',
      totalCost: 125000,
      items: [
        { id: 'poi_po01_1', description: 'Philips Defibrillator Battery M5070A', quantity: 5, unitCost: 25000, category: 'spare part' }
      ]
    }
  ],

  // ─────────────────────────────────────────────
  // GRNS
  // ─────────────────────────────────────────────
  grns: [],

  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────
  auditLogs: [
    {
      id: 'aud_01',
      timestamp: new Date('2026-05-24T10:30:00Z'),
      userId: 'usr_bh_rat',
      userName: 'Dr. Saman Silva',
      userRole: 'INSTITUTION_USER',
      action: 'CREATE',
      entityName: 'RepairRequest',
      recordId: 'REQ-2026-001',
      description: 'Created repair request REQ-2026-001 for Philips Defibrillator.',
      institutionId: 'inst_bh_rat'
    },
    {
      id: 'aud_02',
      timestamp: new Date('2026-05-25T08:00:00Z'),
      userId: 'usr_tech1',
      userName: 'Nuwan Perera',
      userRole: 'BIOMEDICAL_TECHNICIAN',
      action: 'UPDATE',
      entityName: 'WorkOrder',
      recordId: 'WO-2026-001',
      description: 'Acknowledged work order WO-2026-001 and assigned to self.',
      institutionId: 'inst_bh_rat'
    }
  ]
}
