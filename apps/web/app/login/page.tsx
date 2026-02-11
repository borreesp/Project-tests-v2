"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { routeForRole, fetchMe, isUnauthorizedError } from "@/lib/auth";
import { webApi } from "@/lib/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("athlete@local.test");
  const [password, setPassword] = useState("Athlete123!");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const me = await fetchMe();
        if (!active) return;
        router.replace(routeForRole(me.role));
      } catch (err) {
        if (!active) return;
        if (!isUnauthorizedError(err)) {
          setError(err instanceof Error ? err.message : "No se pudo validar sesion");
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await webApi.login({ email, password });
      router.replace(routeForRole(response.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login invalido");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return <div className="text-sm text-muted-foreground">Validando sesion...</div>;
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesion</CardTitle>
          <CardDescription>Accede al panel segun tu rol</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo: `admin@local.com`, `coach@local.com`, `athlete@local.com`
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
