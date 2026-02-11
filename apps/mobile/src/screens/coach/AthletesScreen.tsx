import { colors, typography } from "@packages/ui-tokens";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { Card, EmptyState, InlineError, ScreenContainer, ScreenHeader } from "../../components/ui";
import { extractErrorMessage } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

type CoachAthleteSummaryDTO = {
  athleteId: string;
  userId: string;
  email: string;
  level: number;
  levelBand: string;
};

export function AthletesScreen({ onLogout, email }: ProtectedScreenProps) {
  const [athletes, setAthletes] = useState<CoachAthleteSummaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await mobileApi.request<CoachAthleteSummaryDTO[]>("/coach/athletes");
        if (!active) return;
        setAthletes(response);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <ScreenHeader title="AthletesScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <InlineError message={error} />

      {athletes.length === 0 && !isLoading ? <EmptyState message="Sin atletas" /> : null}

      {athletes.map((athlete) => (
        <Card key={athlete.athleteId}>
          <Text style={{ color: colors.foreground, fontSize: typography.md, fontWeight: "700" }}>{athlete.email}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.sm }}>level={athlete.level} | band={athlete.levelBand}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.xs }}>athleteId: {athlete.athleteId}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}
