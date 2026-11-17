import { PERMISSIONS } from '../src/auth/constants/permission.registry';
import {
  ROLE_META,
  ROLE_PERMISSIONS,
  SCOPE_META,
  SCOPE_ROLES,
} from '../src/auth/constants/role-permissions';
import * as fs from 'fs';
import * as path from 'path';

const frontendDir = path.resolve(__dirname, '../../pdhs/src/app/core');
const frontendPermsFile = path.join(frontendDir, 'constants/permissions.ts');
const frontendTypesFile = path.join(frontendDir, 'models/permission.types.ts');

// ── 1. Permission enum (keys of the registry) ─────────────────────────
const permsContent = `// AUTO-GENERATED from pdhs-api/src/auth/constants/permission.registry.ts
// DO NOT EDIT - run npm run gen:perms in pdhs-api

export enum Permission {
${Object.keys(PERMISSIONS).map((k) => ` ${k} = '${k}',`).join('\n')}
}

export type PermissionKey = keyof typeof Permission;
`;

// ── 2. Role/scope types + policy (from role-permissions.ts) ───────────
// ROLE_PERMISSIONS is Record<RoleType, ...> and SCOPE_ROLES is
// Record<ScopeType, RoleType[]> — both exhaustive, so their keys ARE the
// complete role/scope universes (Prisma schema changes force compile
// errors here first).
const roleValues = Object.keys(ROLE_PERMISSIONS);
const scopeValues = Object.keys(SCOPE_ROLES);

const enumLines = (values: string[]) =>
  values.map((v) => `  ${v} = '${v}',`).join('\n');

const scopeRolesLines = scopeValues.map((scope) => {
  const roles = (SCOPE_ROLES as Record<string, string[]>)[scope] ?? [];
  const refs = roles.map((r) => `    RoleType.${r},`).join('\n');
  return `  [ScopeType.${scope}]: [\n${refs}\n  ],`;
});

const roleMetaEntries = Object.entries(ROLE_META as Record<string, { label: string; color: string }>)
  .map(
    ([role, meta]) =>
      `  [RoleType.${role}]: { label: ${JSON.stringify(meta.label)}, color: ${JSON.stringify(meta.color)} },`,
  )
  .join('\n');

const scopeMetaEntries = Object.entries(SCOPE_META as Record<string, { label: string }>)
  .map(
    ([scope, meta]) =>
      `  [ScopeType.${scope}]: { label: ${JSON.stringify(meta.label)} },`,
  )
  .join('\n');

const typesContent = `// AUTO-GENERATED from pdhs-api/src/auth/role-permissions.ts
// DO NOT EDIT - run npm run gen:perms in pdhs-api (also runs on npm run build)
//
// Single source of truth lives in the backend:
//   RoleType / ScopeType  → prisma/schema.prisma enums
//   SCOPE_ROLES           → src/auth/role-permissions.ts
//   ROLE_META / SCOPE_META → src/auth/role-permissions.ts

export enum ScopeType {
${enumLines(scopeValues)}
}

export enum RoleType {
${enumLines(roleValues)}
}

// Roles allowed to be assigned at each scope level
export const SCOPE_ROLES: Record<ScopeType, RoleType[]> = {
${scopeRolesLines.join('\n')}
};

// Display metadata for role badges / selects (UI only — not auth logic)
export const ROLE_META: Record<RoleType, { label: string; color: string }> = {
${roleMetaEntries}
};

// Display metadata for scope level selects
export const SCOPE_META: Record<ScopeType, { label: string }> = {
${scopeMetaEntries}
};
`;

fs.mkdirSync(path.dirname(frontendPermsFile), { recursive: true });
fs.writeFileSync(frontendPermsFile, permsContent);
console.log('✅ Generated', frontendPermsFile);

fs.mkdirSync(path.dirname(frontendTypesFile), { recursive: true });
fs.writeFileSync(frontendTypesFile, typesContent);
console.log('✅ Generated', frontendTypesFile);
