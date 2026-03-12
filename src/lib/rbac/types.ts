
export const ROLES = ['ADMIN','SENIOR','SCRIPTOR','ARCHIVAR','MEMBER','GENEALOGISTAR','KV','VORSTAND','DRUCK'] as const;
export type Role = (typeof ROLES)[number];
