import { PERMISSIONS } from '../src/auth/constants/permission.registry';
import * as fs from 'fs';
import * as path from 'path';

const frontendFile = path.resolve(__dirname, '../../pdhs/src/app/core/constants/permissions.ts');

const content = `// AUTO-GENERATED from pdhs-api/src/auth/constants/permission.registry.ts
// DO NOT EDIT - run npm run gen:perms in pdhs-api

export enum Permission {
${Object.keys(PERMISSIONS).map(k => ` ${k} = '${k}',`).join('\n')}
}

export type PermissionKey = keyof typeof Permission;
`;

fs.mkdirSync(path.dirname(frontendFile), { recursive: true });
fs.writeFileSync(frontendFile, content);
console.log('✅ Generated', frontendFile);