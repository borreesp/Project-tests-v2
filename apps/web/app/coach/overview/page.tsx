"use client";

import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { webApi } from "@/lib/sdk";

type CoachOverviewDTO = {
  gymId: string;
  athletesCount: number;
  pendingSubmissions: number;
  validatedToday: number;
};

export default function CoachOverviewPage() {
  const [overview, setOverview] = useState<CoachOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.request<CoachOverviewDTO>("/coach/overview");
        if (!active) return;
        setOverview(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar overview");
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
  }, []);

  if (loading) {
    return <LoadingState message="Cargando overview..." />;
  }

  if (error || !overview) {
    return <ErrorState message={error ?? "No hay datos"} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gym</CardTitle>
          <CardDescription>ID operativo activo</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <Badge variant="outline">{overview.gymId}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Athletes</CardTitle>
          <CardDescription>Total de atletas asignados</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{overview.athletesCount}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending validations</CardTitle>
          <CardDescription>Tests por revisar</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold text-amber-400">{overview.pendingSubmissions}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validated today</CardTitle>
          <CardDescription>Progreso diario del coach</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold text-emerald-400">{overview.validatedToday}</CardContent>
      </Card>
    </div>
  );
}
