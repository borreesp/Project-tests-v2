import { describe, expect, it, vi } from "vitest";

import { createApi } from "../src/api";
import { MemoryTokenStorage } from "../src/storage";

describe("web mapper contract against backend payload", () => {
  it("returns workout contract fields exactly as delivered by backend", async () => {
    const backendPayload = [
      {
        id: "wod-1",
        title: "Fran",
        isTest: true,
        type: "AMRAP",
        visibility: "PUBLIC",
        scoreType: "REPS",
        publishedAt: "2026-02-12T12:00:00Z",
      },
    ];

    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(backendPayload), { status: 200 }));

    const api = createApi({
      baseUrl: "http://localhost:8000/api/v1",
      storage: new MemoryTokenStorage(),
      fetcher,
    });

    const response = await api.listWorkouts();

    expect(response).toEqual(backendPayload);
    expect(response[0]).toMatchObject({
      id: backendPayload[0].id,
      scoreType: backendPayload[0].scoreType,
      isTest: backendPayload[0].isTest,
    });
  });

  it("does not recalculate dashboard capacity values and preserves backend computed fields", async () => {
    const backendPayload = {
      athleteId: "ath-1",
      gymId: "gym-1",
      level: 2,
      levelBand: "RISING",
      pulse: {
        value: 77,
        confidence: "HIGH",
        computedAt: "2026-02-12T12:00:00Z",
        explain: [{ key: "backend", message: "computed in backend" }],
      },
      capacities: [
        {
          type: "AEROBIC",
          value: 41.25,
          confidence: "MEDIUM",
          lastUpdatedAt: "2026-02-12T12:00:00Z",
          percentFill: 63,
        },
      ],
      counts: { tests7d: 1, tests30d: 4 },
      trends30d: [{ type: "AEROBIC", delta: -1.5 }],
    };

    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(backendPayload), { status: 200 }));

    const api = createApi({
      baseUrl: "http://localhost:8000/api/v1",
      storage: new MemoryTokenStorage(),
      fetcher,
    });

    const response = await api.getAthleteDashboard();

    expect(response).toEqual(backendPayload);
    expect(response.capacities[0]).toMatchObject({
      type: "AEROBIC",
      value: 41.25,
      percentFill: 63,
    });
  });
});
