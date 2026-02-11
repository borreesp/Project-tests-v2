"""Initial complete schema."""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

user_role_enum = postgresql.ENUM("ATHLETE", "COACH", "ADMIN", name="user_role_enum", create_type=False)
user_status_enum = postgresql.ENUM("ACTIVE", "DISABLED", name="user_status_enum", create_type=False)
gym_role_enum = postgresql.ENUM("ATHLETE", "COACH", name="gym_role_enum", create_type=False)
invitation_role_enum = postgresql.ENUM("ATHLETE", name="invitation_role_enum", create_type=False)
sex_enum = postgresql.ENUM("MALE", "FEMALE", name="sex_enum", create_type=False)
level_band_enum = postgresql.ENUM("BEGINNER", "PRO", "ATHLETE", name="level_band_enum", create_type=False)
movement_pattern_enum = postgresql.ENUM(
    "SQUAT",
    "HINGE",
    "PUSH",
    "PULL",
    "CARRY",
    "CORE",
    "LOCOMOTION",
    "OTHER",
    name="movement_pattern_enum",
    create_type=False,
)
movement_unit_enum = postgresql.ENUM("REPS", "METERS", "SECONDS", "CALORIES", name="movement_unit_enum", create_type=False)
workout_type_enum = postgresql.ENUM(
    "AMRAP", "EMOM", "FORTIME", "INTERVALS", "BLOCKS", name="workout_type_enum", create_type=False
)
workout_visibility_enum = postgresql.ENUM("COMMUNITY", "GYMS_ONLY", name="workout_visibility_enum", create_type=False)
scale_code_enum = postgresql.ENUM("RX", "SCALED", name="scale_code_enum", create_type=False)
block_type_enum = postgresql.ENUM("WORK", "REST", name="block_type_enum", create_type=False)
load_rule_enum = postgresql.ENUM("FIXED", "ATHLETE_CHOICE", "SCALE_REFERENCE", name="load_rule_enum", create_type=False)
assignment_scope_enum = postgresql.ENUM("COMMUNITY", "GYM", name="assignment_scope_enum", create_type=False)
assignment_status_enum = postgresql.ENUM("ACTIVE", "ARCHIVED", name="assignment_status_enum", create_type=False)
attempt_status_enum = postgresql.ENUM(
    "DRAFT", "SUBMITTED", "VALIDATED", "REJECTED", name="attempt_status_enum", create_type=False
)
data_quality_enum = postgresql.ENUM("OK", "OUTLIER", "INCOMPLETE", name="data_quality_enum", create_type=False)
ideal_scope_enum = postgresql.ENUM("COMMUNITY", "GYM", name="ideal_scope_enum", create_type=False)
capacity_type_enum = postgresql.ENUM(
    "STRENGTH",
    "MUSCULAR_ENDURANCE",
    "RELATIVE_STRENGTH",
    "WORK_CAPACITY",
    name="capacity_type_enum",
    create_type=False,
)
confidence_enum = postgresql.ENUM("LOW", "MED", "HIGH", name="confidence_enum", create_type=False)
leaderboard_scope_enum = postgresql.ENUM("COMMUNITY", "GYM", name="leaderboard_scope_enum", create_type=False)
leaderboard_period_enum = postgresql.ENUM("ALL_TIME", "D30", name="leaderboard_period_enum", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum_type in (
        user_role_enum,
        user_status_enum,
        gym_role_enum,
        invitation_role_enum,
        sex_enum,
        level_band_enum,
        movement_pattern_enum,
        movement_unit_enum,
        workout_type_enum,
        workout_visibility_enum,
        scale_code_enum,
        block_type_enum,
        load_rule_enum,
        assignment_scope_enum,
        assignment_status_enum,
        attempt_status_enum,
        data_quality_enum,
        ideal_scope_enum,
        capacity_type_enum,
        confidence_enum,
        leaderboard_scope_enum,
        leaderboard_period_enum,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("status", user_status_enum, server_default=sa.text("'ACTIVE'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_users_email", "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("idx_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])

    op.create_table(
        "gyms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_gyms_name", "gyms", ["name"])

    op.create_table(
        "gym_memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_in_gym", gym_role_enum, nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_gym_memberships_user_active_true",
        "gym_memberships",
        ["user_id", "active"],
        unique=True,
        postgresql_where=sa.text("active = true"),
    )
    op.create_index("idx_memberships_gym_id", "gym_memberships", ["gym_id"])
    op.create_index("idx_memberships_user_id", "gym_memberships", ["user_id"])

    op.create_table(
        "gym_membership_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_gym_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("to_gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("changed_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["from_gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["to_gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_membership_history_user_id", "gym_membership_history", ["user_id"])
    op.create_index("idx_membership_history_changed_at", "gym_membership_history", ["changed_at"])

    op.create_table(
        "invitations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invited_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", invitation_role_enum, server_default=sa.text("'ATHLETE'"), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_invitations_token", "invitations", ["token"], unique=True)
    op.create_index("idx_invitations_gym_id", "invitations", ["gym_id"])
    op.create_index("idx_invitations_email", "invitations", ["email"])

    op.create_table(
        "athlete_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sex", sex_enum, nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("level", sa.SmallInteger(), server_default=sa.text("1"), nullable=False),
        sa.Column("level_band", level_band_enum, server_default=sa.text("'BEGINNER'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("height_cm BETWEEN 120 AND 230", name="ck_athlete_profiles_height_cm_range"),
        sa.CheckConstraint("weight_kg BETWEEN 30 AND 250", name="ck_athlete_profiles_weight_kg_range"),
        sa.CheckConstraint("level BETWEEN 1 AND 10", name="ck_athlete_profiles_level_range"),
        sa.ForeignKeyConstraint(["current_gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_athlete_profiles_user_id"),
    )
    op.create_index("idx_athlete_profiles_gym_id", "athlete_profiles", ["current_gym_id"])

    op.create_table(
        "coach_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_coach_profiles_user_id"),
    )

    op.create_table(
        "movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("pattern", movement_pattern_enum, nullable=False),
        sa.Column("unit_primary", movement_unit_enum, nullable=False),
        sa.Column("requires_load", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("requires_bodyweight", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_movements_name"),
    )
    op.create_index("idx_movements_pattern", "movements", ["pattern"])

    op.create_table(
        "workout_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("author_coach_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_test", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("type", workout_type_enum, nullable=False),
        sa.Column("visibility", workout_visibility_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_coach_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_workout_definitions_is_test", "workout_definitions", ["is_test"])
    op.create_index("idx_workout_definitions_author", "workout_definitions", ["author_coach_user_id"])

    op.create_table(
        "workout_scales",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", scale_code_enum, nullable=False),
        sa.Column("label", sa.String(length=40), nullable=False),
        sa.Column("notes", sa.String(length=200), server_default=sa.text("''"), nullable=False),
        sa.Column("reference_loads_json", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workout_definition_id", "code", name="uq_workout_scales_workout_code"),
    )

    op.create_table(
        "workout_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ord", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), server_default=sa.text("''"), nullable=False),
        sa.Column("block_type", block_type_enum, nullable=False),
        sa.Column("repeat_int", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("time_seconds", sa.Integer(), nullable=True),
        sa.Column("cap_seconds", sa.Integer(), nullable=True),
        sa.CheckConstraint("ord >= 1", name="ck_workout_blocks_ord_min"),
        sa.CheckConstraint("repeat_int BETWEEN 1 AND 99", name="ck_workout_blocks_repeat_int_range"),
        sa.CheckConstraint("time_seconds BETWEEN 1 AND 7200", name="ck_workout_blocks_time_seconds_range"),
        sa.CheckConstraint("cap_seconds BETWEEN 1 AND 7200", name="ck_workout_blocks_cap_seconds_range"),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workout_definition_id", "ord", name="uq_workout_blocks_workout_ord"),
    )

    op.create_table(
        "block_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("block_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ord", sa.Integer(), nullable=False),
        sa.Column("movement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("meters", sa.Integer(), nullable=True),
        sa.Column("seconds", sa.Integer(), nullable=True),
        sa.Column("calories", sa.Integer(), nullable=True),
        sa.Column("load_rule", load_rule_enum, nullable=False),
        sa.Column("notes", sa.String(length=200), server_default=sa.text("''"), nullable=False),
        sa.Column("box_height_cm", sa.Integer(), nullable=True),
        sa.CheckConstraint("ord >= 1", name="ck_block_movements_ord_min"),
        sa.CheckConstraint("reps BETWEEN 1 AND 1000", name="ck_block_movements_reps_range"),
        sa.CheckConstraint("meters BETWEEN 1 AND 50000", name="ck_block_movements_meters_range"),
        sa.CheckConstraint("seconds BETWEEN 1 AND 7200", name="ck_block_movements_seconds_range"),
        sa.CheckConstraint("calories BETWEEN 1 AND 5000", name="ck_block_movements_calories_range"),
        sa.CheckConstraint("box_height_cm BETWEEN 20 AND 120", name="ck_block_movements_box_height_cm_range"),
        sa.ForeignKeyConstraint(["block_id"], ["workout_blocks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["movement_id"], ["movements.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("block_id", "ord", name="uq_block_movements_block_ord"),
    )

    op.create_table(
        "workout_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scope", assignment_scope_enum, nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", assignment_status_enum, server_default=sa.text("'ACTIVE'"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_assignments_workout_id", "workout_assignments", ["workout_definition_id"])
    op.create_index("idx_assignments_gym_id", "workout_assignments", ["gym_id"])

    op.create_table(
        "workout_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("athlete_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("performed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("scale_code", scale_code_enum, nullable=False),
        sa.Column("status", attempt_status_enum, server_default=sa.text("'DRAFT'"), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["workout_assignments.id"]),
        sa.ForeignKeyConstraint(["athlete_id"], ["athlete_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_attempts_athlete_id", "workout_attempts", ["athlete_id"])
    op.create_index("idx_attempts_workout_id", "workout_attempts", ["workout_definition_id"])
    op.create_index("idx_attempts_performed_at", "workout_attempts", ["performed_at"])

    op.create_table(
        "workout_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("primary_result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("inputs_json", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column(
            "derived_metrics_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("score_base", sa.Numeric(precision=12, scale=2), server_default=sa.text("0"), nullable=False),
        sa.Column("score_norm", sa.Numeric(precision=6, scale=2), server_default=sa.text("0"), nullable=False),
        sa.Column("data_quality", data_quality_enum, server_default=sa.text("'OK'"), nullable=False),
        sa.Column("validated_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reject_reason", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["attempt_id"], ["workout_attempts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["validated_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("attempt_id", name="uq_workout_results_attempt_id"),
    )

    op.create_table(
        "workout_ideal_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scope", ideal_scope_enum, nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("coach_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ideal_score_base", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.String(length=200), server_default=sa.text("''"), nullable=False),
        sa.ForeignKeyConstraint(["coach_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workout_definition_id",
            "scope",
            "gym_id",
            name="uq_workout_ideal_profiles_workout_scope_gym",
        ),
    )

    op.create_table(
        "athlete_capacities",
        sa.Column("athlete_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("capacity_type", capacity_type_enum, nullable=False),
        sa.Column("value_0_100", sa.Numeric(precision=6, scale=2), server_default=sa.text("0"), nullable=False),
        sa.Column("confidence", confidence_enum, server_default=sa.text("'LOW'"), nullable=False),
        sa.Column("last_updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["athlete_id"], ["athlete_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("athlete_id", "capacity_type"),
    )

    op.create_table(
        "athlete_pulse",
        sa.Column("athlete_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value_0_100", sa.Numeric(precision=6, scale=2), server_default=sa.text("0"), nullable=False),
        sa.Column("confidence", confidence_enum, server_default=sa.text("'LOW'"), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("explain_json", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.ForeignKeyConstraint(["athlete_id"], ["athlete_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("athlete_id"),
    )

    op.create_table(
        "leaderboards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scope", leaderboard_scope_enum, nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("period", leaderboard_period_enum, nullable=False),
        sa.Column("scale_code", scale_code_enum, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"]),
        sa.ForeignKeyConstraint(["workout_definition_id"], ["workout_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workout_definition_id",
            "scope",
            "gym_id",
            "period",
            "scale_code",
            name="uq_leaderboards_workout_scope_gym_period_scale",
        ),
    )

    op.create_table(
        "leaderboard_entries",
        sa.Column("leaderboard_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("athlete_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("best_attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("best_score_norm", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["athlete_id"], ["athlete_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["best_attempt_id"], ["workout_attempts.id"]),
        sa.ForeignKeyConstraint(["leaderboard_id"], ["leaderboards.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("leaderboard_id", "athlete_id"),
    )


def downgrade() -> None:
    op.drop_table("leaderboard_entries")
    op.drop_table("leaderboards")
    op.drop_table("athlete_pulse")
    op.drop_table("athlete_capacities")
    op.drop_table("workout_ideal_profiles")
    op.drop_table("workout_results")
    op.drop_table("workout_attempts")
    op.drop_table("workout_assignments")
    op.drop_table("block_movements")
    op.drop_table("workout_blocks")
    op.drop_table("workout_scales")
    op.drop_table("workout_definitions")
    op.drop_table("movements")
    op.drop_table("coach_profiles")
    op.drop_table("athlete_profiles")
    op.drop_table("invitations")
    op.drop_table("gym_membership_history")
    op.drop_table("gym_memberships")
    op.drop_table("gyms")
    op.drop_table("refresh_tokens")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_type in (
        leaderboard_period_enum,
        leaderboard_scope_enum,
        confidence_enum,
        capacity_type_enum,
        ideal_scope_enum,
        data_quality_enum,
        attempt_status_enum,
        assignment_status_enum,
        assignment_scope_enum,
        load_rule_enum,
        block_type_enum,
        scale_code_enum,
        workout_visibility_enum,
        workout_type_enum,
        movement_unit_enum,
        movement_pattern_enum,
        level_band_enum,
        sex_enum,
        invitation_role_enum,
        gym_role_enum,
        user_status_enum,
        user_role_enum,
    ):
        enum_type.drop(bind, checkfirst=True)
