"use client";

import { FormEvent, useEffect, useState } from "react";
import type { MovementDTO, WorkoutDefinitionSummaryDTO, WorkoutType, WorkoutVisibility } from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { webApi } from "@/lib/sdk";

export default function CoachWorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Base Test");
  const [description, setDescription] = useState("Single-block workout");
  const [isTest, setIsTest] = useState(true);
  const [type, setType] = useState<WorkoutType>("AMRAP");
  const [visibility, setVisibility] = useState<WorkoutVisibility>("GYMS_ONLY");
  const [movementId, setMovementId] = useState("");
  const [reps, setReps] = useState("20");

  async function loadData() {
    const [workoutsResponse, movementsResponse] = await Promise.all([webApi.listWorkouts(), webApi.listMovements()]);
    setWorkouts(workoutsResponse);
    setMovements(movementsResponse);
    if (!movementId && movementsResponse[0]) {
      setMovementId(movementsResponse[0].id);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadData();
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar workouts");
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

  async function onCreateWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movementId) return;

    setSaving(true);
    setError(null);

    try {
      await webApi.createWorkout({
        title,
        description,
        isTest,
        type,
        visibility,
        scales: [
          {
            code: "RX",
            label: "RX",
            notes: "",
            referenceLoads: {},
          },
          {
            code: "SCALED",
            label: "Scaled",
            notes: "",
            referenceLoads: {},
          },
        ],
        blocks: [
          {
            ord: 1,
            name: "Main",
            blockType: "WORK",
            repeatInt: 1,
            movements: [
              {
                ord: 1,
                movementId,
                reps: Number(reps),
                loadRule: "ATHLETE_CHOICE",
                notes: "",
              },
            ],
          },
        ],
      });

      await loadData();
      setTitle("Base Test");
      setDescription("Single-block workout");
      setReps("20");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear workout");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish(workoutId: string) {
    setError(null);

    try {
      await webApi.publishWorkout(workoutId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar workout");
    }
  }

  if (loading) {
    return <LoadingState message="Cargando workouts..." />;
  }

  if (error && workouts.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Crear workout</CardTitle>
          <CardDescription>Builder basico (1 bloque, 1 movimiento)</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreateWorkout}>
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={type} onChange={(event) => setType(event.target.value as WorkoutType)}>
                  <option value="AMRAP">AMRAP</option>
                  <option value="EMOM">EMOM</option>
                  <option value="FORTIME">FORTIME</option>
                  <option value="INTERVALS">INTERVALS</option>
                  <option value="BLOCKS">BLOCKS</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select id="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as WorkoutVisibility)}>
                  <option value="COMMUNITY">COMMUNITY</option>
                  <option value="GYMS_ONLY">GYMS_ONLY</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isTest">Is test</Label>
                <Select id="isTest" value={String(isTest)} onChange={(event) => setIsTest(event.target.value === "true")}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movementId">Movement</Label>
                <Select id="movementId" value={movementId} onChange={(event) => setMovementId(event.target.value)}>
                  {movements.map((movement) => (
                    <option key={movement.id} value={movement.id}>
                      {movement.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input id="reps" type="number" min={1} value={reps} onChange={(event) => setReps(event.target.value)} />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={saving || !movementId}>
              {saving ? "Guardando..." : "Crear"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workouts.map((workout) => (
            <div key={workout.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{workout.title}</p>
                <p className="text-sm text-muted-foreground">
                  {workout.type} | {workout.visibility} | {workout.publishedAt ? "Published" : "Draft"}
                </p>
              </div>
              <Button variant="outline" onClick={() => void onPublish(workout.id)}>
                Publicar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
