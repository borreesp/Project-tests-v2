"use client";

import type { ReactNode } from "react";

import { RoleShell } from "@/components/role-shell";
import { ErrorState, LoadingState } from "@/components/state-view";
import { useRequireAuth } from "@/lib/use-auth";

const athleteTabs = [
  { href: "/athlete/dashboard", label: "Dashboard" },
  { href: "/athlete/workouts", label: "Workouts" },
  { href: "/athlete/ranking", label: "Ranking" },
];

export default function AthleteLayout({ children }: { children: ReactNode }) {
  const { loading, user, error } = useRequireAuth(["ATHLETE"]);

  if (loading) {
    return <LoadingState message="Cargando modulo atleta..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!user) {
    return <LoadingState message="Validando acceso..." />;
  }

  return (
    <RoleShell title="Athlete" user={user} tabs={athleteTabs}>
      {children}
    </RoleShell>
  );
}
