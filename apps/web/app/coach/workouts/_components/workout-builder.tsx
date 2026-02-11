"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BlockType,
  CapacityType,
  LoadRule,
  MovementDTO,
  MovementPattern,
  ScaleCode,
  ScoreType,
  WorkoutType,
  WorkoutUpsertRequestDTO,
  WorkoutVisibility,
} from "@packages/types";

import { ErrorState, LoadingState } from "@/components/state-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { webApi } from "@/lib/sdk";

type BuilderMode = "create" | "edit";

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
};

const CAPACITY_TYPES: CapacityType[] = ["STRENGTH", "MUSCULAR_ENDURANCE", "RELATIVE_STRENGTH", "WORK_CAPACITY"];
const SCORE_TYPES: ScoreType[] = ["REPS", "METERS", "TIME", "ROUNDS_METERS"];
const WORKOUT_TYPES: WorkoutType[] = ["AMRAP", "EMOM", "FORTIME", "INTERVALS", "BLOCKS"];
const PATTERNS: Array<MovementPattern | "ALL"> = ["ALL", "SQUAT", "HINGE", "PUSH", "PULL", "CARRY", "CORE", "LOCOMOTION", "OTHER"];

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultScales(): Record<ScaleCode, ScaleState> {
  return {
    RX: { enabled: true, label: "RX", notes: "", referenceLoadsText: "{}" },
    SCALED: { enabled: true, label: "Scaled", notes: "", referenceLoadsText: "{}" },
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

function durationSeconds(blocks: BuilderBlock[]): number {
  return blocks.reduce((sum, block) => sum + (block.timeSeconds ?? block.capSeconds ?? 0) * block.repeatInt, 0);
}

function isPressEmom(blocks: BuilderBlock[]): boolean {
  if (blocks.length !== 20) return false;
  const ordered = [...blocks].sort((a, b) => a.ord - b.ord);
  return ordered.every((block, index) => {
    const shouldWork = index % 2 === 0;
    if (block.blockType !== (shouldWork ? "WORK" : "REST")) return false;
    if (block.timeSeconds !== 60 || block.repeatInt !== 1) return false;
    if (shouldWork && block.movements.length < 1) return false;
    if (!shouldWork && block.movements.length > 0) return false;
    return true;
  });
}

export function WorkoutBuilder({ mode, workoutId }: BuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [title, setTitle] = useState("Nuevo Test");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkoutType>("AMRAP");
  const [visibility, setVisibility] = useState<WorkoutVisibility>("GYMS_ONLY");
  const [scoreType, setScoreType] = useState<ScoreType>("REPS");
  const [movementQuery, setMovementQuery] = useState("");
  const [pattern, setPattern] = useState<MovementPattern | "ALL">("ALL");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [scales, setScales] = useState<Record<ScaleCode, ScaleState>>(defaultScales);
  const [weights, setWeights] = useState<Record<CapacityType, number>>(defaultWeights);
  const [blocks, setBlocks] = useState<BuilderBlock[]>(defaultBlocks);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const movementData = await webApi.listMovements();
        if (!active) return;
        setMovements(movementData);

        if (mode === "edit" && workoutId) {
          const workout = await webApi.getWorkoutDetail(workoutId);
          if (!active) return;
          setTitle(workout.title);
          setDescription(workout.description);
          setType(workout.type);
          setVisibility(workout.visibility);
          setScoreType(workout.scoreType ?? "REPS");

          const nextScales = defaultScales();
          workout.scales.forEach((scale) => {
            nextScales[scale.code] = {
              enabled: true,
              label: scale.label,
              notes: scale.notes,
              referenceLoadsText: JSON.stringify(scale.referenceLoads ?? {}, null, 2),
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
          setBlocks(nextBlocks.length > 0 ? nextBlocks : defaultBlocks());
          setSelectedBlockId(nextBlocks[0]?.id ?? null);
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

  function updateBlock(blockId: string, updater: (block: BuilderBlock) => BuilderBlock) {
    setBlocks((previous) => previous.map((block) => (block.id === blockId ? updater(block) : block)));
  }

  function addBlock(blockType: BlockType) {
    setBlocks((previous) => [
      ...previous,
      {
        id: uid(),
        ord: previous.length + 1,
        name: blockType === "WORK" ? "Work" : "Rest",
        blockType,
        repeatInt: 1,
        timeSeconds: blockType === "REST" ? 60 : undefined,
        movements: [],
      },
    ]);
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
        const movementItem: BuilderMovement = {
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
        block.movements.push(movementItem);
        setSelectedBlockId(block.id);
        return [...previous, block];
      }

      return previous.map((block) => {
        if (block.id !== target.id) return block;
        const movementItem: BuilderMovement = {
          id: uid(),
          ord: block.movements.length + 1,
          movementId: movement.id,
          reps: movement.unitPrimary === "REPS" ? 10 : undefined,
          meters: movement.unitPrimary === "METERS" ? 100 : undefined,
          seconds: movement.unitPrimary === "SECONDS" ? 30 : undefined,
          calories: movement.unitPrimary === "CALORIES" ? 10 : undefined,
          loadRule: "ATHLETE_CHOICE",
          notes: "",
        };
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

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push("El titulo es obligatorio.");
    if (!scoreType) list.push("scoreType es obligatorio.");

    const enabledScales = Object.values(scales).filter((item) => item.enabled).length;
    if (enabledScales < 1) list.push("Debes activar al menos una escala.");

    const sum = CAPACITY_TYPES.reduce((acc, capacityType) => acc + weights[capacityType], 0);
    if (Math.abs(sum - 1) > 0.01) list.push(`capacityWeights debe sumar 1.00. Suma actual: ${sum.toFixed(2)}.`);

    if (blocks.length < 1) list.push("Debe existir al menos un bloque.");
    const ords = [...blocks].map((block) => block.ord).sort((a, b) => a - b);
    const expected = Array.from({ length: blocks.length }, (_, index) => index + 1);
    if (JSON.stringify(ords) !== JSON.stringify(expected)) list.push("ord de bloques debe ser consecutivo (1..n).");

    blocks.forEach((block) => {
      const movementOrds = [...block.movements].map((movement) => movement.ord).sort((a, b) => a - b);
      const expectedMovementOrds = Array.from({ length: block.movements.length }, (_, index) => index + 1);
      if (JSON.stringify(movementOrds) !== JSON.stringify(expectedMovementOrds)) {
        list.push(`Bloque ${block.ord}: ord de movimientos debe ser consecutivo.`);
      }
      if (block.blockType === "REST" && block.movements.length > 0) list.push(`Bloque ${block.ord}: REST no admite movimientos.`);
      if (block.blockType === "WORK" && block.movements.length < 1) list.push(`Bloque ${block.ord}: WORK requiere al menos un movimiento.`);
      if (block.blockType === "REST" && !block.timeSeconds) list.push(`Bloque ${block.ord}: REST requiere timeSeconds.`);
    });

    if (["AMRAP", "EMOM", "BLOCKS"].includes(type) && !(type === "EMOM" && isPressEmom(blocks)) && durationSeconds(blocks) !== 600) {
      list.push("Duracion de test debe ser 600s (excepto plantilla Press EMOM).");
    }

    return list;
  }, [title, scoreType, scales, weights, blocks, type]);

  function buildPayload(): WorkoutUpsertRequestDTO {
    const scaleValues = (Object.keys(scales) as ScaleCode[])
      .filter((code) => scales[code].enabled)
      .map((code) => {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(scales[code].referenceLoadsText || "{}");
        } catch {
          parsed = {};
        }
        return { code, label: scales[code].label, notes: scales[code].notes, referenceLoads: parsed };
      });

    return {
      title: title.trim(),
      description,
      isTest: true,
      type,
      visibility,
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

  function setTemplateWeights(values: Partial<Record<CapacityType, number>>) {
    setWeights({
      STRENGTH: values.STRENGTH ?? 0,
      MUSCULAR_ENDURANCE: values.MUSCULAR_ENDURANCE ?? 0,
      RELATIVE_STRENGTH: values.RELATIVE_STRENGTH ?? 0,
      WORK_CAPACITY: values.WORK_CAPACITY ?? 0,
    });
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

    if (template === "SQUAT") {
      const squat = get("Back Squat");
      if (!squat) return;
      setTitle("Test Squat");
      setDescription("Test de squat 10min");
      setType("AMRAP");
      setScoreType("REPS");
      setTemplateWeights({ STRENGTH: 0.4, MUSCULAR_ENDURANCE: 0.6 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: squat.id, reps: 8, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
      return;
    }

    if (template === "PRESS_EMOM") {
      const press = get("DB Push Press");
      if (!press) return;
      setTitle("Test Press EMOM");
      setDescription("WORK/REST 60s alternado");
      setType("EMOM");
      setScoreType("REPS");
      setTemplateWeights({ STRENGTH: 0.3, MUSCULAR_ENDURANCE: 0.7 });
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
          movements: work ? [{ id: uid(), ord: 1, movementId: press.id, reps: 8, loadRule: "ATHLETE_CHOICE", notes: "" }] : [],
        });
      }
      setBlocks(nextBlocks);
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
      setTemplateWeights({ STRENGTH: 0.6, WORK_CAPACITY: 0.4 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: deadlift.id, reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: farmer.id, meters: 80, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
      return;
    }

    if (template === "PULL") {
      const pull = get("Pull-up strict");
      const hollow = get("Hollow Hold");
      if (!pull || !hollow) return;
      setTitle("Test Pull");
      setDescription("Pull + core");
      setType("AMRAP");
      setScoreType("REPS");
      setTemplateWeights({ RELATIVE_STRENGTH: 0.8, MUSCULAR_ENDURANCE: 0.2 });
      setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: pull.id, reps: 6, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: hollow.id, seconds: 30, loadRule: "FIXED", notes: "" }] }]);
      return;
    }

    const farmer = get("Farmer Carry");
    const sled = get("Sled Push");
    if (!farmer || !sled) return;
    setTitle("Test Farmer + Sled");
    setDescription("Capacidad de trabajo");
    setType("BLOCKS");
    setScoreType("METERS");
    setTemplateWeights({ WORK_CAPACITY: 0.8, MUSCULAR_ENDURANCE: 0.2 });
    setBlocks([{ id: uid(), ord: 1, name: "Main", blockType: "WORK", repeatInt: 1, timeSeconds: 600, movements: [{ id: uid(), ord: 1, movementId: farmer.id, meters: 100, loadRule: "ATHLETE_CHOICE", notes: "" }, { id: uid(), ord: 2, movementId: sled.id, meters: 60, loadRule: "ATHLETE_CHOICE", notes: "" }] }]);
  }

  async function save(publish: boolean) {
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      const response = mode === "edit" && workoutId ? await webApi.updateWorkout(workoutId, payload) : await webApi.createWorkout(payload);
      if (publish) await webApi.publishWorkout(response.id);
      router.push(`/coach/workouts?notice=${encodeURIComponent(publish ? "Workout guardado y publicado" : "Workout guardado")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar workout");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Cargando builder..." />;
  }

  if (error && movements.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Movements</CardTitle>
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
          <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="rounded-md border p-2 text-sm">
                <p className="font-medium">{movement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {movement.pattern} / {movement.unitPrimary}
                </p>
                  <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => addMovementToSelectedBlock(movement)}>
                    Anadir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-6">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Crear Test" : "Editar Test"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={type} onChange={(event) => setType(event.target.value as WorkoutType)}>
              {WORKOUT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select value={visibility} onChange={(event) => setVisibility(event.target.value as WorkoutVisibility)}>
              <option value="COMMUNITY">COMMUNITY</option>
              <option value="GYMS_ONLY">GYMS_ONLY</option>
            </Select>
            <Select value={scoreType} onChange={(event) => setScoreType(event.target.value as ScoreType)}>
              {SCORE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p>
              is_test: <strong>true</strong>
            </p>
            <p>
              Duracion objetivo tests: <strong>10:00</strong> (excepto Press EMOM 20 bloques)
            </p>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-semibold">Scales</p>
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
                <Input value={scales[code].label} onChange={(event) => setScales((previous) => ({ ...previous, [code]: { ...previous[code], label: event.target.value } }))} />
                <Input value={scales[code].notes} onChange={(event) => setScales((previous) => ({ ...previous, [code]: { ...previous[code], notes: event.target.value } }))} />
                <Textarea value={scales[code].referenceLoadsText} onChange={(event) => setScales((previous) => ({ ...previous, [code]: { ...previous[code], referenceLoadsText: event.target.value } }))} />
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addBlock("WORK")}>
                + WORK
              </Button>
              <Button size="sm" variant="outline" onClick={() => addBlock("REST")}>
                + REST
              </Button>
            </div>
            {blocks
              .slice()
              .sort((a, b) => a.ord - b.ord)
              .map((block) => (
                <div key={block.id} className={`space-y-2 rounded border p-2 ${selectedBlockId === block.id ? "border-primary" : ""}`}>
                  <div className="grid gap-2 md:grid-cols-5" onClick={() => setSelectedBlockId(block.id)}>
                    <Input value={String(block.ord)} disabled />
                    <Input value={block.name} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, name: event.target.value }))} />
                    <Select value={block.blockType} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, blockType: event.target.value as BlockType, movements: event.target.value === "REST" ? [] : prev.movements, timeSeconds: event.target.value === "REST" ? prev.timeSeconds ?? 60 : prev.timeSeconds }))}>
                      <option value="WORK">WORK</option>
                      <option value="REST">REST</option>
                    </Select>
                    <Input type="number" min={1} value={block.repeatInt} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, repeatInt: Number(event.target.value || 1) }))} />
                    <Input type="number" min={1} value={block.timeSeconds ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, timeSeconds: event.target.value ? Number(event.target.value) : undefined }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, -1)}>
                      Up
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, 1)}>
                      Down
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeBlock(block.id)}>
                      Eliminar
                    </Button>
                  </div>
                  {block.blockType === "WORK"
                    ? block.movements.map((movement) => (
                        <div key={movement.id} className="space-y-2 rounded border p-2 text-sm">
                          <p>{movements.find((item) => item.id === movement.movementId)?.name ?? movement.movementId}</p>
                          <div className="grid gap-2 md:grid-cols-4">
                            <Input type="number" placeholder="reps" value={movement.reps ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, reps: event.target.value ? Number(event.target.value) : undefined } : item)) }))} />
                            <Input type="number" placeholder="meters" value={movement.meters ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, meters: event.target.value ? Number(event.target.value) : undefined } : item)) }))} />
                            <Input type="number" placeholder="seconds" value={movement.seconds ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, seconds: event.target.value ? Number(event.target.value) : undefined } : item)) }))} />
                            <Input type="number" placeholder="calories" value={movement.calories ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, calories: event.target.value ? Number(event.target.value) : undefined } : item)) }))} />
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <Select value={movement.loadRule} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, loadRule: event.target.value as LoadRule } : item)) }))}>
                              <option value="FIXED">FIXED</option>
                              <option value="ATHLETE_CHOICE">ATHLETE_CHOICE</option>
                              <option value="SCALE_REFERENCE">SCALE_REFERENCE</option>
                            </Select>
                            <Input type="number" placeholder="boxHeightCm" value={movement.boxHeightCm ?? ""} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, boxHeightCm: event.target.value ? Number(event.target.value) : undefined } : item)) }))} />
                            <Input placeholder="notes" value={movement.notes} onChange={(event) => updateBlock(block.id, (prev) => ({ ...prev, movements: prev.movements.map((item) => (item.id === movement.id ? { ...item, notes: event.target.value } : item)) }))} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => moveMovement(block.id, movement.id, -1)}>
                              Up
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => moveMovement(block.id, movement.id, 1)}>
                              Down
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeMovement(block.id, movement.id)}>
                              Eliminar movimiento
                            </Button>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Validation + Weights + Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded border p-3">
            <p className="text-sm font-semibold">Errores</p>
            {errors.length === 0 ? (
              <p className="text-sm text-emerald-700">Sin errores de validacion.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                {errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 rounded border p-3">
            <p className="text-sm font-semibold">Capacity weights</p>
            {CAPACITY_TYPES.map((capacityType) => (
              <div key={capacityType} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{capacityType}</span>
                  <span>{weights[capacityType].toFixed(2)}</span>
                </div>
                <input
                  className="w-full"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights[capacityType]}
                  onChange={(event) =>
                    setWeights((previous) => ({
                      ...previous,
                      [capacityType]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Suma: {CAPACITY_TYPES.reduce((sum, capacityType) => sum + weights[capacityType], 0).toFixed(2)}
            </p>
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
            <Button disabled={saving} onClick={() => void save(false)}>
              {saving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button disabled={saving} onClick={() => void save(true)}>
              {saving ? "Guardando..." : "Guardar y Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
