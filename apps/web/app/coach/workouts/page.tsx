"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CoachWorkoutSummaryDTO, WorkoutType } from "@packages/types";

import { HttpError } from "@packages/sdk";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { webApi } from "@/lib/sdk";

type PublishedFilter = "ALL" | "PUBLISHED" | "DRAFT";

export default function CoachWorkoutsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const notice = searchParams.get("notice");

  const [workouts, setWorkouts] = useState<CoachWorkoutSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(notice);
  const [pendingDeleteWorkoutId, setPendingDeleteWorkoutId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"ALL" | WorkoutType>("ALL");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("ALL");

  useEffect(() => {
    setNoticeMessage(notice);
  }, [notice]);

  async function loadWorkouts() {
    const response = await webApi.coachWorkouts();
    setWorkouts(response.filter((item) => item.isTest));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadWorkouts();
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar los tests");
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
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (publishedFilter === "PUBLISHED" && !item.publishedAt) return false;
      if (publishedFilter === "DRAFT" && item.publishedAt) return false;
      return true;
    });
  }, [typeFilter, publishedFilter, workouts]);

  async function onDuplicate(workoutId: string) {
    setError(null);
    setRunningActionId(workoutId);
    try {
      const duplicated = await webApi.duplicateWorkout(workoutId);
      router.push(`/coach/workouts/${duplicated.id}/edit?notice=${encodeURIComponent("Duplicado como borrador")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo duplicar");
    } finally {
      setRunningActionId(null);
    }
  }

  async function onDelete(workoutId: string) {
    setError(null);
    setRunningActionId(workoutId);
    try {
      await webApi.deleteWorkout(workoutId);
      setPendingDeleteWorkoutId(null);
      setNoticeMessage("Test eliminado correctamente");
      await loadWorkouts();
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        setError("No se puede eliminar porque tiene resultados asociados.");
      } else {
        setError(err instanceof Error ? err.message : "No se pudo eliminar");
      }
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
    return <LoadingState message="Cargando tests de coach..." />;
  }

  if (error && workouts.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-4">
      {noticeMessage ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="py-3 text-sm text-emerald-900">{noticeMessage}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Tests</CardTitle>
          <Link className={buttonVariants({ variant: "default" })} href="/coach/workouts/new">
            Crear Test
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
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
                <TableHead>ScoreType</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const actionRunning = runningActionId === item.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.scoreType ?? "-"}</TableCell>
                    <TableCell>{item.publishedAt ? "Si" : "No"}</TableCell>
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
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionRunning}
                          onClick={() => setPendingDeleteWorkoutId(item.id)}
                        >
                          Eliminar
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
      {pendingDeleteWorkoutId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Seguro que deseas eliminar este test? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPendingDeleteWorkoutId(null)} disabled={runningActionId !== null}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void onDelete(pendingDeleteWorkoutId)}
                  disabled={runningActionId !== null}
                >
                  Confirmar eliminación
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
