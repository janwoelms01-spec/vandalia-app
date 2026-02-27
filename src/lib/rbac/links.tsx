import type { Permission } from "@/lib/rbac/permissions";

export type NavItem = {
    label: string;
    href: string;
    permission: Permission;
};

export const NAV_ITEMS: NavItem[] = [
    {label: "Bücher", href: "/buecher", permission: "BOOKS_READ"},
    {label: "Ausleihe", href:"/mitnahme", permission: "ROOM_LOANS_READ"},
    {label: "Meldung", href:"/meldung", permission:"ISSUES_READ"},
    {label: "Inventur", href:"/inventur", permission:"INVENTORY_READ"},
    {label: "Export", href:"/export", permission:"EXPORT_CREATE"},
    {label: "Admin", href:"/admin", permission:"ADMIN_PANEL"},
];