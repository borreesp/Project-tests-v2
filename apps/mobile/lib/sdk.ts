import { MobileTokenStorage, createApi } from "@packages/sdk";

const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const baseUrl = normalizedBaseUrl.endsWith("/api/v1") ? normalizedBaseUrl : `${normalizedBaseUrl}/api/v1`;

export const mobileTokenStorage = new MobileTokenStorage();

export const mobileApi = createApi({
  baseUrl,
  storage: mobileTokenStorage,
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
