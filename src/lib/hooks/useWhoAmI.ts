"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/rbac/types";

type WhoAmI = {
  ok: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string | null;
    role: Role;
  };
};

export function useWhoAmI() {
  const [data, setData] = useState<WhoAmI | null>(null);

  useEffect(() => {
    fetch("/api/whoami")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return {
    user: data?.user ?? null,
    role: data?.user?.role ?? null,
  };
}