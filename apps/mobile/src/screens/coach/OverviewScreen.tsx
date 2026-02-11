import { colors, spacing, typography } from "@packages/ui-tokens";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { Card, EmptyState, InlineError, ScreenContainer, ScreenHeader } from "../../components/ui";
import { extractErrorMessage } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

type CoachOverviewDTO = {
  gymId: string;
  athletesCount: number;
  pendingSubmissions: number;
  validatedToday: number;
};

export function OverviewScreen({ onLogout, email }: ProtectedScreenProps) {
  const [overview, setOverview] = useState<CoachOverviewDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await mobileApi.request<CoachOverviewDTO>("/coach/overview");
        if (!active) return;
        setOverview(response);
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
      <ScreenHeader title="OverviewScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <InlineError message={error} />

      {!isLoading && !overview ? <EmptyState message="No hay datos de overview" /> : null}

      {overview ? (
        <Card>
          <MetricRow label="gymId" value={overview.gymId} />
          <MetricRow label="athletesCount" value={String(overview.athletesCount)} />
          <MetricRow label="pendingSubmissions" value={String(overview.pendingSubmissions)} />
          <MetricRow label="validatedToday" value={String(overview.validatedToday)} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  value: {
    color: colors.foreground,
    fontSize: typography.md,
    fontWeight: "700",
  },
});
