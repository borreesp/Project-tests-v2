"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/state-view";
import { HelpTooltip } from "@/components/help-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HELP } from "@/content/help-text";
import { webApi } from "@/lib/sdk";

type CoachAthleteSummaryDTO = {
  athleteId: string;
  userId: string;
  email: string;
  level: number;
  levelBand: string;
};

export default function CoachAthletesPage() {
  const [athletes, setAthletes] = useState<CoachAthleteSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await webApi.request<CoachAthleteSummaryDTO[]>("/coach/athletes");
        if (!active) return;
        setAthletes(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar atletas");
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

  if (loading) {
    return <LoadingState message="Cargando atletas..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Athletes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="flex items-center gap-1">Level <HelpTooltip content={HELP.coachMetrics.level} title="Ayuda: Level" /></TableHead>
              <TableHead className="flex items-center gap-1">Band <HelpTooltip content={HELP.coachMetrics.levelBand} title="Ayuda: Band" /></TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.map((athlete) => (
              <TableRow key={athlete.athleteId}>
                <TableCell>{athlete.email}</TableCell>
                <TableCell>{athlete.level}</TableCell>
                <TableCell>{athlete.levelBand}</TableCell>
                <TableCell>
                  <Link className="text-primary hover:underline" href={`/coach/athletes/${athlete.athleteId}`}>
                    Ver perfil
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
