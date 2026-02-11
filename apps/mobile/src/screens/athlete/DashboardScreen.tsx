import type { AthleteDashboardDTO, CapacityType, Confidence } from "@packages/types";
import { colors, radius, spacing, typography } from "@packages/ui-tokens";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { Card, EmptyState, ProgressBar, ScreenContainer, ScreenHeader } from "../../components/ui";
import { extractErrorMessage, isUnauthorizedError } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

function confidenceColor(confidence: Confidence): string {
  if (confidence === "HIGH") return "#16a34a";
  if (confidence === "MED") return "#ca8a04";
  return colors.muted;
}

export function DashboardScreen({ onLogout, email }: ProtectedScreenProps) {
  const [data, setData] = useState<AthleteDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await mobileApi.getAthleteDashboard();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        if (isUnauthorizedError(err)) {
          await onLogout();
          return;
        }
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
  }, [onLogout]);

  const capacities = useMemo(() => {
    const order: CapacityType[] = ["STRENGTH", "MUSCULAR_ENDURANCE", "RELATIVE_STRENGTH", "WORK_CAPACITY"];
    const mapped = new Map(data?.capacities.map((item) => [item.type, item]));
    return order.map((type) =>
      mapped.get(type) ?? {
        type,
        value: 0,
        confidence: "LOW" as const,
        lastUpdatedAt: "",
      }
    );
  }, [data]);

  return (
    <ScreenContainer>
      <ScreenHeader title="DashboardScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <EmptyState message={error} /> : null}

      {data ? (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Capacidades</Text>
            <View style={styles.capacityGrid}>
              {capacities.map((capacity) => (
                <View key={capacity.type} style={styles.capacityCard}>
                  <Text style={styles.capacityType}>{capacity.type.replaceAll("_", " ")}</Text>
                  <Text style={styles.capacityValue}>{capacity.value.toFixed(2)}</Text>
                  <ProgressBar value={capacity.value} />
                  <Text style={[styles.capacityConfidence, { color: confidenceColor(capacity.confidence) }]}>{capacity.confidence}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Tests</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>tests7d</Text>
                <Text style={styles.metricValue}>{data.counts.tests7d}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>tests30d</Text>
                <Text style={styles.metricValue}>{data.counts.tests30d}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>trends30d</Text>
            {data.trends30d.map((trend) => (
              <View key={trend.type} style={styles.trendRow}>
                <Text style={styles.trendLabel}>{trend.type.replaceAll("_", " ")}</Text>
                <Text style={[styles.trendValue, trend.delta >= 0 ? styles.positiveText : styles.negativeText]}>
                  {trend.delta >= 0 ? "+" : ""}
                  {trend.delta.toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.md,
    fontWeight: "700",
  },
  capacityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  capacityCard: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: "47%",
    padding: spacing.sm,
  },
  capacityType: {
    color: colors.foreground,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  capacityValue: {
    color: colors.foreground,
    fontSize: typography.lg,
    fontWeight: "700",
  },
  capacityConfidence: {
    fontSize: typography.xs,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  metricValue: {
    color: colors.foreground,
    fontSize: typography.lg,
    fontWeight: "700",
  },
  trendRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  trendLabel: {
    color: colors.foreground,
    fontSize: typography.sm,
  },
  trendValue: {
    fontSize: typography.sm,
    fontWeight: "700",
  },
  positiveText: {
    color: "#16a34a",
  },
  negativeText: {
    color: "#dc2626",
  },
});
