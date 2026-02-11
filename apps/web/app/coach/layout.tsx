"use client";

import type { ReactNode } from "react";

import { RoleShell } from "@/components/role-shell";
import { ErrorState, LoadingState } from "@/components/state-view";
import { useRequireAuth } from "@/lib/use-auth";

const coachTabs = [
  { href: "/coach/overview", label: "Overview" },
  { href: "/coach/athletes", label: "Athletes" },
  { href: "/coach/workouts", label: "Workouts" },
];

export default function CoachLayout({ children }: { children: ReactNode }) {
  const { loading, user, error } = useRequireAuth(["COACH", "ADMIN"]);

  if (loading) {
    return <LoadingState message="Cargando modulo coach..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!user) {
    return <LoadingState message="Validando acceso..." />;
  }

  return (
    <RoleShell title="Coach" user={user} tabs={coachTabs}>
      {children}
    </RoleShell>
  );
}
