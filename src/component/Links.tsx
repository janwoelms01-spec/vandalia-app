"use client";

import Link from "next/link";
import type { Role } from "@/lib/rbac/types";
import { can } from "@/lib/rbac/permissions";
import { NAV_ITEMS } from "@/lib/rbac/links";
import "../../app/globals.css";

import { useState } from "react";
export function Links({role}: {role: Role}) {
    const items = NAV_ITEMS.filter((item) => can(role, item.permission));
    const [open, setOpen] = useState(false);

    // toggle icon depending on menu state
    const MenuIcon = () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
    const CloseIcon = () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    return (
        <nav className="bg-inherit w-full flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* spacer left if needed or logo moved to layout */}
                    <div />
                    {/* desktop links (visible on large+ screens) */}
                    <div className="hidden lg:flex lg:space-x-4">
                        {items.map((item) => (
                            <Link key={item.href} href={item.href} className="nav-item px-3 py-2 rounded-md text-sm font-medium">
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    {/* mobile menu button (shown on small/medium) */}
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={() => setOpen((o) => !o)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            aria-controls="mobile-menu"
                            aria-expanded={open}
                        >
                            <span className="sr-only">Öffne mobile Version</span>
                            {open ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>
            {/* mobile links - accordion style */}
            {open && (
                <div className="lg:hidden bg-inherit w-full" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}