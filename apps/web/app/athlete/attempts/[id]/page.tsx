"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { AttemptDTO, SubmitResultRequest, WorkoutDefinitionDetailDTO } from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { webApi } from "@/lib/sdk";

type ResultType = "REPS" | "METERS" | "TIME" | "ROUNDS_METERS";

function allowedTypesForWorkout(workoutType: WorkoutDefinitionDetailDTO["type"] | undefined): ResultType[] {
  if (workoutType === "AMRAP") return ["REPS", "METERS", "ROUNDS_METERS"];
  if (workoutType === "EMOM") return ["REPS"];
  if (workoutType === "FORTIME") return ["TIME"];
  return ["REPS", "METERS", "TIME", "ROUNDS_METERS"];
}

export default function AthleteAttemptPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const attemptId = params.id;
  const workoutId = searchParams.get("workoutId") ?? "";

  const [workout, setWorkout] = useState<WorkoutDefinitionDetailDTO | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(!!workoutId);
  const [resultType, setResultType] = useState<ResultType>("REPS");
  const [repsTotal, setRepsTotal] = useState("");
  const [metersTotal, setMetersTotal] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [rounds, setRounds] = useState("");
  const [meters, setMeters] = useState("");
  const [loadKgTotal, setLoadKgTotal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutId) {
      setLoadingWorkout(false);
      return;
    }

    let active = true;

    async function loadWorkout() {
      try {
        const response = await webApi.getWorkoutDetail(workoutId);
        if (!active) return;
        setWorkout(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el workout del intento");
      } finally {
        if (active) {
          setLoadingWorkout(false);
        }
      }
    }

    void loadWorkout();

    return () => {
      active = false;
    };
  }, [workoutId]);

  const allowedTypes = useMemo(() => allowedTypesForWorkout(workout?.type), [workout]);

  useEffect(() => {
    if (!allowedTypes.includes(resultType)) {
      setResultType(allowedTypes[0]);
    }
  }, [allowedTypes, resultType]);

  function buildPayload(): SubmitResultRequest {
    const inputs: Record<string, unknown> = {};
    if (loadKgTotal) {
      inputs.loadKgTotal = Number(loadKgTotal);
    }

    if (resultType === "REPS") {
      return {
        primaryResult: { type: "REPS", repsTotal: Number(repsTotal) },
        inputs,
      };
    }

    if (resultType === "METERS") {
      return {
        primaryResult: { type: "METERS", metersTotal: Number(metersTotal) },
        inputs,
      };
    }

    if (resultType === "TIME") {
      return {
        primaryResult: { type: "TIME", timeSeconds: Number(timeSeconds) },
        inputs,
      };
    }

    return {
      primaryResult: { type: "ROUNDS_METERS", rounds: Number(rounds), meters: Number(meters) },
      inputs,
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = buildPayload();
      await webApi.request<AttemptDTO>(`/athlete/attempts/${attemptId}/submit-result`, {
        method: "POST",
        body: payload,
      });
      router.replace("/athlete/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar resultado");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingWorkout) {
    return <LoadingState message="Cargando intento..." />;
  }

  if (error && !workoutId) {
    return <ErrorState message={error} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit result</CardTitle>
        <CardDescription>
          Attempt {attemptId}
          {workout ? ` | ${workout.title} (${workout.type})` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resultType">Tipo de resultado</Label>
            <Select id="resultType" value={resultType} onChange={(event) => setResultType(event.target.value as ResultType)}>
              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          {resultType === "REPS" ? (
            <div className="space-y-2">
              <Label htmlFor="repsTotal">Reps totales</Label>
              <Input
                id="repsTotal"
                type="number"
                min={1}
                value={repsTotal}
                onChange={(event) => setRepsTotal(event.target.value)}
                required
              />
            </div>
          ) : null}

          {resultType === "METERS" ? (
            <div className="space-y-2">
              <Label htmlFor="metersTotal">Metros totales</Label>
              <Input
                id="metersTotal"
                type="number"
                min={1}
                value={metersTotal}
                onChange={(event) => setMetersTotal(event.target.value)}
                required
              />
            </div>
          ) : null}

          {resultType === "TIME" ? (
            <div className="space-y-2">
              <Label htmlFor="timeSeconds">Tiempo (segundos)</Label>
              <Input
                id="timeSeconds"
                type="number"
                min={1}
                value={timeSeconds}
                onChange={(event) => setTimeSeconds(event.target.value)}
                required
              />
            </div>
          ) : null}

          {resultType === "ROUNDS_METERS" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rounds">Rounds</Label>
                <Input id="rounds" type="number" min={0} value={rounds} onChange={(event) => setRounds(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meters">Meters</Label>
                <Input id="meters" type="number" min={0} value={meters} onChange={(event) => setMeters(event.target.value)} required />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="loadKgTotal">Load total (kg, opcional)</Label>
            <Input
              id="loadKgTotal"
              type="number"
              min={0}
              step="0.1"
              value={loadKgTotal}
              onChange={(event) => setLoadKgTotal(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar resultado"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
