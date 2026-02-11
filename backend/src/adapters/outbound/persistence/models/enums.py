from enum import Enum

from sqlalchemy import Enum as SQLEnum


class UserRole(str, Enum):
    ATHLETE = "ATHLETE"
    COACH = "COACH"
    ADMIN = "ADMIN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class GymRole(str, Enum):
    ATHLETE = "ATHLETE"
    COACH = "COACH"


class InvitationRole(str, Enum):
    ATHLETE = "ATHLETE"


class Sex(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class LevelBand(str, Enum):
    BEGINNER = "BEGINNER"
    PRO = "PRO"
    ATHLETE = "ATHLETE"


class MovementPattern(str, Enum):
    SQUAT = "SQUAT"
    HINGE = "HINGE"
    PUSH = "PUSH"
    PULL = "PULL"
    CARRY = "CARRY"
    CORE = "CORE"
    LOCOMOTION = "LOCOMOTION"
    OTHER = "OTHER"


class MovementUnit(str, Enum):
    REPS = "REPS"
    METERS = "METERS"
    SECONDS = "SECONDS"
    CALORIES = "CALORIES"


class WorkoutType(str, Enum):
    AMRAP = "AMRAP"
    EMOM = "EMOM"
    FORTIME = "FORTIME"
    INTERVALS = "INTERVALS"
    BLOCKS = "BLOCKS"


class WorkoutVisibility(str, Enum):
    COMMUNITY = "COMMUNITY"
    GYMS_ONLY = "GYMS_ONLY"


class ScoreType(str, Enum):
    REPS = "REPS"
    METERS = "METERS"
    TIME = "TIME"
    ROUNDS_METERS = "ROUNDS_METERS"


class ScaleCode(str, Enum):
    RX = "RX"
    SCALED = "SCALED"


class BlockType(str, Enum):
    WORK = "WORK"
    REST = "REST"


class LoadRule(str, Enum):
    FIXED = "FIXED"
    ATHLETE_CHOICE = "ATHLETE_CHOICE"
    SCALE_REFERENCE = "SCALE_REFERENCE"


class AssignmentScope(str, Enum):
    COMMUNITY = "COMMUNITY"
    GYM = "GYM"


class AssignmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class AttemptStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"


class DataQuality(str, Enum):
    OK = "OK"
    OUTLIER = "OUTLIER"
    INCOMPLETE = "INCOMPLETE"


class IdealScope(str, Enum):
    COMMUNITY = "COMMUNITY"
    GYM = "GYM"


class CapacityType(str, Enum):
    STRENGTH = "STRENGTH"
    MUSCULAR_ENDURANCE = "MUSCULAR_ENDURANCE"
    RELATIVE_STRENGTH = "RELATIVE_STRENGTH"
    WORK_CAPACITY = "WORK_CAPACITY"


class Confidence(str, Enum):
    LOW = "LOW"
    MED = "MED"
    HIGH = "HIGH"


class LeaderboardScope(str, Enum):
    COMMUNITY = "COMMUNITY"
    GYM = "GYM"


class LeaderboardPeriod(str, Enum):
    ALL_TIME = "ALL_TIME"
    D30 = "D30"


USER_ROLE_DB_ENUM = SQLEnum(UserRole, name="user_role_enum", native_enum=True, validate_strings=True)
USER_STATUS_DB_ENUM = SQLEnum(UserStatus, name="user_status_enum", native_enum=True, validate_strings=True)
GYM_ROLE_DB_ENUM = SQLEnum(GymRole, name="gym_role_enum", native_enum=True, validate_strings=True)
INVITATION_ROLE_DB_ENUM = SQLEnum(
    InvitationRole,
    name="invitation_role_enum",
    native_enum=True,
    validate_strings=True,
)
SEX_DB_ENUM = SQLEnum(Sex, name="sex_enum", native_enum=True, validate_strings=True)
LEVEL_BAND_DB_ENUM = SQLEnum(LevelBand, name="level_band_enum", native_enum=True, validate_strings=True)
MOVEMENT_PATTERN_DB_ENUM = SQLEnum(
    MovementPattern,
    name="movement_pattern_enum",
    native_enum=True,
    validate_strings=True,
)
MOVEMENT_UNIT_DB_ENUM = SQLEnum(
    MovementUnit,
    name="movement_unit_enum",
    native_enum=True,
    validate_strings=True,
)
WORKOUT_TYPE_DB_ENUM = SQLEnum(WorkoutType, name="workout_type_enum", native_enum=True, validate_strings=True)
WORKOUT_VISIBILITY_DB_ENUM = SQLEnum(
    WorkoutVisibility,
    name="workout_visibility_enum",
    native_enum=True,
    validate_strings=True,
)
SCORE_TYPE_DB_ENUM = SQLEnum(
    ScoreType,
    name="score_type_enum",
    native_enum=True,
    validate_strings=True,
)
SCALE_CODE_DB_ENUM = SQLEnum(ScaleCode, name="scale_code_enum", native_enum=True, validate_strings=True)
BLOCK_TYPE_DB_ENUM = SQLEnum(BlockType, name="block_type_enum", native_enum=True, validate_strings=True)
LOAD_RULE_DB_ENUM = SQLEnum(LoadRule, name="load_rule_enum", native_enum=True, validate_strings=True)
ASSIGNMENT_SCOPE_DB_ENUM = SQLEnum(
    AssignmentScope,
    name="assignment_scope_enum",
    native_enum=True,
    validate_strings=True,
)
ASSIGNMENT_STATUS_DB_ENUM = SQLEnum(
    AssignmentStatus,
    name="assignment_status_enum",
    native_enum=True,
    validate_strings=True,
)
ATTEMPT_STATUS_DB_ENUM = SQLEnum(
    AttemptStatus,
    name="attempt_status_enum",
    native_enum=True,
    validate_strings=True,
)
DATA_QUALITY_DB_ENUM = SQLEnum(DataQuality, name="data_quality_enum", native_enum=True, validate_strings=True)
IDEAL_SCOPE_DB_ENUM = SQLEnum(IdealScope, name="ideal_scope_enum", native_enum=True, validate_strings=True)
CAPACITY_TYPE_DB_ENUM = SQLEnum(
    CapacityType,
    name="capacity_type_enum",
    native_enum=True,
    validate_strings=True,
)
CONFIDENCE_DB_ENUM = SQLEnum(Confidence, name="confidence_enum", native_enum=True, validate_strings=True)
LEADERBOARD_SCOPE_DB_ENUM = SQLEnum(
    LeaderboardScope,
    name="leaderboard_scope_enum",
    native_enum=True,
    validate_strings=True,
)
LEADERBOARD_PERIOD_DB_ENUM = SQLEnum(
    LeaderboardPeriod,
    name="leaderboard_period_enum",
    native_enum=True,
    validate_strings=True,
)
