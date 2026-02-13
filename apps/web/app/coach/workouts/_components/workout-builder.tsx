"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  BlockType,
  CapacityType,
  IdealScoreGetResponse,
  LoadRule,
  MovementDTO,
  MovementPattern,
  ScaleCode,
  ScoreType,
  UserRole,
  WorkoutType,
  WorkoutUpsertRequestDTO,
  WorkoutVisibility,
} from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { HelpTooltip, LabelWithHelp } from "@/components/help-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HELP } from "@/content/help-text";
import { webApi } from "@/lib/sdk";

type BuilderMode = "create" | "edit";
type BuilderStep = 1 | 2 | 3;
type PublishScope = "COMMUNITY" | "GYM";
type ReferenceMode = "SIMPLE" | "ADVANCED";

type BuilderProps = {
  mode: BuilderMode;
  workoutId?: string;
};

type BuilderMovement = {
  id: string;
  ord: number;
  movementId: string;
  reps?: number;
  meters?: number;
  seconds?: number;
  calories?: number;
  loadRule: LoadRule;
  notes: string;
  boxHeightCm?: number;
};

type BuilderBlock = {
  id: string;
  ord: number;
  name: string;
  blockType: BlockType;
  repeatInt: number;
  timeSeconds?: number;
  capSeconds?: number;
  movements: BuilderMovement[];
};

type ScaleState = {
  enabled: boolean;
  label: string;
  notes: string;
  referenceLoadsText: string;
  simpleLoads: SimpleReferenceLoads;
};

type SimpleReferenceLoads = {
  rx_male: string;
  rx_female: string;
  scaled_male: string;
  scaled_female: string;
};

type ValidationIssue = {
  id: string;
  message: string;
  step: BuilderStep;
  critical: boolean;
};

const CAPACITY_TYPES: CapacityType[] = ["STRENGTH", "MUSCULAR_ENDURANCE", "RELATIVE_STRENGTH", "WORK_CAPACITY"];
const SCORE_TYPES: ScoreType[] = ["REPS", "METERS", "TIME", "ROUNDS_METERS"];
const WORKOUT_TYPES: WorkoutType[] = ["AMRAP", "EMOM", "FORTIME", "INTERVALS", "BLOCKS"];
const PATTERNS: Array<MovementPattern | "ALL"> = ["ALL", "SQUAT", "HINGE", "PUSH", "PULL", "CARRY", "CORE", "LOCOMOTION", "OTHER"];

const SCORE_TYPE_BY_WORKOUT_TYPE: Record<WorkoutType, ScoreType> = {
  AMRAP: "REPS",
  EMOM: "REPS",
  FORTIME: "TIME",
  INTERVALS: "REPS",
  BLOCKS: "REPS",
};

const CAPACITY_LABELS: Record<CapacityType, string> = {
  STRENGTH: "Fuerza",
  MUSCULAR_ENDURANCE: "Resistencia muscular",
  RELATIVE_STRENGTH: "Fuerza relativa",
  WORK_CAPACITY: "Work Capacity",
};

const WEIGHT_PRESETS: Array<{ id: string; label: string; values: Record<CapacityType, number> }> = [
  {
    id: "strength",
    label: "Fuerza",
    values: { STRENGTH: 0.7, MUSCULAR_ENDURANCE: 0.3, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0 },
  },
  {
    id: "muscular_endurance",
    label: "Resistencia muscular",
    values: { STRENGTH: 0.3, MUSCULAR_ENDURANCE: 0.7, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0 },
  },
  {
    id: "relative_strength",
    label: "Fuerza relativa",
    values: { STRENGTH: 0, MUSCULAR_ENDURANCE: 0.2, RELATIVE_STRENGTH: 0.8, WORK_CAPACITY: 0 },
  },
  {
    id: "work_capacity",
    label: "Work Capacity",
    values: { STRENGTH: 0, MUSCULAR_ENDURANCE: 0.2, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0.8 },
  },
  {
    id: "balanced",
    label: "Balanceado",
    values: { STRENGTH: 0.25, MUSCULAR_ENDURANCE: 0.25, RELATIVE_STRENGTH: 0.25, WORK_CAPACITY: 0.25 },
  },
];

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptySimpleLoads(): SimpleReferenceLoads {
  return {
    rx_male: "",
    rx_female: "",
    scaled_male: "",
    scaled_female: "",
  };
}

function referenceFromSimple(simpleLoads: SimpleReferenceLoads): Record<string, number> {
  const output: Record<string, number> = {};
  for (const [key, value] of Object.entries(simpleLoads)) {
    if (value.trim() === "") continue;
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      output[key] = numberValue;
    }
  }
  return output;
}

function simpleFromReference(referenceLoads: Record<string, unknown>): SimpleReferenceLoads {
  const template = emptySimpleLoads();
  const keys = Object.keys(template) as Array<keyof SimpleReferenceLoads>;
  for (const key of keys) {
    const value = referenceLoads[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      template[key] = String(value);
    }
  }
  return template;
}

function parseJsonObject(text: string): { value: Record<string, unknown> | null; error: string | null } {
  try {
    const parsed = JSON.parse(text || "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { value: null, error: "Debe ser un objeto JSON." };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch {
    return { value: null, error: "JSON invalido." };
  }
}

function defaultScales(): Record<ScaleCode, ScaleState> {
  const simple = emptySimpleLoads();
  return {
    RX: {
      enabled: true,
      label: "RX",
      notes: "",
      referenceLoadsText: JSON.stringify(referenceFromSimple(simple), null, 2),
      simpleLoads: simple,
    },
    SCALED: {
      enabled: true,
      label: "Scaled",
      notes: "",
      referenceLoadsText: JSON.stringify(referenceFromSimple(simple), null, 2),
      simpleLoads: simple,
    },
  };
}

function defaultWeights(): Record<CapacityType, number> {
  return {
    STRENGTH: 0.25,
    MUSCULAR_ENDURANCE: 0.25,
    RELATIVE_STRENGTH: 0.25,
    WORK_CAPACITY: 0.25,
  };
}

function defaultBlocks(): BuilderBlock[] {
  return [{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [] }];
}

function renumberBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.map((block, index) => ({ ...block, ord: index + 1 }));
}

