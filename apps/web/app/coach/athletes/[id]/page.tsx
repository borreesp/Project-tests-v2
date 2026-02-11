"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { webApi } from "@/lib/sdk";

type CoachAthleteDetailDTO = {
  athleteId: string;
  userId: string;
  email: string;
  gymId: string;
  level: number;
  levelBand: string;
  createdAt: string;
};

type AttemptActionResponse = {
  id: string;
  status: string;
  scoreNorm?: number;
  validatedAt?: string;
};

export default function CoachAthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const athleteId = params.id;

  const [athlete, setAthlete] = useState<CoachAthleteDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState("");
  const [rejectReason, setRejectReason] = useState("invalid result");
  const [lastAction, setLastAction] = useState<AttemptActionResponse | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.request<CoachAthleteDetailDTO>(`/coach/athletes/${athleteId}`);
        if (!active) return;
        setAthlete(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el atleta");
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
  }, [athleteId]);

  async function onValidate(event: FormEvent) {
    event.preventDefault();
    if (!attemptId.trim()) return;

    setActing(true);
    setError(null);
    try {
      const response = await webApi.request<AttemptActionResponse>(`/coach/attempts/${attemptId.trim()}/validate`, {
        method: "POST",
      });
      setLastAction(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo validar attempt");
    } finally {
      setActing(false);
    }
  }

  async function onReject(event: FormEvent) {
    event.preventDefault();
    if (!attemptId.trim()) return;

    setActing(true);
    setError(null);
    try {
      const response = await webApi.request<AttemptActionResponse>(`/coach/attempts/${attemptId.trim()}/reject`, {
        method: "POST",
        body: { reason: rejectReason || "invalid result" },
      });
      setLastAction(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo rechazar attempt");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando atleta..." />;
  }

  if (error && !athlete) {
    return <ErrorState message={error} />;
  }

  if (!athlete) {
    return <ErrorState message="Atleta no encontrado" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{athlete.email}</CardTitle>
          <CardDescription>Athlete ID: {athlete.athleteId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Gym: {athlete.gymId}</p>
          <p>Level: {athlete.level}</p>
          <p>Band: {athlete.levelBand}</p>
          <p>Created: {new Date(athlete.createdAt).toLocaleString()}</p>
          <p className="text-muted-foreground">
            El backend actual no expone lista de attempts por atleta. Usa un attempt ID para validar o rechazar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones de validacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attemptId">Attempt ID</Label>
            <Input id="attemptId" value={attemptId} onChange={(event) => setAttemptId(event.target.value)} />
          </div>

          <form className="space-y-2" onSubmit={onValidate}>
            <Button type="submit" disabled={acting || !attemptId.trim()}>
              {acting ? "Procesando..." : "Validate attempt"}
            </Button>
          </form>

          <form className="space-y-2" onSubmit={onReject}>
            <Label htmlFor="rejectReason">Reject reason</Label>
            <Textarea id="rejectReason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
            <Button type="submit" variant="destructive" disabled={acting || !attemptId.trim()}>
              {acting ? "Procesando..." : "Reject attempt"}
            </Button>
          </form>

          {lastAction ? (
            <div className="rounded-lg border p-3 text-sm">
              <p>Attempt: {lastAction.id}</p>
              <p>Status: {lastAction.status}</p>
              {lastAction.scoreNorm !== undefined ? <p>Score norm: {lastAction.scoreNorm.toFixed(2)}</p> : null}
              {lastAction.validatedAt ? <p>Validated at: {lastAction.validatedAt}</p> : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
