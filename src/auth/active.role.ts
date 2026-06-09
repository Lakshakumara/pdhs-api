import { ScopeType } from "@prisma/client";

export interface ActiveRole {
  role: string;
  scopeType: ScopeType;
  scopeId: string | null;
}