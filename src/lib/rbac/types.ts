
export const ROLES = ["ADMIN", "SCRIPTOR", "ARCHIVAR", "MEMBER", "GENEALOGISTAR"] as const;
export type Role = (typeof ROLES)[number];