function renumberMovements(movements: BuilderMovement[]): BuilderMovement[] {
  return movements.map((movement, index) => ({ ...movement, ord: index + 1 }));
}

function isConsecutive(values: number[]): boolean {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.every((value, index) => value === index + 1);
}

function parseNumberInput(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function makeMovementEntry(movement: MovementDTO): BuilderMovement {
  return {
    id: uid(),
    ord: 1,
    movementId: movement.id,
    reps: movement.unitPrimary === "REPS" ? 10 : undefined,
    meters: movement.unitPrimary === "METERS" ? 100 : undefined,
    seconds: movement.unitPrimary === "SECONDS" ? 30 : undefined,
    calories: movement.unitPrimary === "CALORIES" ? 10 : undefined,
    loadRule: "ATHLETE_CHOICE",
    notes: "",
  };
}

function pickTemplateMovement(mapByName: Map<string, MovementDTO>, fallbackList: MovementDTO[]): MovementDTO | null {
  return mapByName.get("db push press") ?? fallbackList[0] ?? null;
}

export function WorkoutBuilder({ mode, workoutId }: BuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(searchParams.get("notice"));

  const [step, setStep] = useState<BuilderStep>(1);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishScope, setPublishScope] = useState<PublishScope>("GYM");

  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [title, setTitle] = useState("Nuevo Test");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkoutType>("AMRAP");
  const [visibility, setVisibility] = useState<WorkoutVisibility>("GYMS_ONLY");
  const [scoreType, setScoreType] = useState<ScoreType>(SCORE_TYPE_BY_WORKOUT_TYPE.AMRAP);
  const [scoreTypeOverridden, setScoreTypeOverridden] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"" | "SQUAT" | "PRESS_EMOM" | "DEADLIFT_FARMER" | "PULL" | "FARMER_SLED">("");
  const [movementQuery, setMovementQuery] = useState("");
  const [pattern, setPattern] = useState<MovementPattern | "ALL">("ALL");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [usedEmomGenerator, setUsedEmomGenerator] = useState(false);

  const [referenceMode, setReferenceMode] = useState<ReferenceMode>("SIMPLE");
  const [scales, setScales] = useState<Record<ScaleCode, ScaleState>>(defaultScales);
  const [weights, setWeights] = useState<Record<CapacityType, number>>(defaultWeights);
  const [blocks, setBlocks] = useState<BuilderBlock[]>(defaultBlocks);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [gymIdealTargetId, setGymIdealTargetId] = useState("");
  const [idealGymEntries, setIdealGymEntries] = useState<IdealScoreGetResponse["gyms"]>([]);
  const [idealError, setIdealError] = useState<string | null>(null);
  const [idealSaving, setIdealSaving] = useState(false);
  const [communityIdealScore, setCommunityIdealScore] = useState("");
  const [communityIdealNotes, setCommunityIdealNotes] = useState("");
  const [gymIdealScore, setGymIdealScore] = useState("");
  const [gymIdealNotes, setGymIdealNotes] = useState("");

  useEffect(() => {
    setNotice(searchParams.get("notice"));
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadIdealScores(targetWorkoutId: string, currentRole: UserRole | null, targetGymId: string | null) {
      const response = await webApi.getIdealScores(targetWorkoutId);
      if (!active) return;

      setIdealGymEntries(response.gyms);
      setCommunityIdealScore(response.community ? String(response.community.idealScoreBase) : "");
      setCommunityIdealNotes(response.community?.notes ?? "");

      const nextTargetGymId = targetGymId ?? (currentRole === "ADMIN" ? response.gyms[0]?.gymId ?? "" : "");
      setGymIdealTargetId(nextTargetGymId);
      const targetGym = response.gyms.find((item) => item.gymId === nextTargetGymId);
      setGymIdealScore(targetGym ? String(targetGym.idealScoreBase) : "");
      setGymIdealNotes(targetGym?.notes ?? "");
    }

    async function load() {
      try {
        const [movementData, me] = await Promise.all([webApi.listMovements(), webApi.me()]);
        if (!active) return;
        setMovements(movementData);
        setUserRole(me.role);

        let coachGymId: string | null = null;
        if (me.role === "COACH") {
          const overview = await webApi.coachOverview();
          if (!active) return;
          coachGymId = overview.gymId !== "ALL" ? overview.gymId : null;
        }
        setMyGymId(coachGymId);
        if (coachGymId) {
          setGymIdealTargetId(coachGymId);
        }

        if (mode === "edit" && workoutId) {
          const workout = await webApi.getWorkoutDetail(workoutId);
          if (!active) return;
          setTitle(workout.title);
          setDescription(workout.description);
          setType(workout.type);
          setVisibility(workout.visibility);
          const defaultScoreType = SCORE_TYPE_BY_WORKOUT_TYPE[workout.type];
          const incomingScoreType = workout.scoreType ?? defaultScoreType;
          setScoreType(incomingScoreType);
          setScoreTypeOverridden(incomingScoreType !== defaultScoreType);

          const nextScales = defaultScales();
          workout.scales.forEach((scale) => {
            const reference = scale.referenceLoads ?? {};
            nextScales[scale.code] = {
              enabled: true,
              label: scale.label,
              notes: scale.notes,
              referenceLoadsText: JSON.stringify(reference, null, 2),
              simpleLoads: simpleFromReference(reference),
            };
          });
          setScales(nextScales);

          const nextWeights = defaultWeights();
          workout.capacityWeights?.forEach((item) => {
            nextWeights[item.capacityType] = item.weight;
          });
          setWeights(nextWeights);

          const nextBlocks: BuilderBlock[] = workout.blocks
            .slice()
            .sort((a, b) => a.ord - b.ord)
            .map((block) => ({
              id: uid(),
              ord: block.ord,
              name: block.name,
              blockType: block.blockType,
              repeatInt: block.repeatInt,
              timeSeconds: block.timeSeconds,
              capSeconds: block.capSeconds,
              movements: block.movements
                .slice()
                .sort((a, b) => a.ord - b.ord)
                .map((movement) => ({
                  id: uid(),
                  ord: movement.ord,
                  movementId: movement.movement.id,
                  reps: movement.reps,
                  meters: movement.meters,
                  seconds: movement.seconds,
                  calories: movement.calories,
                  loadRule: movement.loadRule,
                  notes: movement.notes,
                  boxHeightCm: movement.boxHeightCm,
                })),
            }));
          const normalizedBlocks = nextBlocks.length > 0 ? renumberBlocks(nextBlocks) : defaultBlocks();
          setBlocks(normalizedBlocks);
          setSelectedBlockId(normalizedBlocks.find((item) => item.blockType === "WORK")?.id ?? null);

          await loadIdealScores(workoutId, me.role, coachGymId);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el builder");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [mode, workoutId]);

  useEffect(() => {
    setSelectedBlockId((previous) => {
      if (previous && blocks.some((block) => block.id === previous && block.blockType === "WORK")) {
        return previous;
      }
      return blocks.find((block) => block.blockType === "WORK")?.id ?? null;
    });
  }, [blocks]);

  const filteredMovements = useMemo(() => {
    const query = movementQuery.trim().toLowerCase();
    return movements.filter((movement) => {
      if (pattern !== "ALL" && movement.pattern !== pattern) return false;
      if (!query) return true;
      return movement.name.toLowerCase().includes(query);
    });
  }, [movements, movementQuery, pattern]);

  const movementByName = useMemo(() => {
    const map = new Map<string, MovementDTO>();
    movements.forEach((movement) => map.set(movement.name.toLowerCase(), movement));
    return map;
  }, [movements]);

  const sumWeights = useMemo(
    () => CAPACITY_TYPES.reduce((sum, capacityType) => sum + weights[capacityType], 0),
    [weights]
  );

  const impactSummary = useMemo(() => {
    const sorted = [...CAPACITY_TYPES].sort((a, b) => weights[b] - weights[a]);
    const top = sorted[0];
    const second = sorted[1];

    if (!top || weights[top] <= 0) {
      return "Principalmente afecta a: sin definir";
    }
    if (!second || weights[second] <= 0) {
      return `Principalmente afecta a: ${CAPACITY_LABELS[top]}`;
    }

    return `Principalmente afecta a: ${CAPACITY_LABELS[top]} (+${CAPACITY_LABELS[second]})`;
  }, [weights]);

  function setScoreTypeFromType(nextType: WorkoutType) {
    setType(nextType);
    if (!scoreTypeOverridden) {
      setScoreType(SCORE_TYPE_BY_WORKOUT_TYPE[nextType]);
    }
  }

  function changeScoreType(nextScoreType: ScoreType) {
    setScoreType(nextScoreType);
    setScoreTypeOverridden(true);
  }

  function setScaleSimpleValue(code: ScaleCode, key: keyof SimpleReferenceLoads, value: string) {
    setScales((previous) => {
      const scale = previous[code];
      const nextSimple = { ...scale.simpleLoads, [key]: value };
      return {
        ...previous,
        [code]: {
          ...scale,
          simpleLoads: nextSimple,
          referenceLoadsText: JSON.stringify(referenceFromSimple(nextSimple), null, 2),
        },
      };
    });
  }

  function switchReferenceMode(nextMode: ReferenceMode) {
    if (nextMode === referenceMode) return;

    if (nextMode === "SIMPLE") {
      setScales((previous) => {
        const next = { ...previous };
        for (const code of Object.keys(next) as ScaleCode[]) {
          const parsed = parseJsonObject(next[code].referenceLoadsText);
          if (parsed.value) {
            next[code] = {
              ...next[code],
              simpleLoads: simpleFromReference(parsed.value),
            };
          }
        }
        return next;
      });
    }

    setReferenceMode(nextMode);
  }

  function updateBlock(blockId: string, updater: (block: BuilderBlock) => BuilderBlock) {
    setBlocks((previous) => previous.map((block) => (block.id === blockId ? updater(block) : block)));
  }

  function addBlock(blockType: BlockType) {
    const block: BuilderBlock = {
      id: uid(),
      ord: blocks.length + 1,
      name: blockType === "WORK" ? "Work" : "Rest",
      blockType,
      repeatInt: 1,
      timeSeconds: blockType === "REST" ? 60 : undefined,
      movements: [],
    };
    setBlocks((previous) => [...previous, block]);
    if (blockType === "WORK") {
      setSelectedBlockId(block.id);
    }
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    setBlocks((previous) => {
      const index = previous.findIndex((item) => item.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return renumberBlocks(next);
    });
  }

  function removeBlock(blockId: string) {
    setBlocks((previous) => renumberBlocks(previous.filter((item) => item.id !== blockId)));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  function addMovementToSelectedBlock(movement: MovementDTO) {
    setBlocks((previous) => {
      const target = previous.find((block) => block.id === selectedBlockId && block.blockType === "WORK");
      if (!target) {
        const block: BuilderBlock = {
          id: uid(),
          ord: previous.length + 1,
          name: "Work",
          blockType: "WORK",
          repeatInt: 1,
          timeSeconds: 600,
          movements: [],
        };
        const movementItem: BuilderMovement = { ...makeMovementEntry(movement), ord: 1 };
        block.movements.push(movementItem);
        setSelectedBlockId(block.id);
        return [...previous, block];
      }

      return previous.map((block) => {
        if (block.id !== target.id) return block;
        const movementItem: BuilderMovement = { ...makeMovementEntry(movement), ord: block.movements.length + 1 };
        return { ...block, movements: [...block.movements, movementItem] };
      });
    });
  }

  function moveMovement(blockId: string, movementId: string, direction: -1 | 1) {
    updateBlock(blockId, (block) => {
      const index = block.movements.findIndex((movement) => movement.id === movementId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= block.movements.length) return block;
      const next = [...block.movements];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...block, movements: renumberMovements(next) };
    });
  }

  function removeMovement(blockId: string, movementId: string) {
    updateBlock(blockId, (block) => ({
      ...block,
      movements: renumberMovements(block.movements.filter((movement) => movement.id !== movementId)),
    }));
  }

  const validationIssues = useMemo(() => {
    const issues: ValidationIssue[] = [];

    if (!title.trim()) {
      issues.push({ id: "title", message: "Title es obligatorio.", step: 1, critical: true });
    }
    if (!scoreType) {
      issues.push({ id: "score_type", message: "ScoreType es obligatorio.", step: 1, critical: true });
    }

    const enabledScaleCodes = (Object.keys(scales) as ScaleCode[]).filter((code) => scales[code].enabled);
    if (enabledScaleCodes.length < 1) {
      issues.push({ id: "scales", message: "Debes activar al menos una escala.", step: 1, critical: true });
    }

    if (referenceMode === "ADVANCED") {
      enabledScaleCodes.forEach((code) => {
        const parsed = parseJsonObject(scales[code].referenceLoadsText);
        if (parsed.error) {
          issues.push({
            id: `scale_json_${code}`,
            message: `JSON avanzado invalido en ${code}.`,
            step: 1,
            critical: true,
          });
        }
      });
    }

    if (!blocks.some((block) => block.blockType === "WORK")) {
      issues.push({ id: "work_block", message: "Debe existir al menos un bloque WORK.", step: 2, critical: true });
    }
    if (!isConsecutive(blocks.map((block) => block.ord))) {
      issues.push({ id: "block_ord", message: "Bloques con ord no consecutivo.", step: 2, critical: true });
    }

    blocks.forEach((block) => {
      if (!isConsecutive(block.movements.map((movement) => movement.ord))) {
        issues.push({
          id: `movement_ord_${block.id}`,
          message: `Bloque ${block.ord}: movimientos con ord no consecutivo.`,
          step: 2,
          critical: true,
        });
      }
      if (block.blockType === "REST" && block.movements.length > 0) {
        issues.push({
          id: `rest_has_movements_${block.id}`,
          message: `Bloque ${block.ord}: REST no admite movimientos.`,
          step: 2,
          critical: true,
        });
      }
      if (block.blockType === "WORK" && block.movements.length < 1) {
        issues.push({
          id: `work_missing_movements_${block.id}`,
          message: `Bloque ${block.ord}: WORK requiere al menos un movimiento.`,
          step: 2,
          critical: true,
        });
      }
    });

    if (Math.abs(sumWeights - 1) > 0.01) {
      issues.push({
        id: "capacity_sum",
        message: `capacityWeights debe sumar 1.00 (+/-0.01). Actual: ${sumWeights.toFixed(2)}.`,
        step: 3,
        critical: true,
      });
    }

    return issues;
  }, [title, scoreType, scales, blocks, referenceMode, sumWeights]);

  const criticalIssues = useMemo(() => validationIssues.filter((issue) => issue.critical), [validationIssues]);

  function buildPayload(scopeOverride?: PublishScope): WorkoutUpsertRequestDTO {
    const scaleValues = (Object.keys(scales) as ScaleCode[])
      .filter((code) => scales[code].enabled)
      .map((code) => {
        const parsed = parseJsonObject(scales[code].referenceLoadsText || "{}");
        if (!parsed.value || parsed.error) {
          throw new Error(`Escala ${code}: ${parsed.error ?? "JSON invalido."}`);
        }
        return { code, label: scales[code].label, notes: scales[code].notes, referenceLoads: parsed.value };
      });

    return {
      title: title.trim(),
      description,
      isTest: true,
      type,
      visibility: scopeOverride === "COMMUNITY" ? "COMMUNITY" : scopeOverride === "GYM" ? "GYMS_ONLY" : visibility,
      scoreType,
      scales: scaleValues,
      blocks: blocks
        .slice()
        .sort((a, b) => a.ord - b.ord)
        .map((block) => ({
          ord: block.ord,
          name: block.name,
          blockType: block.blockType,
          repeatInt: block.repeatInt,
          timeSeconds: block.timeSeconds,
          capSeconds: block.capSeconds,
          movements: block.movements
            .slice()
            .sort((a, b) => a.ord - b.ord)
            .map((movement) => ({
              ord: movement.ord,
              movementId: movement.movementId,
              reps: movement.reps,
              meters: movement.meters,
              seconds: movement.seconds,
              calories: movement.calories,
              loadRule: movement.loadRule,
              notes: movement.notes,
              boxHeightCm: movement.boxHeightCm,
            })),
        })),
      capacityWeights: CAPACITY_TYPES.map((capacityType) => ({
        capacityType,
        weight: Number(weights[capacityType].toFixed(2)),
      })),
    };
  }

  function applyWeightsPreset(values: Partial<Record<CapacityType, number>>) {
    setWeights({
      STRENGTH: values.STRENGTH ?? 0,
      MUSCULAR_ENDURANCE: values.MUSCULAR_ENDURANCE ?? 0,
      RELATIVE_STRENGTH: values.RELATIVE_STRENGTH ?? 0,
      WORK_CAPACITY: values.WORK_CAPACITY ?? 0,
    });
  }

  function generateEmom10() {
    const defaultMovement = pickTemplateMovement(movementByName, movements);
    const nextBlocks: BuilderBlock[] = [];
    for (let i = 1; i <= 20; i += 1) {
      const work = i % 2 === 1;
      nextBlocks.push({
        id: uid(),
        ord: i,
        name: work ? `Work ${Math.ceil(i / 2)}` : `Rest ${Math.ceil(i / 2)}`,
        blockType: work ? "WORK" : "REST",
        repeatInt: 1,
        timeSeconds: 60,
        movements:
          work && defaultMovement
            ? [{ ...makeMovementEntry(defaultMovement), ord: 1, reps: defaultMovement.unitPrimary === "REPS" ? 8 : undefined }]
            : [],
      });
    }
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks.find((block) => block.blockType === "WORK")?.id ?? null);
    setUsedEmomGenerator(true);
  }

  function applyTemplate(template: "SQUAT" | "PRESS_EMOM" | "DEADLIFT_FARMER" | "PULL" | "FARMER_SLED") {
    const get = (name: string) => movementByName.get(name.toLowerCase()) ?? null;
    const required: Record<typeof template, string[]> = {
      SQUAT: ["Back Squat"],
      PRESS_EMOM: ["DB Push Press"],
      DEADLIFT_FARMER: ["Deadlift", "Farmer Carry"],
      PULL: ["Pull-up strict", "Hollow Hold"],
      FARMER_SLED: ["Farmer Carry", "Sled Push"],
    };
    const missing = required[template].filter((name) => !get(name));
    if (missing.length > 0) {
      setError(`Faltan movimientos para plantilla: ${missing.join(", ")}`);
      return;
    }

    setSelectedTemplate(template);
    setError(null);
    setVisibility("GYMS_ONLY");

    if (template === "SQUAT") {
      const squat = get("Back Squat");
      if (!squat) return;
      setTitle("Test Squat");
      setDescription("Test de squat 10min");
      setType("AMRAP");
      setScoreType(SCORE_TYPE_BY_WORKOUT_TYPE.AMRAP);
      setScoreTypeOverridden(false);
      applyWeightsPreset({ STRENGTH: 0.4, MUSCULAR_ENDURANCE: 0.6 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: squat.id, reps: 8, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
      setStep(2);
      return;
    }

    if (template === "PRESS_EMOM") {
      setTitle("Test Press EMOM");
      setDescription("WORK/REST 60s alternado");
      setType("EMOM");
      setScoreType(SCORE_TYPE_BY_WORKOUT_TYPE.EMOM);
      setScoreTypeOverridden(false);
      applyWeightsPreset({ STRENGTH: 0.3, MUSCULAR_ENDURANCE: 0.7 });
      generateEmom10();
      setStep(2);
      return;
    }

    if (template === "DEADLIFT_FARMER") {
      const deadlift = get("Deadlift");
      const farmer = get("Farmer Carry");
      if (!deadlift || !farmer) return;
      setTitle("Test Deadlift + Farmer");
      setDescription("Combinado fuerza/capacidad");
      setType("BLOCKS");
      setScoreType("METERS");
      setScoreTypeOverridden(true);
      applyWeightsPreset({ STRENGTH: 0.6, WORK_CAPACITY: 0.4 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: deadlift.id, reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: farmer.id, meters: 80, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
      setStep(2);
      return;
    }

    if (template === "PULL") {
      const pull = get("Pull-up strict");
      const hollow = get("Hollow Hold");
      if (!pull || !hollow) return;
      setTitle("Test Pull");
      setDescription("Pull + core");
      setType("AMRAP");
      setScoreType(SCORE_TYPE_BY_WORKOUT_TYPE.AMRAP);
      setScoreTypeOverridden(false);
      applyWeightsPreset({ RELATIVE_STRENGTH: 0.8, MUSCULAR_ENDURANCE: 0.2 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: pull.id, reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: hollow.id, seconds: 30, loadRule: "FIXED", notes: "" }] }]);
      setStep(2);
      return;
    }

    const farmer = get("Farmer Carry");
    const sled = get("Sled Push");
    if (!farmer || !sled) return;
    setTitle("Test Farmer + Sled");
    setDescription("Capacidad de trabajo");
    setType("BLOCKS");
    setScoreType("METERS");
    setScoreTypeOverridden(true);
    applyWeightsPreset({ WORK_CAPACITY: 0.8, MUSCULAR_ENDURANCE: 0.2 });
    setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: farmer.id, meters: 100, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: sled.id, meters: 60, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
    setStep(2);
  }

  async function save(publish: boolean, scope: PublishScope = "GYM") {
    if (criticalIssues.length > 0) {
      const first = criticalIssues[0];
      setStep(first.step);
      setError(first.message);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(publish ? scope : undefined);
      const response = mode === "edit" && workoutId ? await webApi.updateWorkout(workoutId, payload) : await webApi.createWorkout(payload);
      if (publish) await webApi.publishWorkout(response.id);
      router.push(`/coach/workouts?notice=${encodeURIComponent(publish ? "Test guardado y publicado" : "Test guardado como borrador")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar test");
    } finally {
      setSaving(false);
      setPublishModalOpen(false);
    }
  }

  async function refreshIdealScores() {
    if (!workoutId) return;
    const response = await webApi.getIdealScores(workoutId);
    setIdealGymEntries(response.gyms);
    setCommunityIdealScore(response.community ? String(response.community.idealScoreBase) : "");
    setCommunityIdealNotes(response.community?.notes ?? "");

    const targetGym = response.gyms.find((item) => item.gymId === gymIdealTargetId);
    setGymIdealScore(targetGym ? String(targetGym.idealScoreBase) : "");
    setGymIdealNotes(targetGym?.notes ?? "");
  }

  async function saveCommunityIdeal() {
    if (!workoutId) {
      setIdealError("Guarda el test antes de configurar ideal scores.");
      return;
    }
    if (userRole !== "ADMIN") {
      setIdealError("Solo admin puede editar ideal global.");
      return;
    }
    const value = Number(communityIdealScore);
    if (!Number.isFinite(value) || value <= 0) {
      setIdealError("Ideal global debe ser > 0.");
      return;
    }

    setIdealSaving(true);
    setIdealError(null);
    try {
      await webApi.setCommunityIdealScore(workoutId, { idealScoreBase: value, notes: communityIdealNotes });
      await refreshIdealScores();
    } catch (err) {
      setIdealError(err instanceof Error ? err.message : "No se pudo guardar ideal global.");
    } finally {
      setIdealSaving(false);
    }
  }

  async function saveGymIdeal() {
    if (!workoutId) {
      setIdealError("Guarda el test antes de configurar ideal scores.");
      return;
    }
    if (!gymIdealTargetId.trim()) {
      setIdealError("Debes indicar gymId.");
      return;
    }
    const value = Number(gymIdealScore);
    if (!Number.isFinite(value) || value <= 0) {
      setIdealError("Ideal gym debe ser > 0.");
      return;
    }

    setIdealSaving(true);
    setIdealError(null);
    try {
      await webApi.setGymIdealScore(workoutId, gymIdealTargetId.trim(), { idealScoreBase: value, notes: gymIdealNotes });
      await refreshIdealScores();
    } catch (err) {
      setIdealError(err instanceof Error ? err.message : "No se pudo guardar ideal gym.");
    } finally {
      setIdealSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando builder..." />;
  }

  if (error && movements.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="py-3 text-sm text-emerald-900">{notice}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Crear Test" : "Editar Test"}</CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3].map((value) => {
              const current = value as BuilderStep;
              return (
                <Button key={value} type="button" variant={step === current ? "default" : "outline"} onClick={() => setStep(current)}>
                  Paso {value}
                </Button>
              );
            })}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>INPUT · Movements Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Buscar movement..." value={movementQuery} onChange={(event) => setMovementQuery(event.target.value)} />
          <Select value={pattern} onChange={(event) => setPattern(event.target.value as MovementPattern | "ALL")}>
            {PATTERNS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            {step === 2
              ? "Selecciona un bloque WORK y pulsa Anadir para insertar movimientos."
              : "El editor de movimientos se utiliza en el Paso 2 (Estructura)."}
          </p>
          <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="rounded-md border p-2 text-sm">
                <p className="font-medium">{movement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {movement.pattern} / {movement.unitPrimary}
                </p>
                  <Button className="mt-2 w-full" size="sm" variant="outline" disabled={step !== 2} onClick={() => addMovementToSelectedBlock(movement)}>
                    Anadir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>TRANSFORM · Configuración y lógica de transformación</CardTitle>
          <p className="text-sm text-muted-foreground">Ideal scores, pesos de capacidades, escalado y parámetros internos.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <LabelWithHelp label="Plantilla (Quick start)" help={HELP.workoutBuilder.template} />
                <Select
                  value={selectedTemplate}
                  onChange={(event) => {
                    const value = event.target.value as "" | "SQUAT" | "PRESS_EMOM" | "DEADLIFT_FARMER" | "PULL" | "FARMER_SLED";
                    setSelectedTemplate(value);
                    if (value) applyTemplate(value);
                  }}
                >
                  <option value="">Seleccionar plantilla...</option>
                  <option value="SQUAT">Squat</option>
                  <option value="PRESS_EMOM">Press EMOM</option>
                  <option value="DEADLIFT_FARMER">Deadlift + Farmer</option>
                  <option value="PULL">Pull</option>
                  <option value="FARMER_SLED">Farmer + Sled</option>
                </Select>
              </div>

              <div className="space-y-2">
                <LabelWithHelp label="Title" help={HELP.workoutBuilder.title} />
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <LabelWithHelp label="Description" help={HELP.workoutBuilder.description} />
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <LabelWithHelp label="Workout Type" help={HELP.workoutBuilder.workoutType} />
                  <Select value={type} onChange={(event) => setScoreTypeFromType(event.target.value as WorkoutType)}>
                    {WORKOUT_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <LabelWithHelp label="ScoreType" help={HELP.workoutBuilder.scoreType} />
                  <Select value={scoreType} onChange={(event) => changeScoreType(event.target.value as ScoreType)}>
                    {SCORE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <LabelWithHelp label="Visibility" help={HELP.workoutBuilder.visibility} />
                  <Select value={visibility} onChange={(event) => setVisibility(event.target.value as WorkoutVisibility)}>
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="GYMS_ONLY">GYMS_ONLY</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <LabelWithHelp label="Duration" help={HELP.workoutBuilder.duration} />
                  <Input value="10:00" readOnly />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p>
                  is_test: <strong>true</strong>
                </p>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Scales</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={referenceMode === "SIMPLE" ? "default" : "outline"} onClick={() => switchReferenceMode("SIMPLE")}>
                      Modo simple
                    </Button>
                    <Button type="button" size="sm" variant={referenceMode === "ADVANCED" ? "default" : "outline"} onClick={() => switchReferenceMode("ADVANCED")}>
                      Modo avanzado JSON
                    </Button>
                  </div>
                </div>
                {(Object.keys(scales) as ScaleCode[]).map((code) => (
                  <div key={code} className="space-y-2 rounded border p-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={scales[code].enabled}
                        onChange={(event) =>
                          setScales((previous) => ({
                            ...previous,
                            [code]: { ...previous[code], enabled: event.target.checked },
                          }))
                        }
                      />
                      {code}
                    </label>
                    <Input
                      value={scales[code].label}
                      onChange={(event) => setScales((previous) => ({ ...previous, [code]: { ...previous[code], label: event.target.value } }))}
                    />
                    <Input
                      value={scales[code].notes}
                      onChange={(event) => setScales((previous) => ({ ...previous, [code]: { ...previous[code], notes: event.target.value } }))}
                    />
                    {referenceMode === "SIMPLE" ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input placeholder="rx_male" value={scales[code].simpleLoads.rx_male} onChange={(event) => setScaleSimpleValue(code, "rx_male", event.target.value)} />
                        <Input placeholder="rx_female" value={scales[code].simpleLoads.rx_female} onChange={(event) => setScaleSimpleValue(code, "rx_female", event.target.value)} />
                        <Input placeholder="scaled_male" value={scales[code].simpleLoads.scaled_male} onChange={(event) => setScaleSimpleValue(code, "scaled_male", event.target.value)} />
                        <Input placeholder="scaled_female" value={scales[code].simpleLoads.scaled_female} onChange={(event) => setScaleSimpleValue(code, "scaled_female", event.target.value)} />
                      </div>
                    ) : (
                      <Textarea
                        value={scales[code].referenceLoadsText}
                        onChange={(event) =>
                          setScales((previous) => ({ ...previous, [code]: { ...previous[code], referenceLoadsText: event.target.value } }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => addBlock("WORK")}>
                  + WORK
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("REST")}>
                  + REST
                </Button>
                {type === "EMOM" ? (
                  <Button size="sm" variant="outline" onClick={generateEmom10}>
                    Generar EMOM 10&apos; (WORK/REST)
                  </Button>
                ) : null}
              </div>
              {blocks
                .slice()
                .sort((a, b) => a.ord - b.ord)
                .map((block) => (
                  <div key={block.id} className={`space-y-2 rounded border p-2 ${selectedBlockId === block.id ? "border-primary" : ""}`}>
                    <div className="grid gap-2 md:grid-cols-6" onClick={() => setSelectedBlockId(block.blockType === "WORK" ? block.id : selectedBlockId)}>
                      <Input value={String(block.ord)} disabled />
                      <Input value={block.name} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, name: event.target.value }))} />
                      <Select value={block.blockType} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, blockType: event.target.value as BlockType, movements: event.target.value === "REST" ? [] : prev.movements, timeSeconds: event.target.value === "REST" ? prev.timeSeconds ?? 60 : prev.timeSeconds }))}>
                        <option value="WORK">WORK</option>
                        <option value="REST">REST</option>
                      </Select>
                      <Input type="number" min={1} value={block.repeatInt} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, repeatInt: Number(event.target.value || 1) }))} />
                      <Input aria-label="time_seconds" title={HELP.workoutBuilder.timeSeconds} type="number" min={1} placeholder="time_seconds" value={block.timeSeconds ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, timeSeconds: parseNumberInput(event.target.value) }))} />
                      <Input aria-label="cap_seconds" title={HELP.workoutBuilder.capSeconds} type="number" min={1} placeholder="cap_seconds" value={block.capSeconds ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, capSeconds: parseNumberInput(event.target.value) }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, -1)}>
                        ↑
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, 1)}>
                        ↓
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeBlock(block.id)}>
                        Eliminar
                      </Button>
                    </div>
                    {block.blockType === "WORK"
                      ? block.movements.map((movement) => {
                          const movementMeta = movements.find((item) => item.id === movement.movementId);
                          const showBox = (movementMeta?.name.toLowerCase().includes("box") ?? false) || movementMeta?.pattern === "LOCOMOTION";
                          return (
                            <div key={movement.id} className="space-y-2 rounded border p-2 text-sm">
                              <p>{movementMeta?.name ?? movement.movementId}</p>
                              <div className="grid gap-2 md:grid-cols-4">
                                <Input aria-label="reps" title={HELP.workoutBuilder.reps} type="number" placeholder="reps" value={movement.reps ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, reps: parseNumberInput(event.target.value) } : item)) }))} />
                                <Input aria-label="meters" title={HELP.workoutBuilder.meters} type="number" placeholder="meters" value={movement.meters ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, meters: parseNumberInput(event.target.value) } : item)) }))} />
                                <Input aria-label="seconds" title={HELP.workoutBuilder.seconds} type="number" placeholder="seconds" value={movement.seconds ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, seconds: parseNumberInput(event.target.value) } : item)) }))} />
                                <Input aria-label="calories" title={HELP.workoutBuilder.calories} type="number" placeholder="calories" value={movement.calories ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, calories: parseNumberInput(event.target.value) } : item)) }))} />
                              </div>
                              <div className="grid gap-2 md:grid-cols-3">
                                <Select title={HELP.workoutBuilder.loadRule} value={movement.loadRule} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, loadRule: event.target.value as LoadRule } : item)) }))}>
                                  <option value="FIXED">FIXED</option>
                                  <option value="ATHLETE_CHOICE">ATHLETE_CHOICE</option>
                                  <option value="SCALE_REFERENCE">SCALE_REFERENCE</option>
                                </Select>
                                {showBox ? (
                                  <Input aria-label="boxHeightCm" title={HELP.workoutBuilder.boxHeightCm} type="number" placeholder="boxHeightCm" value={movement.boxHeightCm ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, boxHeightCm: parseNumberInput(event.target.value) } : item)) }))} />
                                ) : (
                                  <Input value="N/A" readOnly />
                                )}
                                <Input title={HELP.workoutBuilder.notes} placeholder="notes" value={movement.notes} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, notes: event.target.value } : item)) }))} />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => moveMovement(block.id, movement.id, -1)}>
                                  ↑
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => moveMovement(block.id, movement.id, 1)}>
                                  ↓
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => removeMovement(block.id, movement.id)}>
                                  Eliminar movimiento
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      : null}
                  </div>
                ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded border p-3">
                <p className="flex items-center gap-1 text-sm font-semibold">Capacity Weights <HelpTooltip content={HELP.athleteMetrics.trends30d} title="Ayuda: Capacity weights" /></p>
                <div className="grid gap-2 md:grid-cols-2">
                  {WEIGHT_PRESETS.map((preset) => (
                    <Button key={preset.id} type="button" variant="outline" size="sm" onClick={() => applyWeightsPreset(preset.values)}>
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm font-medium">{impactSummary}</p>
              </div>

              <div className="space-y-3 rounded border p-3">
                <p className="text-sm font-semibold">Ideal Global (Community)</p>
                {userRole === "ADMIN" ? (
                  <>
                    <Input type="number" min={0} step={0.01} value={communityIdealScore} onChange={(event) => setCommunityIdealScore(event.target.value)} />
                    <Textarea value={communityIdealNotes} onChange={(event) => setCommunityIdealNotes(event.target.value)} />
                    <Button type="button" size="sm" disabled={idealSaving} onClick={() => void saveCommunityIdeal()}>
                      Guardar ideal global
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Solo admin</p>
                )}
              </div>

              <div className="space-y-3 rounded border p-3">
                <p className="text-sm font-semibold">Ideal de mi gimnasio</p>
                {userRole === "ADMIN" ? (
                  <Input value={gymIdealTargetId} onChange={(event) => setGymIdealTargetId(event.target.value)} placeholder="gymId" />
                ) : (
                  <Input value={myGymId ?? "Sin gym"} readOnly />
                )}
                {idealGymEntries.length > 0 ? (
                  <Select
                    value={gymIdealTargetId}
                    onChange={(event) => {
                      const selected = event.target.value;
                      setGymIdealTargetId(selected);
                      const match = idealGymEntries.find((item) => item.gymId === selected);
                      setGymIdealScore(match ? String(match.idealScoreBase) : "");
                      setGymIdealNotes(match?.notes ?? "");
                    }}
                  >
                    <option value="">Seleccionar gym con ideal guardado</option>
                    {idealGymEntries.map((entry) => (
                      <option key={entry.gymId} value={entry.gymId}>
                        {entry.gymName}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Input type="number" min={0} step={0.01} value={gymIdealScore} onChange={(event) => setGymIdealScore(event.target.value)} />
                <Textarea value={gymIdealNotes} onChange={(event) => setGymIdealNotes(event.target.value)} />
                <Button type="button" size="sm" disabled={idealSaving} onClick={() => void saveGymIdeal()}>
                  Guardar ideal gym
                </Button>
              </div>
              {idealError ? <p className="text-sm text-destructive">{idealError}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>OUTPUT · Validación y preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-semibold">Preview de capacidades (placeholder)</p>
            <p className="text-sm text-muted-foreground">Aquí se mostrará el resultado final Input → Transform → Output con capacidades estimadas por atleta y por escala.</p>
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p>• STRENGTH: pendiente</p>
              <p>• MUSCULAR_ENDURANCE: pendiente</p>
              <p>• RELATIVE_STRENGTH: pendiente</p>
              <p>• WORK_CAPACITY: pendiente</p>
            </div>
          </div>
          <div className="space-y-2 rounded border p-3">
            <p className="text-sm font-semibold">Errores accionables</p>
            {validationIssues.length === 0 ? (
              <p className="text-sm text-emerald-700">Sin errores de validacion.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {validationIssues.map((issue) => (
                  <li key={issue.id} className="rounded border border-destructive/30 p-2">
                    <p className="text-destructive">{issue.message}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setStep(issue.step)}>
                      Ir a Step {issue.step}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {type === "EMOM" ? (
              <p className="text-xs text-muted-foreground">
                {usedEmomGenerator ? "EMOM 10' generado." : "Puedes generar EMOM 10' en el Paso 2."}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 rounded border p-3">
            <Button variant="outline" onClick={() => applyTemplate("SQUAT")}>Squat</Button>
            <Button variant="outline" onClick={() => applyTemplate("PRESS_EMOM")}>Press EMOM</Button>
            <Button variant="outline" onClick={() => applyTemplate("DEADLIFT_FARMER")}>Deadlift + Farmer</Button>
            <Button variant="outline" onClick={() => applyTemplate("PULL")}>Pull</Button>
            <Button variant="outline" onClick={() => applyTemplate("FARMER_SLED")}>Farmer + Sled</Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="grid gap-2">
            <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((previous) => (previous === 1 ? previous : ((previous - 1) as BuilderStep)))}>
              Paso anterior
            </Button>
            <Button type="button" variant="outline" disabled={step === 3} onClick={() => setStep((previous) => (previous === 3 ? previous : ((previous + 1) as BuilderStep)))}>
              Siguiente paso
            </Button>
          </div>

          <div className="grid gap-2">
            <Button disabled={saving} onClick={() => void save(false)}>
              {saving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button disabled={saving} onClick={() => setPublishModalOpen(true)}>
              {saving ? "Guardando..." : "Guardar y Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {publishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Publicar test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Selecciona el scope de publicacion.</p>
              <Select value={publishScope} onChange={(event) => setPublishScope(event.target.value as PublishScope)}>
                <option value="GYM">GYM</option>
                <option value="COMMUNITY">COMMUNITY</option>
              </Select>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPublishModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={saving} onClick={() => void save(true, publishScope)}>
                  Confirmar y publicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
