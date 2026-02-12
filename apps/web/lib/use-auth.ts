"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchMe, isUnauthorizedError, routeForRole, type AppRole, type MeDTO } from "@/lib/auth";

type UseRequireAuthResult = {
  loading: boolean;
  user: MeDTO | null;
  error: string | null;
};

export function useRequireAuth(allowedRoles?: AppRole[]): UseRequireAuthResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizedAllowedRoles = useMemo(() => (allowedRoles ? [...allowedRoles] : null), [allowedRoles]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const me = await fetchMe();
        if (!active) return;

        if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(me.role)) {
          router.replace(routeForRole(me.role));
          return;
        }

        setUser(me);
        setError(null);
      } catch (err) {
        if (!active) return;

        if (isUnauthorizedError(err)) {
          router.replace("/login");
          return;
        }

        setError(err instanceof Error ? err.message : "Unable to load session");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [normalizedAllowedRoles, router]);

  return { loading, user, error };
}
