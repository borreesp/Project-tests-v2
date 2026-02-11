from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.adapters.outbound.persistence.models.enums import (
    ASSIGNMENT_SCOPE_DB_ENUM,
    ASSIGNMENT_STATUS_DB_ENUM,
    ATTEMPT_STATUS_DB_ENUM,
    BLOCK_TYPE_DB_ENUM,
    CAPACITY_TYPE_DB_ENUM,
    CONFIDENCE_DB_ENUM,
    DATA_QUALITY_DB_ENUM,
    GYM_ROLE_DB_ENUM,
    IDEAL_SCOPE_DB_ENUM,
    INVITATION_ROLE_DB_ENUM,
    LEADERBOARD_PERIOD_DB_ENUM,
    LEADERBOARD_SCOPE_DB_ENUM,
    LEVEL_BAND_DB_ENUM,
    LOAD_RULE_DB_ENUM,
    MOVEMENT_PATTERN_DB_ENUM,
    MOVEMENT_UNIT_DB_ENUM,
    SCALE_CODE_DB_ENUM,
    SEX_DB_ENUM,
    USER_ROLE_DB_ENUM,
    USER_STATUS_DB_ENUM,
    WORKOUT_TYPE_DB_ENUM,
    WORKOUT_VISIBILITY_DB_ENUM,
    AssignmentScope,
    AssignmentStatus,
    AttemptStatus,
    BlockType,
    CapacityType,
    Confidence,
    DataQuality,
    GymRole,
    IdealScope,
    InvitationRole,
    LeaderboardPeriod,
    LeaderboardScope,
    LevelBand,
    LoadRule,
    MovementPattern,
    MovementUnit,
    ScaleCode,
    Sex,
    UserRole,
    UserStatus,
    WorkoutType,
    WorkoutVisibility,
)
from src.infrastructure.db.base import Base


