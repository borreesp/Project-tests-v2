"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WorkoutDefinitionSummaryDTO } from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { webApi } from "@/lib/sdk";

export default function AthleteWorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.listWorkouts();
        if (!active) return;
        setWorkouts(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar workouts");
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
    return <LoadingState message="Cargando workouts..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No hay workouts asignados aun. Pide a tu coach publicar uno.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardHeader>
            <CardTitle className="text-lg">{workout.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-2">
              <Badge variant="secondary">{workout.type}</Badge>
              <Badge variant="outline">{workout.visibility}</Badge>
              {workout.isTest ? <Badge>TEST</Badge> : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm text-primary hover:underline" href={`/athlete/workouts/${workout.id}`}>
              Ver detalle
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
