import type { LeaderboardDTO, LeaderboardPeriod, LeaderboardScope, ScaleCode, WorkoutDefinitionSummaryDTO } from "@packages/types";
import { colors } from "@packages/ui-tokens";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { Card, EmptyState, InlineError, OptionSelector, ScreenContainer, ScreenHeader, uiStyles } from "../../components/ui";
import { extractErrorMessage } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

export function RankingScreen({ onLogout, email }: ProtectedScreenProps) {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const [scope, setScope] = useState<LeaderboardScope>("GYM");
  const [scaleCode, setScaleCode] = useState<ScaleCode>("RX");
  const [period, setPeriod] = useState<LeaderboardPeriod>("ALL_TIME");
  const [leaderboard, setLeaderboard] = useState<LeaderboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkouts() {
      try {
        const response = await mobileApi.listWorkouts();
        if (!active) return;

        const tests = response.filter((workout) => workout.isTest);
        setWorkouts(tests);
        if (tests.length > 0) {
          setSelectedWorkoutId((current) => current || tests[0].id);
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkouts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedWorkoutId) return;

    let active = true;

    async function loadRanking() {
      setIsFetching(true);
      setError(null);
      try {
        const response = await mobileApi.getLeaderboard({
          workoutId: selectedWorkoutId,
          scope,
          period,
          scaleCode,
        });
        if (!active) return;
        setLeaderboard(response);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) {
          setIsFetching(false);
        }
      }
    }

    void loadRanking();

    return () => {
      active = false;
    };
  }, [period, scaleCode, scope, selectedWorkoutId]);

  return (
    <ScreenContainer>
      <ScreenHeader title="RankingScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <InlineError message={error} />

      {workouts.length === 0 && !isLoading ? <EmptyState message="No hay workouts de test" /> : null}

      {workouts.length > 0 ? (
        <Card>
          <OptionSelector label="Workout" onChange={setSelectedWorkoutId} options={workouts.map((workout) => ({ label: workout.title, value: workout.id }))} value={selectedWorkoutId} />
          <OptionSelector
            label="Scope"
            onChange={setScope}
            options={[
              { label: "Gym", value: "GYM" },
              { label: "Global", value: "COMMUNITY" },
            ]}
            value={scope}
          />
          <OptionSelector
            label="Scale"
            onChange={setScaleCode}
            options={[
              { label: "RX", value: "RX" },
              { label: "SCALED", value: "SCALED" },
            ]}
            value={scaleCode}
          />
          <OptionSelector
            label="Period"
            onChange={setPeriod}
            options={[
              { label: "All Time", value: "ALL_TIME" },
              { label: "30d", value: "D30" },
            ]}
            value={period}
          />

          <Text style={uiStyles.mutedText}>{isFetching ? "Actualizando..." : `Mi posicion: ${leaderboard?.myRank ?? "N/A"}`}</Text>

          {(leaderboard?.entries ?? []).map((entry) => (
            <View key={entry.athleteId} style={uiStyles.tableRow}>
              <Text style={uiStyles.tableRank}>#{entry.rank} </Text>
              <Text style={uiStyles.tableName}>{entry.displayName}</Text>
              <Text style={uiStyles.tableScore}>{entry.bestScoreNorm.toFixed(2)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
