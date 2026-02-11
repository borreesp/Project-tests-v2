import type { AttemptDTO, ScaleCode, WorkoutDefinitionDetailDTO, WorkoutDefinitionSummaryDTO, WorkoutType } from "@packages/types";
import { colors, radius, spacing, typography } from "@packages/ui-tokens";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import {
  AppButton,
  Card,
  EmptyState,
  FieldInput,
  InlineError,
  InlineSuccess,
  Label,
  OptionSelector,
  ScreenContainer,
  ScreenHeader,
} from "../../components/ui";
import { extractErrorMessage, isUnauthorizedError } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

type ResultType = "REPS" | "METERS" | "TIME" | "ROUNDS_METERS";

function allowedResultTypes(workoutType: WorkoutType | undefined): ResultType[] {
  if (workoutType === "AMRAP") return ["REPS", "METERS", "ROUNDS_METERS"];
  if (workoutType === "EMOM") return ["REPS"];
  if (workoutType === "FORTIME") return ["TIME"];
  return ["REPS", "METERS", "TIME", "ROUNDS_METERS"];
}

export function WorkoutsScreen({ onLogout, email }: ProtectedScreenProps) {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDefinitionDetailDTO | null>(null);
  const [scaleCode, setScaleCode] = useState<ScaleCode>("RX");
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [resultType, setResultType] = useState<ResultType>("REPS");
  const [repsTotal, setRepsTotal] = useState("");
  const [metersTotal, setMetersTotal] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [rounds, setRounds] = useState("");
  const [meters, setMeters] = useState("");
  const [loadKgTotal, setLoadKgTotal] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await mobileApi.listWorkouts();
        if (!active) return;
        setWorkouts(response);
        if (response.length > 0) {
          setSelectedWorkoutId((current) => current ?? response[0].id);
        }
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

  useEffect(() => {
    if (!selectedWorkoutId) {
      setSelectedWorkout(null);
      return;
    }
    const workoutId = selectedWorkoutId;

    let active = true;

    async function loadDetail() {
      setIsDetailLoading(true);
      setError(null);
      try {
        const detail = await mobileApi.getWorkoutDetail(workoutId);
        if (!active) return;
        setSelectedWorkout(detail);
        if (detail.scales.length > 0) {
          setScaleCode(detail.scales[0].code);
        }
        setAttemptId(null);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) {
          setIsDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedWorkoutId]);

  const resultTypeOptions = useMemo(() => allowedResultTypes(selectedWorkout?.type), [selectedWorkout?.type]);

  useEffect(() => {
    if (!resultTypeOptions.includes(resultType)) {
      setResultType(resultTypeOptions[0]);
    }
  }, [resultType, resultTypeOptions]);

  const onApply = useCallback(async () => {
    if (!selectedWorkoutId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await mobileApi.request<{ attemptId: string; status: string }>(`/athlete/workouts/${selectedWorkoutId}/attempt`, {
        method: "POST",
        body: { scaleCode },
      });
      setAttemptId(response.attemptId);
      setMessage(`Intento creado: ${response.attemptId}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [scaleCode, selectedWorkoutId]);

  const onSubmitResult = useCallback(async () => {
    if (!attemptId) {
      setError("Primero debes aplicar el workout");
      return;
    }

    const primaryResult: Record<string, unknown> = { type: resultType };

    if (resultType === "REPS") {
      if (!repsTotal) {
        setError("Ingresa repsTotal");
        return;
      }
      primaryResult.repsTotal = Number(repsTotal);
    }

    if (resultType === "METERS") {
      if (!metersTotal) {
        setError("Ingresa metersTotal");
        return;
      }
      primaryResult.metersTotal = Number(metersTotal);
    }

    if (resultType === "TIME") {
      if (!timeSeconds) {
        setError("Ingresa timeSeconds");
        return;
      }
      primaryResult.timeSeconds = Number(timeSeconds);
    }

    if (resultType === "ROUNDS_METERS") {
      if (!rounds || !meters) {
        setError("Ingresa rounds y meters");
        return;
      }
      primaryResult.rounds = Number(rounds);
      primaryResult.meters = Number(meters);
    }

    const inputs: Record<string, unknown> = {};
    if (loadKgTotal) {
      inputs.loadKgTotal = Number(loadKgTotal);
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await mobileApi.request<AttemptDTO>(`/athlete/attempts/${attemptId}/submit-result`, {
        method: "POST",
        body: {
          primaryResult,
          inputs,
        },
      });
      setMessage(`Resultado enviado. Estado: ${response.status}`);
      setAttemptId(null);
      setRepsTotal("");
      setMetersTotal("");
      setTimeSeconds("");
      setRounds("");
      setMeters("");
      setLoadKgTotal("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, loadKgTotal, meters, metersTotal, repsTotal, resultType, rounds, timeSeconds]);

  return (
    <ScreenContainer>
      <ScreenHeader title="WorkoutsScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <InlineError message={error} />
      <InlineSuccess message={message} />

      {workouts.length === 0 && !isLoading ? <EmptyState message="No hay workouts asignados" /> : null}

      {workouts.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Workouts asignados</Text>
          {workouts.map((workout) => (
            <View key={workout.id}>
              <AppButton label={workout.title} onPress={() => setSelectedWorkoutId(workout.id)} variant={selectedWorkoutId === workout.id ? "primary" : "secondary"} />
              <Text style={styles.itemMeta}>{workout.type} | {workout.visibility}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {isDetailLoading ? <ActivityIndicator color={colors.primary} /> : null}

      {selectedWorkout ? (
        <Card>
          <Text style={styles.sectionTitle}>{selectedWorkout.title}</Text>
          <Text style={styles.description}>{selectedWorkout.description || "Sin descripcion"}</Text>

          <OptionSelector
            label="Scale"
            onChange={setScaleCode}
            options={selectedWorkout.scales.map((scale) => ({ label: scale.code, value: scale.code }))}
            value={scaleCode}
          />

          <AppButton disabled={isSubmitting} label={attemptId ? "Intento activo" : "Aplicar"} onPress={() => void onApply()} />

          {selectedWorkout.blocks.map((block) => (
            <View key={block.id} style={styles.blockCard}>
              <Text style={styles.blockTitle}>Bloque {block.ord}: {block.name || block.blockType}</Text>
              <Text style={styles.blockMeta}>repeat={block.repeatInt}</Text>
              {block.movements.map((movement) => (
                <Text key={movement.id} style={styles.blockMovement}>
                  {movement.ord}. {movement.movement.name}
                  {movement.reps ? ` | reps ${movement.reps}` : ""}
                  {movement.meters ? ` | meters ${movement.meters}` : ""}
                  {movement.seconds ? ` | sec ${movement.seconds}` : ""}
                </Text>
              ))}
            </View>
          ))}

          <Text style={styles.sectionTitle}>Submit result</Text>

          <OptionSelector
            label="Result type"
            onChange={setResultType}
            options={resultTypeOptions.map((value) => ({ label: value, value }))}
            value={resultType}
          />

          {resultType === "REPS" ? (
            <View>
              <Label>repsTotal</Label>
              <FieldInput keyboardType="numeric" value={repsTotal} onChangeText={setRepsTotal} />
            </View>
          ) : null}

          {resultType === "METERS" ? (
            <View>
              <Label>metersTotal</Label>
              <FieldInput keyboardType="numeric" value={metersTotal} onChangeText={setMetersTotal} />
            </View>
          ) : null}

          {resultType === "TIME" ? (
            <View>
              <Label>timeSeconds</Label>
              <FieldInput keyboardType="numeric" value={timeSeconds} onChangeText={setTimeSeconds} />
            </View>
          ) : null}

          {resultType === "ROUNDS_METERS" ? (
            <>
              <View>
                <Label>rounds</Label>
                <FieldInput keyboardType="numeric" value={rounds} onChangeText={setRounds} />
              </View>
              <View>
                <Label>meters</Label>
                <FieldInput keyboardType="numeric" value={meters} onChangeText={setMeters} />
              </View>
            </>
          ) : null}

          <View>
            <Label>loadKgTotal (opcional)</Label>
            <FieldInput keyboardType="numeric" value={loadKgTotal} onChangeText={setLoadKgTotal} />
          </View>

          <AppButton disabled={isSubmitting} label="Enviar resultado" onPress={() => void onSubmitResult()} variant="secondary" />
        </Card>
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
  itemMeta: {
    color: colors.muted,
    fontSize: typography.xs,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  blockCard: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  blockTitle: {
    color: colors.foreground,
    fontSize: typography.sm,
    fontWeight: "700",
  },
  blockMeta: {
    color: colors.muted,
    fontSize: typography.xs,
  },
  blockMovement: {
    color: colors.foreground,
    fontSize: typography.sm,
  },
});
