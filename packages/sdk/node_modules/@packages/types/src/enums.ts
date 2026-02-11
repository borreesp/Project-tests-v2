export type UserRole = "ATHLETE" | "COACH" | "ADMIN";
export type UserStatus = "ACTIVE" | "DISABLED";

export type GymRole = "ATHLETE" | "COACH";

export type Sex = "MALE" | "FEMALE";
export type LevelBand = "BEGINNER" | "PRO" | "ATHLETE";

export type MovementPattern = "SQUAT" | "HINGE" | "PUSH" | "PULL" | "CARRY" | "CORE" | "LOCOMOTION" | "OTHER";
export type MovementUnit = "REPS" | "METERS" | "SECONDS" | "CALORIES";

export type WorkoutType = "AMRAP" | "EMOM" | "FORTIME" | "INTERVALS" | "BLOCKS";
export type WorkoutVisibility = "COMMUNITY" | "GYMS_ONLY";
export type ScoreType = "REPS" | "METERS" | "TIME" | "ROUNDS_METERS";

export type ScaleCode = "RX" | "SCALED";

export type BlockType = "WORK" | "REST";
export type LoadRule = "FIXED" | "ATHLETE_CHOICE" | "SCALE_REFERENCE";

export type AssignmentScope = "COMMUNITY" | "GYM";
export type AssignmentStatus = "ACTIVE" | "ARCHIVED";

export type AttemptStatus = "DRAFT" | "SUBMITTED" | "VALIDATED" | "REJECTED";
export type DataQuality = "OK" | "OUTLIER" | "INCOMPLETE";

export type IdealScope = "COMMUNITY" | "GYM";

export type CapacityType = "STRENGTH" | "MUSCULAR_ENDURANCE" | "RELATIVE_STRENGTH" | "WORK_CAPACITY";
export type Confidence = "LOW" | "MED" | "HIGH";

export type LeaderboardScope = "COMMUNITY" | "GYM";
export type LeaderboardPeriod = "ALL_TIME" | "D30";
