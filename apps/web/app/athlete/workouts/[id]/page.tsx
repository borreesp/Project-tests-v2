"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CreateAttemptResponse, ScaleCode, WorkoutDefinitionDetailDTO } from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { webApi } from "@/lib/sdk";

export default function AthleteWorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workoutId = params.id;

  const [workout, setWorkout] = useState<WorkoutDefinitionDetailDTO | null>(null);
  const [scaleCode, setScaleCode] = useState<ScaleCode>("RX");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.getWorkoutDetail(workoutId);
        if (!active) return;

        setWorkout(response);
        if (response.scales.length > 0) {
          setScaleCode(response.scales[0].code);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el workout");
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
  }, [workoutId]);

  const hasScales = useMemo(() => (workout?.scales.length ?? 0) > 0, [workout]);

  async function onCreateAttempt() {
    if (!hasScales) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await webApi.request<CreateAttemptResponse>(`/athlete/workouts/${workoutId}/attempt`, {
        method: "POST",
        body: { scaleCode },
      });

      router.push(`/athlete/attempts/${response.attemptId}?workoutId=${workoutId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el intento");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando detalle..." />;
  }

  if (error || !workout) {
    return <ErrorState message={error ?? "Workout no encontrado"} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{workout.title}</CardTitle>
          <CardDescription>
            {workout.type} - {workout.visibility}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{workout.description || "Sin descripcion"}</p>
          <div className="grid gap-3 sm:max-w-xs">
            <Label htmlFor="scaleCode">Escala</Label>
            <Select
              id="scaleCode"
              value={scaleCode}
              onChange={(event) => setScaleCode(event.target.value as ScaleCode)}
              disabled={!hasScales}
            >
              {workout.scales.map((scale) => (
                <option key={scale.code} value={scale.code}>
                  {scale.code} - {scale.label}
                </option>
              ))}
            </Select>
            <Button onClick={onCreateAttempt} disabled={!hasScales || submitting}>
              {submitting ? "Creando intento..." : "Aplicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {workout.blocks.map((block) => (
        <Card key={block.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Bloque {block.ord}: {block.name || block.blockType}
            </CardTitle>
            <CardDescription>
              Tipo {block.blockType} | Repeticiones {block.repeatInt}
              {block.timeSeconds ? ` | Tiempo ${block.timeSeconds}s` : ""}
              {block.capSeconds ? ` | Cap ${block.capSeconds}s` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {block.movements.map((movement) => (
              <div key={movement.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {movement.ord}. {movement.movement.name}
                </p>
                <p className="text-muted-foreground">
                  {movement.reps ? `${movement.reps} reps` : ""}
                  {movement.meters ? ` ${movement.meters} m` : ""}
                  {movement.seconds ? ` ${movement.seconds} s` : ""}
                  {movement.calories ? ` ${movement.calories} cal` : ""}
                  {movement.boxHeightCm ? ` | Box ${movement.boxHeightCm} cm` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
