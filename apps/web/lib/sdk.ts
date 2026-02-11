import { WebTokenStorage, createApi } from "@packages/sdk";

const rawBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const baseUrl = normalizedBaseUrl.endsWith("/api/v1") ? normalizedBaseUrl : `${normalizedBaseUrl}/api/v1`;

export const webTokenStorage = new WebTokenStorage();
export const webApi = createApi({
  baseUrl,
  storage: webTokenStorage,
  endpoints: {
    me: "/me",
    listMovements: "/movements",
    listWorkouts: "/workouts",
    getWorkoutDetail: (workoutId) => `/workouts/${workoutId}`,
    leaderboard: "/rankings",
    coachOverview: "/coach/overview",
    coachAthletes: "/coach/athletes",
  },
});
