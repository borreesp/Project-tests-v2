import type {
  AttemptStatus,
  BlockType,
  CapacityType,
  Confidence,
  LeaderboardPeriod,
  LeaderboardScope,
  LevelBand,
  LoadRule,
  MovementPattern,
  MovementUnit,
  ScaleCode,
  ScoreType,
  Sex,
  UserRole,
  WorkoutType,
  WorkoutVisibility,
} from "./enums";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface InviteCreateRequest {
  email: string;
  gymId: string;
}

export interface InviteCreateResponse {
  invitationId: string;
  token: string;
  expiresAt: string;
}

export interface RegisterFromInviteRequest {
  token: string;
  password: string;
  displayName?: string;
  athlete: {
    sex?: Sex;
    birthdate?: string;
    heightCm?: number;
    weightKg?: number;
  };
}

export interface RegisterFromInviteResponse {
  accessToken: string;
  refreshToken: string;
  role: "ATHLETE";
}

export interface MovementDTO {
  id: string;
  name: string;
  pattern: MovementPattern;
  unitPrimary: MovementUnit;
  requiresLoad: boolean;
  requiresBodyweight: boolean;
}

export interface WorkoutDefinitionSummaryDTO {
  id: string;
  title: string;
  isTest: boolean;
  type: WorkoutType;
  visibility: WorkoutVisibility;
  scoreType?: ScoreType;
  publishedAt?: string;
}

export interface WorkoutCapacityWeightDTO {
  capacityType: CapacityType;
  weight: number;
}

export interface WorkoutDefinitionDetailDTO {
  id: string;
  title: string;
  description: string;
  isTest: boolean;
  type: WorkoutType;
  visibility: WorkoutVisibility;
  scoreType?: ScoreType;
  scales: Array<{ code: ScaleCode; label: string; notes: string; referenceLoads: Record<string, unknown> }>;
  blocks: Array<{
    id: string;
    ord: number;
    name: string;
    blockType: BlockType;
    repeatInt: number;
    timeSeconds?: number;
    capSeconds?: number;
    movements: Array<{
      id: string;
      ord: number;
      movement: MovementDTO;
      reps?: number;
      meters?: number;
      seconds?: number;
      calories?: number;
      loadRule: LoadRule;
      notes: string;
      boxHeightCm?: number;
    }>;
  }>;
  capacityWeights?: WorkoutCapacityWeightDTO[];
}

export interface WorkoutScaleInputDTO {
  code: ScaleCode;
  label: string;
  notes: string;
  referenceLoads: Record<string, unknown>;
}

export interface WorkoutBlockMovementInputDTO {
  ord: number;
  movementId: string;
  reps?: number;
  meters?: number;
  seconds?: number;
  calories?: number;
  loadRule: LoadRule;
  notes: string;
  boxHeightCm?: number;
}

export interface WorkoutBlockInputDTO {
  ord: number;
  name: string;
  blockType: BlockType;
  repeatInt: number;
  timeSeconds?: number;
  capSeconds?: number;
  movements: WorkoutBlockMovementInputDTO[];
}

export interface CoachWorkoutSummaryDTO {
  id: string;
  title: string;
  isTest: boolean;
  type: WorkoutType;
  visibility: WorkoutVisibility;
  scoreType?: ScoreType;
  publishedAt?: string;
}

export interface WorkoutUpsertRequestDTO {
  title: string;
  description: string;
  isTest: boolean;
  type: WorkoutType;
  visibility: WorkoutVisibility;
  scoreType?: ScoreType;
  scales: WorkoutScaleInputDTO[];
  blocks: WorkoutBlockInputDTO[];
  capacityWeights: WorkoutCapacityWeightDTO[];
}

export interface WorkoutMutationResponseDTO {
  id: string;
  title: string;
  isTest: boolean;
  type: WorkoutType;
  visibility: WorkoutVisibility;
  scoreType?: ScoreType;
  publishedAt?: string;
  updatedAt: string;
}

export interface CreateAttemptResponse {
  attemptId: string;
  status: AttemptStatus;
}

export interface SubmitResultRequest {
  primaryResult: Record<string, unknown>;
  inputs: Record<string, unknown>;
}

export interface AttemptDTO {
  id: string;
  athleteId: string;
  workoutId: string;
  performedAt: string;
  scaleCode: ScaleCode;
  status: AttemptStatus;
  scoreNorm?: number;
}

export interface CapacityDTO {
  type: CapacityType;
  value: number;
  confidence: Confidence;
  lastUpdatedAt: string;
}

export interface PulseDTO {
  value: number;
  confidence: Confidence;
  computedAt: string;
  explain: Array<{ key: string; message: string }>;
}

export interface AthleteDashboardDTO {
  athleteId: string;
  gymId: string;
  level: number;
  levelBand: LevelBand;
  pulse: PulseDTO;
  capacities: CapacityDTO[];
  counts: { tests7d: number; tests30d: number };
  trends30d: Array<{ type: CapacityType; delta: number }>;
}

export interface LeaderboardEntryDTO {
  rank: number;
  athleteId: string;
  displayName: string;
  bestScoreNorm: number;
}

export interface LeaderboardDTO {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  workoutId: string;
  scaleCode: ScaleCode;
  entries: LeaderboardEntryDTO[];
  myRank?: number;
}
