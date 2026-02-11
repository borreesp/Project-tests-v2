"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CoachWorkoutSummaryDTO, WorkoutType } from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { webApi } from "@/lib/sdk";

type PublishedFilter = "ALL" | "PUBLISHED" | "DRAFT";
type IsTestFilter = "ALL" | "TRUE" | "FALSE";

export default function CoachWorkoutsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workouts, setWorkouts] = useState<CoachWorkoutSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isTestFilter, setIsTestFilter] = useState<IsTestFilter>("TRUE");
  const [typeFilter, setTypeFilter] = useState<"ALL" | WorkoutType>("ALL");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("ALL");

  const notice = searchParams.get("notice");

  async function loadWorkouts() {
    const response = await webApi.coachWorkouts();
    setWorkouts(response);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadWorkouts();
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar los workouts");
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

  const filtered = useMemo(() => {
    return workouts.filter((item) => {
      if (isTestFilter === "TRUE" && !item.isTest) return false;
      if (isTestFilter === "FALSE" && item.isTest) return false;

      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;

      if (publishedFilter === "PUBLISHED" && !item.publishedAt) return false;
      if (publishedFilter === "DRAFT" && item.publishedAt) return false;

      return true;
    });
  }, [isTestFilter, typeFilter, publishedFilter, workouts]);

  async function onDuplicate(workoutId: string) {
    setError(null);
    setRunningActionId(workoutId);
    try {
      await webApi.duplicateWorkout(workoutId);
      await loadWorkouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo duplicar");
    } finally {
      setRunningActionId(null);
    }
  }

  async function onPublish(workoutId: string) {
    setError(null);
    setRunningActionId(workoutId);
    try {
      await webApi.publishWorkout(workoutId);
      await loadWorkouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setRunningActionId(null);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando workouts de coach..." />;
  }

  if (error && workouts.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="py-3 text-sm text-emerald-900">{notice}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Coach Workouts</CardTitle>
          <Link className={buttonVariants({ variant: "default" })} href="/coach/workouts/new">
            Crear Test
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">is_test</p>
              <Select value={isTestFilter} onChange={(event) => setIsTestFilter(event.target.value as IsTestFilter)}>
                <option value="TRUE">Solo tests</option>
                <option value="FALSE">Solo no-tests</option>
                <option value="ALL">Todos</option>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">type</p>
              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "ALL" | WorkoutType)}>
                <option value="ALL">Todos</option>
                <option value="AMRAP">AMRAP</option>
                <option value="EMOM">EMOM</option>
                <option value="FORTIME">FORTIME</option>
                <option value="INTERVALS">INTERVALS</option>
                <option value="BLOCKS">BLOCKS</option>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">published</p>
              <Select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value as PublishedFilter)}>
                <option value="ALL">Todos</option>
                <option value="PUBLISHED">Publicados</option>
                <option value="DRAFT">Borradores</option>
              </Select>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const actionRunning = runningActionId === item.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.title}
                        {item.isTest ? <Badge variant="secondary">TEST</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.scoreType ?? "-"}</TableCell>
                    <TableCell>{item.publishedAt ? "Publicado" : "Draft"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/coach/workouts/${item.id}/edit`)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" disabled={actionRunning} onClick={() => void onDuplicate(item.id)}>
                          Duplicar
                        </Button>
                        <Button size="sm" disabled={actionRunning} onClick={() => void onPublish(item.id)}>
                          Publicar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
