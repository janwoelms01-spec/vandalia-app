
export const ROLES = ["ADMIN", "SCRIPTOR", "ARCHIVAR", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];
