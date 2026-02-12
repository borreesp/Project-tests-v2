"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardDTO, LeaderboardPeriod, LeaderboardScope, ScaleCode, WorkoutDefinitionSummaryDTO } from "@packages/types";

import { EmptyState, ErrorState, LoadingState } from "@/components/state-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { webApi } from "@/lib/sdk";

export default function AthleteRankingPage() {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [scope, setScope] = useState<LeaderboardScope>("GYM");
  const [scaleCode, setScaleCode] = useState<ScaleCode>("RX");
  const [period, setPeriod] = useState<LeaderboardPeriod>("ALL_TIME");
  const [leaderboard, setLeaderboard] = useState<LeaderboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRank, setLoadingRank] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkouts() {
      try {
        const response = await webApi.listWorkouts();
        if (!active) return;

        const onlyTests = response.filter((item) => item.isTest);
        setWorkouts(onlyTests);
        if (onlyTests[0]) {
          setSelectedWorkout(onlyTests[0].id);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar workouts");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkouts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedWorkout) return;

    let active = true;

    async function loadRanking() {
      setLoadingRank(true);
      try {
        const response = await webApi.getLeaderboard({
          workoutId: selectedWorkout,
          scope,
          period,
          scaleCode,
        });
        if (!active) return;
        setLeaderboard(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar ranking");
      } finally {
        if (active) {
          setLoadingRank(false);
        }
      }
    }

    void loadRanking();

    return () => {
      active = false;
    };
  }, [period, scaleCode, scope, selectedWorkout]);

  const selectedWorkoutLabel = useMemo(
    () => workouts.find((item) => item.id === selectedWorkout)?.title ?? "Selecciona workout",
    [selectedWorkout, workouts]
  );

  if (loading) {
    return <LoadingState message="Cargando ranking..." />;
  }

  if (error && !leaderboard) {
    return <ErrorState message={error} />;
  }

  if (workouts.length === 0) {
    return <EmptyState title="Sin tests publicados" message="No hay workouts de test publicados aún." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Ranking <Badge variant="secondary">Live</Badge></CardTitle>
          <CardDescription>Workout seleccionado: {selectedWorkoutLabel}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select id="scope" value={scope} onChange={(event) => setScope(event.target.value as LeaderboardScope)}>
              <option value="GYM">Gym</option>
              <option value="COMMUNITY">Global</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale">Scale</Label>
            <Select id="scale" value={scaleCode} onChange={(event) => setScaleCode(event.target.value as ScaleCode)}>
              <option value="RX">RX</option>
              <option value="SCALED">SCALED</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select id="period" value={period} onChange={(event) => setPeriod(event.target.value as LeaderboardPeriod)}>
              <option value="ALL_TIME">All time</option>
              <option value="D30">30d</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout">Workout</Label>
            <Select id="workout" value={selectedWorkout} onChange={(event) => setSelectedWorkout(event.target.value)}>
              {workouts.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de posiciones</CardTitle>
          <CardDescription>
            {loadingRank ? "Actualizando ranking..." : `Posición actual: ${leaderboard?.myRank ?? "N/A"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Athlete</TableHead>
                <TableHead>Score Norm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(leaderboard?.entries ?? []).map((entry) => (
                <TableRow key={entry.athleteId}>
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell>{entry.displayName}</TableCell>
                  <TableCell>{entry.bestScoreNorm.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
