import type {
  AthleteDashboardDTO,
  AttemptDTO,
  CreateAttemptResponse,
  LeaderboardDTO,
  LoginRequest,
  LoginResponse,
  MovementDTO,
  RefreshRequest,
  RefreshResponse,
  ScaleCode,
  SubmitResultRequest,
  WorkoutDefinitionDetailDTO,
  WorkoutDefinitionSummaryDTO,
} from "@packages/types";

import { getTokens, setTokens } from "./auth";
import { createHttpClient } from "./http";
import type { TokenStorage } from "./storage";

type CreateApiOptions = {
  baseUrl: string;
  storage: TokenStorage;
  fetcher?: typeof fetch;
  endpoints?: Partial<ApiEndpoints>;
};

export type MeResponse = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type CreateAttemptRequest = {
  workoutId: string;
  assignmentId?: string;
  scaleCode: ScaleCode;
};

export type LeaderboardQuery = {
  workoutId: string;
  scaleCode: ScaleCode;
  scope: "COMMUNITY" | "GYM";
  period: "ALL_TIME" | "D30";
  gymId?: string;
};

export type CoachOverviewDTO = Record<string, unknown>;
export type CoachAthleteDTO = Record<string, unknown>;
export type CreateWorkoutRequest = Record<string, unknown>;
export type CreateWorkoutResponse = Record<string, unknown>;

type ApiEndpoints = {
  login: string;
  refresh: string;
  me: string;
  listMovements: string;
  listWorkouts: string;
  getWorkoutDetail: (workoutId: string) => string;
  createAttempt: string;
  submitResult: (attemptId: string) => string;
  athleteDashboard: string;
  leaderboard: string;
  coachOverview: string;
  coachAthletes: string;
  validateAttempt: (attemptId: string) => string;
  rejectAttempt: (attemptId: string) => string;
  createWorkout: string;
  publishWorkout: (workoutId: string) => string;
  deleteWorkout: (workoutId: string) => string;
};

const DEFAULT_ENDPOINTS: ApiEndpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  me: "/auth/me",
  listMovements: "/public/movements",
  listWorkouts: "/public/workouts",
  getWorkoutDetail: (workoutId) => `/public/workouts/${workoutId}`,
  createAttempt: "/athlete/attempts",
  submitResult: (attemptId) => `/athlete/attempts/${attemptId}/result`,
  athleteDashboard: "/athlete/dashboard",
  leaderboard: "/public/leaderboards",
  coachOverview: "/coach/overview",
  coachAthletes: "/coach/athletes",
  validateAttempt: (attemptId) => `/coach/attempts/${attemptId}/validate`,
  rejectAttempt: (attemptId) => `/coach/attempts/${attemptId}/reject`,
  createWorkout: "/coach/workouts",
  publishWorkout: (workoutId) => `/coach/workouts/${workoutId}/publish`,
  deleteWorkout: (workoutId) => `/coach/workouts/${workoutId}`,
};

export function createApi(options: CreateApiOptions) {
  const http = createHttpClient(options);
  const endpoints: ApiEndpoints = {
    ...DEFAULT_ENDPOINTS,
    ...options.endpoints,
  };

  return {
    request: http.request,

    async setTokens(accessToken: string, refreshToken: string): Promise<void> {
      await setTokens(options.storage, { accessToken, refreshToken });
    },

    async login(payload: LoginRequest): Promise<LoginResponse> {
      const response = await http.request<LoginResponse>(endpoints.login, {
        method: "POST",
        body: payload,
      });

      await setTokens(options.storage, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      return response;
    },

    async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
      const response = await http.request<RefreshResponse>(endpoints.refresh, {
        method: "POST",
        body: payload,
      });

      await options.storage.setTokens(response.accessToken, payload.refreshToken);
      return response;
    },

    async me(): Promise<MeResponse> {
      return http.request<MeResponse>(endpoints.me);
    },

    async listMovements(): Promise<MovementDTO[]> {
      return http.request<MovementDTO[]>(endpoints.listMovements);
    },

    async listWorkouts(): Promise<WorkoutDefinitionSummaryDTO[]> {
      return http.request<WorkoutDefinitionSummaryDTO[]>(endpoints.listWorkouts);
    },

    async getWorkoutDetail(workoutId: string): Promise<WorkoutDefinitionDetailDTO> {
      return http.request<WorkoutDefinitionDetailDTO>(endpoints.getWorkoutDetail(workoutId));
    },

    async createAttempt(payload: CreateAttemptRequest): Promise<CreateAttemptResponse> {
      return http.request<CreateAttemptResponse>(endpoints.createAttempt, {
        method: "POST",
        body: payload,
      });
    },

    async submitResult(attemptId: string, payload: SubmitResultRequest): Promise<AttemptDTO> {
      return http.request<AttemptDTO>(endpoints.submitResult(attemptId), {
        method: "POST",
        body: payload,
      });
    },

    async getAthleteDashboard(): Promise<AthleteDashboardDTO> {
      return http.request<AthleteDashboardDTO>(endpoints.athleteDashboard);
    },

    async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardDTO> {
      const params = new URLSearchParams({
        workoutId: query.workoutId,
        scaleCode: query.scaleCode,
        scope: query.scope,
        period: query.period,
      });

      if (query.gymId) {
        params.set("gymId", query.gymId);
      }

      return http.request<LeaderboardDTO>(`${endpoints.leaderboard}?${params.toString()}`);
    },

    async coachOverview(): Promise<CoachOverviewDTO> {
      return http.request<CoachOverviewDTO>(endpoints.coachOverview);
    },

    async coachAthletes(): Promise<CoachAthleteDTO[]> {
      return http.request<CoachAthleteDTO[]>(endpoints.coachAthletes);
    },

    async validateAttempt(attemptId: string): Promise<AttemptDTO> {
      return http.request<AttemptDTO>(endpoints.validateAttempt(attemptId), {
        method: "POST",
      });
    },

    async rejectAttempt(attemptId: string, reason: string): Promise<AttemptDTO> {
      return http.request<AttemptDTO>(endpoints.rejectAttempt(attemptId), {
        method: "POST",
        body: { reason },
      });
    },

    async createWorkout(payload: CreateWorkoutRequest): Promise<CreateWorkoutResponse> {
      return http.request<CreateWorkoutResponse>(endpoints.createWorkout, {
        method: "POST",
        body: payload,
      });
    },

    async publishWorkout(workoutId: string): Promise<WorkoutDefinitionSummaryDTO> {
      return http.request<WorkoutDefinitionSummaryDTO>(endpoints.publishWorkout(workoutId), {
        method: "POST",
      });
    },

    async deleteWorkout(workoutId: string): Promise<{ status: string }> {
      return http.request<{ status: string }>(endpoints.deleteWorkout(workoutId), {
        method: "DELETE",
      });
    },

    async getCurrentTokens() {
      return getTokens(options.storage);
    },
  };
}

export type ApiClient = ReturnType<typeof createApi>;
