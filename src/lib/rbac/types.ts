
export const ROLES = ['ADMIN','SENIOR','CONSENIOR','SCRIPTOR','ARCHIVAR','QUAESTOR','MEMBER','BEISITZER','GENEALOGISTAR','KV','DRUCK'] as const;
export type Role = (typeof ROLES)[number];
