import { describe, expect, it } from "vitest";

import { QUICK_START_TEMPLATE_STATE, resolveTemplateMovements } from "@/app/coach/workouts/_components/workout-template";

const MOVEMENTS = [
  { id: "m1", name: "Back Squat" },
  { id: "m2", name: "DB Push Press" },
  { id: "m3", name: "Deadlift" },
  { id: "m4", name: "Farmer Carry" },
  { id: "m5", name: "Pull-up strict" },
  { id: "m6", name: "Hollow Hold" },
  { id: "m7", name: "Sled Push" },
] as const;

describe("quick start template mappings", () => {
  it("defines step-1 metadata and step-2 blocks for each template", () => {
    for (const [template, state] of Object.entries(QUICK_START_TEMPLATE_STATE)) {
      expect(state.title.length).toBeGreaterThan(0);
      expect(state.type).toBeTruthy();
      expect(state.blocks.length).toBeGreaterThan(0);
      expect(state.blocks.some((block) => block.blockType === "WORK")).toBe(true);

      for (const block of state.blocks) {
        expect(block.repeatInt).toBeGreaterThan(0);
        if (block.blockType === "WORK") {
          expect(block.movements.length).toBeGreaterThan(0);
        }
      }

      const resolution = resolveTemplateMovements(template as keyof typeof QUICK_START_TEMPLATE_STATE, [...MOVEMENTS]);
      expect(resolution.missing).toEqual([]);
    }
  });

  it("reports missing catalog movement ids", () => {
    const partialCatalog = MOVEMENTS.filter((movement) => movement.name !== "Sled Push");
    const resolution = resolveTemplateMovements("FARMER_SLED", partialCatalog);
    expect(resolution.missing).toEqual(["Sled Push"]);
  });
});
