"use client";

import { useEffect, useMemo, useState } from "react";
import type { AthleteDashboardDTO, CapacityType } from "@packages/types";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

import { ErrorState, LoadingState } from "@/components/state-view";
import { HelpTooltip } from "@/components/help-tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HELP } from "@/content/help-text";
import { webApi } from "@/lib/sdk";

const capacityOrder: CapacityType[] = ["STRENGTH", "MUSCULAR_ENDURANCE", "RELATIVE_STRENGTH", "WORK_CAPACITY"];

export default function AthleteDashboardPage() {
  const [data, setData] = useState<AthleteDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.getAthleteDashboard();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar dashboard");
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

  const capacities = useMemo(() => {
    const map = new Map(data?.capacities.map((item) => [item.type, item]));
    return capacityOrder.map((type) =>
      map.get(type) ?? {
        type,
        value: 0,
        confidence: "LOW" as const,
        lastUpdatedAt: "",
      }
    );
  }, [data]);

  const radarData = capacities.map((item) => ({ metric: item.type.replaceAll("_", " "), value: item.value }));

  if (loading) {
    return <LoadingState message="Cargando dashboard..." />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "No hay datos"} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Pulse <Badge variant="secondary">Score</Badge><HelpTooltip content={HELP.athleteMetrics.pulseScore} title="Ayuda: Pulse score" /></CardTitle>
          <CardDescription>
            Valor {data.pulse.value.toFixed(2)} / 100 · Confianza <Badge variant="outline">{data.pulse.confidence}</Badge> <HelpTooltip content={HELP.athleteMetrics.pulseConfidence} title="Ayuda: Confianza" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 rounded-lg border border-border/70 bg-background/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">Capacidades <HelpTooltip content={HELP.athleteMetrics.trends30d} title="Ayuda: Capacidades" /></CardTitle>
          <CardDescription>
            Nivel {data.level} · Banda {data.levelBand}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {capacities.map((item) => (
            <div key={item.type} className="space-y-2 rounded-lg border border-border/70 bg-background/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">{item.type.replaceAll("_", " ")}<HelpTooltip content={item.type === "STRENGTH" ? HELP.athleteMetrics.strength : item.type === "MUSCULAR_ENDURANCE" ? HELP.athleteMetrics.muscularEndurance : item.type === "RELATIVE_STRENGTH" ? HELP.athleteMetrics.relativeStrength : HELP.athleteMetrics.workCapacity} title={`Ayuda: ${item.type}`} /></span>
                <span>{item.value.toFixed(2)}</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">Tests <HelpTooltip content={HELP.athleteMetrics.tests30d} title="Ayuda: Tests" /></CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-1 text-muted-foreground">Últimos 7d <HelpTooltip content={HELP.athleteMetrics.tests7d} title="Ayuda: últimos 7d" /></p>
            <p className="text-2xl font-semibold">{data.counts.tests7d}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-1 text-muted-foreground">Últimos 30d <HelpTooltip content={HELP.athleteMetrics.tests30d} title="Ayuda: últimos 30d" /></p>
            <p className="text-2xl font-semibold">{data.counts.tests30d}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">Tendencias 30d <HelpTooltip content={HELP.athleteMetrics.trends30d} title="Ayuda: tendencias" /></CardTitle>
          <CardDescription>Variación por capacidad en los últimos 30 días.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.trends30d.map((trend) => (
            <div key={trend.type} className="flex items-center justify-between rounded-lg border p-2">
              <span>{trend.type.replaceAll("_", " ")}</span>
              <span className={trend.delta >= 0 ? "text-emerald-600" : "text-destructive"}>
                {trend.delta >= 0 ? "+" : ""}
                {trend.delta.toFixed(2)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
