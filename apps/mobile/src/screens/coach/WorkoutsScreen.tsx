import type { MovementDTO, WorkoutDefinitionSummaryDTO, WorkoutType, WorkoutVisibility } from "@packages/types";
import { colors, spacing, typography } from "@packages/ui-tokens";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
import { extractErrorMessage } from "../../lib/session";
import type { ProtectedScreenProps } from "../../navigation/types";

export function WorkoutsScreen({ onLogout, email }: ProtectedScreenProps) {
  const [workouts, setWorkouts] = useState<WorkoutDefinitionSummaryDTO[]>([]);
  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [title, setTitle] = useState("Base Test");
  const [description, setDescription] = useState("Single block workout");
  const [type, setType] = useState<WorkoutType>("AMRAP");
  const [visibility, setVisibility] = useState<WorkoutVisibility>("GYMS_ONLY");
  const [isTest, setIsTest] = useState<"true" | "false">("true");
  const [movementId, setMovementId] = useState("");
  const [reps, setReps] = useState("20");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [workoutData, movementData] = await Promise.all([mobileApi.listWorkouts(), mobileApi.listMovements()]);
    setWorkouts(workoutData);
    setMovements(movementData);
    setMovementId((current) => current || movementData[0]?.id || "");
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadData();
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
  }, [loadData]);

  const onCreate = useCallback(async () => {
    if (!movementId) {
      setError("Selecciona un movimiento");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await mobileApi.request("/coach/workouts", {
        method: "POST",
        body: {
          title,
          description,
          isTest: isTest === "true",
          type,
          visibility,
          scales: [
            { code: "RX", label: "RX", notes: "", referenceLoads: {} },
            { code: "SCALED", label: "Scaled", notes: "", referenceLoads: {} },
          ],
          blocks: [
            {
              ord: 1,
              name: "Main",
              blockType: "WORK",
              repeatInt: 1,
              movements: [
                {
                  ord: 1,
                  movementId,
                  reps: Number(reps),
                  loadRule: "ATHLETE_CHOICE",
                  notes: "",
                },
              ],
            },
          ],
        },
      });
      setMessage("Workout creado");
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [description, isTest, loadData, movementId, reps, title, type, visibility]);

  const onPublish = useCallback(
    async (workoutId: string) => {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      try {
        await mobileApi.request(`/coach/workouts/${workoutId}/publish`, { method: "POST" });
        setMessage("Workout publicado");
        await loadData();
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadData]
  );

  return (
    <ScreenContainer>
      <ScreenHeader title="WorkoutsScreen" subtitle={email ?? undefined} onLogout={onLogout} />

      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <InlineError message={error} />
      <InlineSuccess message={message} />

      <Card>
        <Text style={{ color: colors.foreground, fontSize: typography.md, fontWeight: "700" }}>Crear workout</Text>

        <View>
          <Label>Title</Label>
          <FieldInput value={title} onChangeText={setTitle} />
        </View>

        <View>
          <Label>Description</Label>
          <FieldInput multiline value={description} onChangeText={setDescription} />
        </View>

        <OptionSelector
          label="Type"
          onChange={setType}
          options={[
            { label: "AMRAP", value: "AMRAP" },
            { label: "EMOM", value: "EMOM" },
            { label: "FORTIME", value: "FORTIME" },
            { label: "INTERVALS", value: "INTERVALS" },
            { label: "BLOCKS", value: "BLOCKS" },
          ]}
          value={type}
        />

        <OptionSelector
          label="Visibility"
          onChange={setVisibility}
          options={[
            { label: "COMMUNITY", value: "COMMUNITY" },
            { label: "GYMS_ONLY", value: "GYMS_ONLY" },
          ]}
          value={visibility}
        />

        <OptionSelector
          label="isTest"
          onChange={setIsTest}
          options={[
            { label: "true", value: "true" },
            { label: "false", value: "false" },
          ]}
          value={isTest}
        />

        {movements.length > 0 ? (
          <OptionSelector
            label="Movement"
            onChange={setMovementId}
            options={movements.slice(0, 12).map((movement) => ({ label: movement.name, value: movement.id }))}
            value={movementId || movements[0].id}
          />
        ) : null}

        <View>
          <Label>Reps</Label>
          <FieldInput keyboardType="numeric" value={reps} onChangeText={setReps} />
        </View>

        <AppButton disabled={isSubmitting} label={isSubmitting ? "Guardando..." : "Crear workout"} onPress={() => void onCreate()} />
      </Card>

      {workouts.length === 0 && !isLoading ? <EmptyState message="Sin workouts" /> : null}

      {workouts.length > 0 ? (
        <Card>
          <Text style={{ color: colors.foreground, fontSize: typography.md, fontWeight: "700" }}>Lista workouts</Text>
          {workouts.map((workout) => (
            <View key={workout.id} style={{ borderBottomColor: colors.border, borderBottomWidth: 1, gap: spacing.xs, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.foreground, fontSize: typography.md, fontWeight: "700" }}>{workout.title}</Text>
              <Text style={{ color: colors.muted, fontSize: typography.sm }}>
                {workout.type} | {workout.visibility}
              </Text>
              <AppButton disabled={isSubmitting} label="Publicar" onPress={() => void onPublish(workout.id)} variant="secondary" />
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
