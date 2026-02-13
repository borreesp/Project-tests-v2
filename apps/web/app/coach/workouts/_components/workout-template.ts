import type { CapacityType, LoadRule, MovementDTO, ScoreType, WorkoutType } from "@packages/types";

export type QuickStartTemplate = "SQUAT" | "PRESS_EMOM" | "DEADLIFT_FARMER" | "PULL" | "FARMER_SLED";

type TemplateMovementDraft = {
  name: string;
  reps?: number;
  meters?: number;
  seconds?: number;
  calories?: number;
  loadRule: LoadRule;
  notes: string;
};

type TemplateBlockDraft = {
  name: string;
  blockType: "WORK" | "REST";
  repeatInt: number;
  timeSeconds?: number;
  movements: TemplateMovementDraft[];
};

export type QuickStartBuilderState = {
  title: string;
  description: string;
  type: WorkoutType;
  scoreType: ScoreType;
  scoreTypeOverridden: boolean;
  weights: Record<CapacityType, number>;
  blocks: TemplateBlockDraft[];
};

const SCORE_TYPE_BY_WORKOUT_TYPE: Record<WorkoutType, ScoreType> = {
  AMRAP: "REPS",
  EMOM: "REPS",
  FORTIME: "TIME",
  INTERVALS: "REPS",
  BLOCKS: "REPS",
};

const EMOM_10_BLOCKS: TemplateBlockDraft[] = Array.from({ length: 20 }, (_, index) => ({
  name: index % 2 === 0 ? `Work ${Math.floor(index / 2) + 1}` : `Rest ${Math.floor(index / 2) + 1}`,
  blockType: index % 2 === 0 ? "WORK" : "REST",
  repeatInt: 1,
  timeSeconds: 60,
  movements: index % 2 === 0 ? [{ name: "DB Push Press", reps: 8, loadRule: "ATHLETE_CHOICE", notes: "" }] : [],
}));

export const QUICK_START_TEMPLATE_STATE: Record<QuickStartTemplate, QuickStartBuilderState> = {
  SQUAT: {
    title: "Test Squat",
    description: "Test de squat 10min",
    type: "AMRAP",
    scoreType: SCORE_TYPE_BY_WORKOUT_TYPE.AMRAP,
    scoreTypeOverridden: false,
    weights: { STRENGTH: 0.4, MUSCULAR_ENDURANCE: 0.6, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0 },
    blocks: [
      {
        name: "Main",
        blockType: "WORK",
        repeatInt: 1,
        timeSeconds: 600,
        movements: [{ name: "Back Squat", reps: 8, loadRule: "ATHLETE_CHOICE", notes: "" }],
      },
    ],
  },
  PRESS_EMOM: {
    title: "Test Press EMOM",
    description: "WORK/REST 60s alternado",
    type: "EMOM",
    scoreType: SCORE_TYPE_BY_WORKOUT_TYPE.EMOM,
    scoreTypeOverridden: false,
    weights: { STRENGTH: 0.3, MUSCULAR_ENDURANCE: 0.7, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0 },
    blocks: EMOM_10_BLOCKS,
  },
  DEADLIFT_FARMER: {
    title: "Test Deadlift + Farmer",
    description: "Combinado fuerza/capacidad",
    type: "BLOCKS",
    scoreType: "METERS",
    scoreTypeOverridden: true,
    weights: { STRENGTH: 0.6, MUSCULAR_ENDURANCE: 0, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0.4 },
    blocks: [
      {
        name: "Main",
        blockType: "WORK",
        repeatInt: 1,
        timeSeconds: 600,
        movements: [
          { name: "Deadlift", reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" },
          { name: "Farmer Carry", meters: 80, loadRule: "ATHLETE_CHOICE", notes: "" },
        ],
      },
    ],
  },
  PULL: {
    title: "Test Pull",
    description: "Pull + core",
    type: "AMRAP",
    scoreType: SCORE_TYPE_BY_WORKOUT_TYPE.AMRAP,
    scoreTypeOverridden: false,
    weights: { STRENGTH: 0, MUSCULAR_ENDURANCE: 0.2, RELATIVE_STRENGTH: 0.8, WORK_CAPACITY: 0 },
    blocks: [
      {
        name: "Main",
        blockType: "WORK",
        repeatInt: 1,
        timeSeconds: 600,
        movements: [
          { name: "Pull-up strict", reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" },
          { name: "Hollow Hold", seconds: 30, loadRule: "FIXED", notes: "" },
        ],
      },
    ],
  },
  FARMER_SLED: {
    title: "Test Farmer + Sled",
    description: "Capacidad de trabajo",
    type: "BLOCKS",
    scoreType: "METERS",
    scoreTypeOverridden: true,
    weights: { STRENGTH: 0, MUSCULAR_ENDURANCE: 0.2, RELATIVE_STRENGTH: 0, WORK_CAPACITY: 0.8 },
    blocks: [
      {
        name: "Main",
        blockType: "WORK",
        repeatInt: 1,
        timeSeconds: 600,
        movements: [
          { name: "Farmer Carry", meters: 100, loadRule: "ATHLETE_CHOICE", notes: "" },
          { name: "Sled Push", meters: 60, loadRule: "ATHLETE_CHOICE", notes: "" },
        ],
      },
    ],
  },
};

export function resolveTemplateMovements(template: QuickStartTemplate, movements: Array<Pick<MovementDTO, "id" | "name">>): {
  missing: string[];
  movementByName: Map<string, Pick<MovementDTO, "id" | "name">>;
} {
  const movementByName = new Map<string, Pick<MovementDTO, "id" | "name">>();
  movements.forEach((movement) => movementByName.set(movement.name.toLowerCase(), movement));

  const required = QUICK_START_TEMPLATE_STATE[template].blocks.flatMap((block) => block.movements.map((movement) => movement.name));
  const missing = Array.from(new Set(required.filter((name) => !movementByName.get(name.toLowerCase()))));
  return { missing, movementByName };
}
