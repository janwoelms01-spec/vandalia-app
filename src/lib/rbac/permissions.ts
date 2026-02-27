import type { Role } from "./types";

export type Permission = 
    | "BOOKS_READ"
    | "BOOKS_MANAGE"
    | "ISSUES_READ"
    | "ISSUES_REQUEST"
    | "ISSUES_MANAGE"
    | "ROOM_LOANS_READ"
    | "ROOM_LOANS_REQUEST"
    | "ROOM_LOANS_MANAGE"
    | "ADMIN_PANEL"
    | "INVENTORY_READ"
    | "INVENTORY_WRITE"
    | "EXPORT_CREATE"
    | "BOOK_READ"
    | "BOOK_CREATE"
    | "BOOK_UPDATE"
    | "COPY_CREATE"
    | "COPY_UPDATE"
    | "USERS_READ"
    | "USERS_INVITE"
    | "USERS_CREATE"
    | "USERS_UPDATE_ROLE"
    | "USERS_DISABLE"
    | "BACKUP_READ"
    | "BACKUP_CREATE"
    | "BACKUP_RESTORE"
;
const Member_OPERATIONS: Permission[]=[
    // Bibliothek Rechte
    "BOOKS_READ",
    "BOOK_READ",

    //Meldungen
    "ISSUES_READ",
    "ISSUES_REQUEST",

    //Ausleih Rechte
    "ROOM_LOANS_READ",
    "ROOM_LOANS_REQUEST",

    //Inventory Rechte
    "INVENTORY_READ",
    
];

const OPERATIONS: Permission[]=[
    //Bibliothek
    "BOOKS_MANAGE",
    "BOOK_CREATE",
    "COPY_CREATE",
    "COPY_UPDATE",
    "BOOK_UPDATE",

    //Meldungen
    "ISSUES_MANAGE",

    //Ausleih Rechte
    "ROOM_LOANS_MANAGE",

    //Inventory Rechte
    "INVENTORY_WRITE",

    //Export Rechte
    "EXPORT_CREATE",
];

const USER_OPERATION: Permission[]=[
    //Admin Panel
    "ADMIN_PANEL",

    //User
    "USERS_CREATE",
    "USERS_DISABLE",
    "USERS_INVITE",
    "USERS_READ",
    "USERS_UPDATE_ROLE"
];

const BACKUP_OPERATIONS: Permission[] = [
    "BACKUP_CREATE",
    "BACKUP_READ",
    "BACKUP_RESTORE"
]

    const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
        ADMIN: [...Member_OPERATIONS, ...OPERATIONS, ...USER_OPERATION, ...BACKUP_OPERATIONS
        ],
        SCRIPTOR:[...Member_OPERATIONS, ...OPERATIONS, ...USER_OPERATION
        ],
        ARCHIVAR: [...Member_OPERATIONS, ...OPERATIONS],
        MEMBER: [...Member_OPERATIONS],

    };

    export function can(role: Role, permission:Permission): boolean {
        return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    }