class UserModel(Base):
    __tablename__ = "users"
    __table_args__ = (Index("uq_users_email", "email", unique=True),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(USER_ROLE_DB_ENUM, nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        USER_STATUS_DB_ENUM,
        nullable=False,
        server_default=text("'ACTIVE'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RefreshTokenModel(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("idx_refresh_tokens_user_id", "user_id"),
        Index("idx_refresh_tokens_expires_at", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class GymModel(Base):
    __tablename__ = "gyms"
    __table_args__ = (Index("idx_gyms_name", "name"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class GymMembershipModel(Base):
    __tablename__ = "gym_memberships"
    __table_args__ = (
        Index(
            "uq_gym_memberships_user_active_true",
            "user_id",
            "active",
            unique=True,
            postgresql_where=text("active = true"),
        ),
        Index("idx_memberships_gym_id", "gym_id"),
        Index("idx_memberships_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    gym_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="RESTRICT"),
        nullable=False,
    )
    role_in_gym: Mapped[GymRole] = mapped_column(GYM_ROLE_DB_ENUM, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class GymMembershipHistoryModel(Base):
    __tablename__ = "gym_membership_history"
    __table_args__ = (
        Index("idx_membership_history_user_id", "user_id"),
        Index("idx_membership_history_changed_at", "changed_at"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_gym_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=True)
    to_gym_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    changed_by_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class InvitationModel(Base):
    __tablename__ = "invitations"
    __table_args__ = (
        Index("uq_invitations_token", "token", unique=True),
        Index("idx_invitations_gym_id", "gym_id"),
        Index("idx_invitations_email", "email"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    gym_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    invited_by_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role: Mapped[InvitationRole] = mapped_column(
        INVITATION_ROLE_DB_ENUM,
        nullable=False,
        server_default=text("'ATHLETE'"),
    )
    token: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class AthleteProfileModel(Base):
    __tablename__ = "athlete_profiles"
    __table_args__ = (
        Index("uq_athlete_profiles_user_id", "user_id", unique=True),
        Index("idx_athlete_profiles_gym_id", "current_gym_id"),
        CheckConstraint("height_cm BETWEEN 120 AND 230", name="ck_athlete_profiles_height_cm_range"),
        CheckConstraint("weight_kg BETWEEN 30 AND 250", name="ck_athlete_profiles_weight_kg_range"),
        CheckConstraint("level BETWEEN 1 AND 10", name="ck_athlete_profiles_level_range"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    current_gym_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    sex: Mapped[Sex | None] = mapped_column(SEX_DB_ENUM, nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("1"))
    level_band: Mapped[LevelBand] = mapped_column(
        LEVEL_BAND_DB_ENUM,
        nullable=False,
        server_default=text("'BEGINNER'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class CoachProfileModel(Base):
    __tablename__ = "coach_profiles"
    __table_args__ = (Index("uq_coach_profiles_user_id", "user_id", unique=True),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class MovementModel(Base):
    __tablename__ = "movements"
    __table_args__ = (
        Index("uq_movements_name", "name", unique=True),
        Index("idx_movements_pattern", "pattern"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    pattern: Mapped[MovementPattern] = mapped_column(MOVEMENT_PATTERN_DB_ENUM, nullable=False)
    unit_primary: Mapped[MovementUnit] = mapped_column(MOVEMENT_UNIT_DB_ENUM, nullable=False)
    requires_load: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    requires_bodyweight: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class WorkoutDefinitionModel(Base):
    __tablename__ = "workout_definitions"
    __table_args__ = (
        Index("idx_workout_definitions_is_test", "is_test"),
        Index("idx_workout_definitions_author", "author_coach_user_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    author_coach_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_test: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    type: Mapped[WorkoutType] = mapped_column(WORKOUT_TYPE_DB_ENUM, nullable=False)
    visibility: Mapped[WorkoutVisibility] = mapped_column(WORKOUT_VISIBILITY_DB_ENUM, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WorkoutScaleModel(Base):
    __tablename__ = "workout_scales"
    __table_args__ = (Index("uq_workout_scales_workout_code", "workout_definition_id", "code", unique=True),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[ScaleCode] = mapped_column(SCALE_CODE_DB_ENUM, nullable=False)
    label: Mapped[str] = mapped_column(String(40), nullable=False)
    notes: Mapped[str] = mapped_column(String(200), nullable=False, server_default=text("''"))
    reference_loads_json: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )


class WorkoutBlockModel(Base):
    __tablename__ = "workout_blocks"
    __table_args__ = (
        Index("uq_workout_blocks_workout_ord", "workout_definition_id", "ord", unique=True),
        CheckConstraint("ord >= 1", name="ck_workout_blocks_ord_min"),
        CheckConstraint("repeat_int BETWEEN 1 AND 99", name="ck_workout_blocks_repeat_int_range"),
        CheckConstraint("time_seconds BETWEEN 1 AND 7200", name="ck_workout_blocks_time_seconds_range"),
        CheckConstraint("cap_seconds BETWEEN 1 AND 7200", name="ck_workout_blocks_cap_seconds_range"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    ord: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False, server_default=text("''"))
    block_type: Mapped[BlockType] = mapped_column(BLOCK_TYPE_DB_ENUM, nullable=False)
    repeat_int: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cap_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)


class BlockMovementModel(Base):
    __tablename__ = "block_movements"
    __table_args__ = (
        Index("uq_block_movements_block_ord", "block_id", "ord", unique=True),
        CheckConstraint("ord >= 1", name="ck_block_movements_ord_min"),
        CheckConstraint("reps BETWEEN 1 AND 1000", name="ck_block_movements_reps_range"),
        CheckConstraint("meters BETWEEN 1 AND 50000", name="ck_block_movements_meters_range"),
        CheckConstraint("seconds BETWEEN 1 AND 7200", name="ck_block_movements_seconds_range"),
        CheckConstraint("calories BETWEEN 1 AND 5000", name="ck_block_movements_calories_range"),
        CheckConstraint("box_height_cm BETWEEN 20 AND 120", name="ck_block_movements_box_height_cm_range"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    block_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    ord: Mapped[int] = mapped_column(Integer, nullable=False)
    movement_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("movements.id"), nullable=False)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    load_rule: Mapped[LoadRule] = mapped_column(LOAD_RULE_DB_ENUM, nullable=False)
    notes: Mapped[str] = mapped_column(String(200), nullable=False, server_default=text("''"))
    box_height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)


class WorkoutAssignmentModel(Base):
    __tablename__ = "workout_assignments"
    __table_args__ = (
        Index("idx_assignments_workout_id", "workout_definition_id"),
        Index("idx_assignments_gym_id", "gym_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    scope: Mapped[AssignmentScope] = mapped_column(ASSIGNMENT_SCOPE_DB_ENUM, nullable=False)
    gym_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=True)
    status: Mapped[AssignmentStatus] = mapped_column(
        ASSIGNMENT_STATUS_DB_ENUM,
        nullable=False,
        server_default=text("'ACTIVE'"),
    )
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class WorkoutAttemptModel(Base):
    __tablename__ = "workout_attempts"
    __table_args__ = (
        Index("idx_attempts_athlete_id", "athlete_id"),
        Index("idx_attempts_workout_id", "workout_definition_id"),
        Index("idx_attempts_performed_at", "performed_at"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    athlete_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("athlete_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id"),
        nullable=False,
    )
    assignment_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_assignments.id"),
        nullable=True,
    )
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    scale_code: Mapped[ScaleCode] = mapped_column(SCALE_CODE_DB_ENUM, nullable=False)
    status: Mapped[AttemptStatus] = mapped_column(
        ATTEMPT_STATUS_DB_ENUM,
        nullable=False,
        server_default=text("'DRAFT'"),
    )


class WorkoutResultModel(Base):
    __tablename__ = "workout_results"
    __table_args__ = (Index("uq_workout_results_attempt_id", "attempt_id", unique=True),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    attempt_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_attempts.id", ondelete="CASCADE"),
        nullable=False,
    )
    primary_result_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    inputs_json: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    derived_metrics_json: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    score_base: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    score_norm: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default=text("0"))
    data_quality: Mapped[DataQuality] = mapped_column(
        DATA_QUALITY_DB_ENUM,
        nullable=False,
        server_default=text("'OK'"),
    )
    validated_by_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reject_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)


class WorkoutIdealProfileModel(Base):
    __tablename__ = "workout_ideal_profiles"
    __table_args__ = (
        Index(
            "uq_workout_ideal_profiles_workout_scope_gym",
            "workout_definition_id",
            "scope",
            "gym_id",
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    scope: Mapped[IdealScope] = mapped_column(IDEAL_SCOPE_DB_ENUM, nullable=False)
    gym_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=True)
    coach_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ideal_score_base: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str] = mapped_column(String(200), nullable=False, server_default=text("''"))


class AthleteCapacityModel(Base):
    __tablename__ = "athlete_capacities"

    athlete_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("athlete_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    capacity_type: Mapped[CapacityType] = mapped_column(CAPACITY_TYPE_DB_ENUM, primary_key=True)
    value_0_100: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default=text("0"))
    confidence: Mapped[Confidence] = mapped_column(
        CONFIDENCE_DB_ENUM,
        nullable=False,
        server_default=text("'LOW'"),
    )
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class AthletePulseModel(Base):
    __tablename__ = "athlete_pulse"

    athlete_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("athlete_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    value_0_100: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default=text("0"))
    confidence: Mapped[Confidence] = mapped_column(
        CONFIDENCE_DB_ENUM,
        nullable=False,
        server_default=text("'LOW'"),
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    explain_json: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))


class LeaderboardModel(Base):
    __tablename__ = "leaderboards"
    __table_args__ = (
        Index(
            "uq_leaderboards_workout_scope_gym_period_scale",
            "workout_definition_id",
            "scope",
            "gym_id",
            "period",
            "scale_code",
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_definition_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    scope: Mapped[LeaderboardScope] = mapped_column(LEADERBOARD_SCOPE_DB_ENUM, nullable=False)
    gym_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("gyms.id"), nullable=True)
    period: Mapped[LeaderboardPeriod] = mapped_column(LEADERBOARD_PERIOD_DB_ENUM, nullable=False)
    scale_code: Mapped[ScaleCode] = mapped_column(SCALE_CODE_DB_ENUM, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class LeaderboardEntryModel(Base):
    __tablename__ = "leaderboard_entries"

    leaderboard_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("leaderboards.id", ondelete="CASCADE"),
        primary_key=True,
    )
    athlete_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("athlete_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    best_attempt_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("workout_attempts.id"), nullable=False)
    best_score_norm: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
