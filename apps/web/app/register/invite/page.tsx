"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RegisterFromInviteRequest, RegisterFromInviteResponse, Sex } from "@packages/types";

import { routeForRole } from "@/lib/auth";
import { webApi } from "@/lib/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function RegisterInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => token.trim().length > 0 && password.trim().length > 0, [token, password]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const payload: RegisterFromInviteRequest = {
      token: token.trim(),
      password,
      athlete: {
        sex: sex || undefined,
        birthdate: birthdate || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      },
    };

    if (displayName.trim()) {
      payload.displayName = displayName.trim();
    }

    try {
      const response = await webApi.request<RegisterFromInviteResponse>("/auth/register-from-invite", {
        method: "POST",
        body: payload,
      });
      await webApi.setTokens(response.accessToken, response.refreshToken);
      router.replace(routeForRole(response.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Registro con invitacion</CardTitle>
          <CardDescription>Completa tu cuenta de atleta</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name (opcional)</Label>
              <Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select id="sex" value={sex} onChange={(event) => setSex(event.target.value as Sex | "")}> 
                  <option value="">-</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Fecha de nacimiento</Label>
                <Input id="birthdate" type="date" value={birthdate} onChange={(event) => setBirthdate(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Altura (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  min={120}
                  max={230}
                  value={heightCm}
                  onChange={(event) => setHeightCm(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Peso (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min={30}
                  max={250}
                  step="0.01"
                  value={weightKg}
                  onChange={(event) => setWeightKg(event.target.value)}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterInvitePage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando formulario...</div>}>
      <RegisterInviteForm />
    </Suspense>
  );
}
