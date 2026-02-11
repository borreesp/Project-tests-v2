"use client";

import { FormEvent, useState } from "react";
import type { MovementPattern, MovementUnit } from "@packages/types";

import { RoleShell } from "@/components/role-shell";
import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRequireAuth } from "@/lib/use-auth";
import { webApi } from "@/lib/sdk";

export default function AdminPage() {
  const { loading, user, error } = useRequireAuth(["ADMIN"]);

  const [name, setName] = useState("Sandbag Carry");
  const [pattern, setPattern] = useState<MovementPattern>("CARRY");
  const [unitPrimary, setUnitPrimary] = useState<MovementUnit>("METERS");
  const [requiresLoad, setRequiresLoad] = useState(true);
  const [requiresBodyweight, setRequiresBodyweight] = useState(false);
  const [working, setWorking] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function onRecompute() {
    setWorking(true);
    setResultMessage(null);

    try {
      const response = await webApi.request<{ status: string; recomputed: number }>("/admin/rankings/recompute", {
        method: "POST",
      });
      setResultMessage(`Rankings recomputed: ${response.recomputed}`);
    } catch (err) {
      setResultMessage(err instanceof Error ? err.message : "No se pudo recomputar rankings");
    } finally {
      setWorking(false);
    }
  }

  async function onCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setResultMessage(null);

    try {
      const response = await webApi.request<{ id: string; name: string }>("/admin/movements", {
        method: "POST",
        body: {
          name,
          pattern,
          unitPrimary,
          requiresLoad,
          requiresBodyweight,
        },
      });
      setResultMessage(`Movimiento creado: ${response.name} (${response.id})`);
    } catch (err) {
      setResultMessage(err instanceof Error ? err.message : "No se pudo crear movimiento");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando admin..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!user) {
    return <LoadingState message="Validando acceso..." />;
  }

  return (
    <RoleShell title="Admin" user={user} tabs={[{ href: "/admin", label: "Admin" }]}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>Recalcula todas las tablas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onRecompute} disabled={working}>
              Recompute rankings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={onCreateMovement}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <Select id="pattern" value={pattern} onChange={(event) => setPattern(event.target.value as MovementPattern)}>
                    <option value="SQUAT">SQUAT</option>
                    <option value="HINGE">HINGE</option>
                    <option value="PUSH">PUSH</option>
                    <option value="PULL">PULL</option>
                    <option value="CARRY">CARRY</option>
                    <option value="CORE">CORE</option>
                    <option value="LOCOMOTION">LOCOMOTION</option>
                    <option value="OTHER">OTHER</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrimary">Primary unit</Label>
                  <Select
                    id="unitPrimary"
                    value={unitPrimary}
                    onChange={(event) => setUnitPrimary(event.target.value as MovementUnit)}
                  >
                    <option value="REPS">REPS</option>
                    <option value="METERS">METERS</option>
                    <option value="SECONDS">SECONDS</option>
                    <option value="CALORIES">CALORIES</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requiresLoad">Requires load</Label>
                  <Select
                    id="requiresLoad"
                    value={String(requiresLoad)}
                    onChange={(event) => setRequiresLoad(event.target.value === "true")}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiresBodyweight">Requires bodyweight</Label>
                  <Select
                    id="requiresBodyweight"
                    value={String(requiresBodyweight)}
                    onChange={(event) => setRequiresBodyweight(event.target.value === "true")}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={working}>
                Crear movimiento
              </Button>
            </form>
          </CardContent>
        </Card>

        {resultMessage ? <p className="text-sm text-muted-foreground">{resultMessage}</p> : null}
      </div>
    </RoleShell>
  );
}
