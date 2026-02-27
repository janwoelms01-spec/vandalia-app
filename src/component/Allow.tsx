import { ReactNode } from "react";
import type { Role } from "@/lib/rbac/types";
import type { Permission } from "@/lib/rbac/permissions";
import { can } from "@/lib/rbac/permissions";

export function Allow({
    role,
    permission,
    children,
    fallback = null,

}: {
    role: Role;
    permission: Permission;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return can(role, permission) ? <>{children}</>:<>{fallback}</>;
}