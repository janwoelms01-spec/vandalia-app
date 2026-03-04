"use client";

import { useEffect, useState } from "react";

type WhoAmI = {
  ok: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string | null;
    role: string;
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