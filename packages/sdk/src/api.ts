import type {
  AthleteDashboardDTO,
  AttemptDTO,
  CoachWorkoutSummaryDTO,
  CreateAttemptResponse,
  DuplicateWorkoutResponseDTO,
  IdealScoreGetResponse,
  IdealScoreUpsertRequest,
  LeaderboardDTO,
  LoginRequest,
  LoginResponse,
  MovementDTO,
  RefreshRequest,
  RefreshResponse,
  ScaleCode,
  SubmitResultRequest,
  UserRole,
  UserStatus,
  WorkoutDefinitionDetailDTO,
  WorkoutDefinitionSummaryDTO,
  WorkoutMutationResponseDTO,
  WorkoutUpsertRequestDTO,
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
  role: UserRole;
  status: UserStatus;
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
};

export type CoachOverviewDTO = {
  gymId: string;
  athletesCount: number;
  pendingSubmissions: number;
  validatedToday: number;
};

export type CoachAthleteDTO = {
  athleteId: string;
  userId: string;
  email: string;
  level: number;
  levelBand: string;
};

export type CoachAthleteDetailDTO = {
  athleteId: string;
  userId: string;
  email: string;
  gymId: string;
  level: number;
  levelBand: string;
  createdAt: string;
};

type ApiEndpoints = {
  login: string;
  refresh: string;
  me: string;
  listMovements: string;
  listWorkouts: string;
  getWorkoutDetail: (workoutId: string) => string;
  createAttempt: (workoutId: string) => string;
  submitResult: (attemptId: string) => string;
  athleteDashboard: string;
  leaderboard: string;
  coachOverview: string;
  coachAthletes: string;
  coachAthleteDetail: (athleteId: string) => string;
  coachWorkouts: string;
  validateAttempt: (attemptId: string) => string;
  rejectAttempt: (attemptId: string) => string;
  createWorkout: string;
  updateWorkout: (workoutId: string) => string;
  duplicateWorkout: (workoutId: string) => string;
  publishWorkout: (workoutId: string) => string;
  getIdealScores: (workoutId: string) => string;
  setCommunityIdealScore: (workoutId: string) => string;
  setGymIdealScore: (workoutId: string, gymId: string) => string;
};

const DEFAULT_ENDPOINTS: ApiEndpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  me: "/me",
  listMovements: "/movements",
  listWorkouts: "/workouts",
  getWorkoutDetail: (workoutId) => `/workouts/${workoutId}`,
  createAttempt: (workoutId) => `/athlete/workouts/${workoutId}/attempt`,
  submitResult: (attemptId) => `/athlete/attempts/${attemptId}/submit-result`,
  athleteDashboard: "/athlete/dashboard",
  leaderboard: "/rankings",
  coachOverview: "/coach/overview",
  coachAthletes: "/coach/athletes",
  coachAthleteDetail: (athleteId) => `/coach/athletes/${athleteId}`,
  coachWorkouts: "/coach/workouts",
  validateAttempt: (attemptId) => `/coach/attempts/${attemptId}/validate`,
  rejectAttempt: (attemptId) => `/coach/attempts/${attemptId}/reject`,
  createWorkout: "/coach/workouts",
  updateWorkout: (workoutId) => `/coach/workouts/${workoutId}`,
  duplicateWorkout: (workoutId) => `/coach/workouts/${workoutId}/duplicate`,
  publishWorkout: (workoutId) => `/coach/workouts/${workoutId}/publish`,
  getIdealScores: (workoutId) => `/coach/workouts/${workoutId}/ideal-scores`,
  setCommunityIdealScore: (workoutId) => `/coach/workouts/${workoutId}/ideal-scores/community`,
  setGymIdealScore: (workoutId, gymId) => `/coach/workouts/${workoutId}/ideal-scores/gym/${gymId}`,
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

    async listMovements(query?: string): Promise<MovementDTO[]> {
      if (!query || !query.trim()) {
        return http.request<MovementDTO[]>(endpoints.listMovements);
      }

      const params = new URLSearchParams({ query: query.trim() });
      return http.request<MovementDTO[]>(`${endpoints.listMovements}?${params.toString()}`);
    },

    async listWorkouts(): Promise<WorkoutDefinitionSummaryDTO[]> {
      return http.request<WorkoutDefinitionSummaryDTO[]>(endpoints.listWorkouts);
    },

    async getWorkoutDetail(workoutId: string): Promise<WorkoutDefinitionDetailDTO> {
      return http.request<WorkoutDefinitionDetailDTO>(endpoints.getWorkoutDetail(workoutId));
    },

    async createAttempt(payload: CreateAttemptRequest): Promise<CreateAttemptResponse> {
      return http.request<CreateAttemptResponse>(endpoints.createAttempt(payload.workoutId), {
        method: "POST",
        body: {
          scaleCode: payload.scaleCode,
        },
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
      return http.request<LeaderboardDTO>(`${endpoints.leaderboard}?${params.toString()}`);
    },

    async coachOverview(): Promise<CoachOverviewDTO> {
      return http.request<CoachOverviewDTO>(endpoints.coachOverview);
    },

    async coachAthletes(): Promise<CoachAthleteDTO[]> {
      return http.request<CoachAthleteDTO[]>(endpoints.coachAthletes);
    },

    async coachAthleteDetail(athleteId: string): Promise<CoachAthleteDetailDTO> {
      return http.request<CoachAthleteDetailDTO>(endpoints.coachAthleteDetail(athleteId));
    },

    async coachWorkouts(): Promise<CoachWorkoutSummaryDTO[]> {
      return http.request<CoachWorkoutSummaryDTO[]>(endpoints.coachWorkouts);
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

    async createWorkout(payload: WorkoutUpsertRequestDTO): Promise<WorkoutMutationResponseDTO> {
      return http.request<WorkoutMutationResponseDTO>(endpoints.createWorkout, {
        method: "POST",
        body: payload,
      });
    },

    async updateWorkout(workoutId: string, payload: WorkoutUpsertRequestDTO): Promise<WorkoutMutationResponseDTO> {
      return http.request<WorkoutMutationResponseDTO>(endpoints.updateWorkout(workoutId), {
        method: "PUT",
        body: payload,
      });
    },

    async duplicateWorkout(workoutId: string): Promise<DuplicateWorkoutResponseDTO> {
      return http.request<DuplicateWorkoutResponseDTO>(endpoints.duplicateWorkout(workoutId), {
        method: "POST",
      });
    },

    async getIdealScores(workoutId: string): Promise<IdealScoreGetResponse> {
      return http.request<IdealScoreGetResponse>(endpoints.getIdealScores(workoutId));
    },

    async setCommunityIdealScore(workoutId: string, payload: IdealScoreUpsertRequest): Promise<void> {
      await http.request<void>(endpoints.setCommunityIdealScore(workoutId), {
        method: "PUT",
        body: payload,
      });
    },

    async setGymIdealScore(workoutId: string, gymId: string, payload: IdealScoreUpsertRequest): Promise<void> {
      await http.request<void>(endpoints.setGymIdealScore(workoutId, gymId), {
        method: "PUT",
        body: payload,
      });
    },

    async publishWorkout(workoutId: string): Promise<WorkoutDefinitionSummaryDTO> {
      return http.request<WorkoutDefinitionSummaryDTO>(endpoints.publishWorkout(workoutId), {
        method: "POST",
      });
    },

    async getCurrentTokens() {
      return getTokens(options.storage);
    },
  };
}

export type ApiClient = ReturnType<typeof createApi>;
