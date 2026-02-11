"""Add score_type and workout_capacity_weights for test builder."""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_score_type_weights"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

score_type_enum = postgresql.ENUM(
    "REPS",
    "METERS",
    "TIME",
    "ROUNDS_METERS",
    name="score_type_enum",
    create_type=False,
)
capacity_type_enum = postgresql.ENUM(
    "STRENGTH",
    "MUSCULAR_ENDURANCE",
    "RELATIVE_STRENGTH",
    "WORK_CAPACITY",
    name="capacity_type_enum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    score_type_enum.create(bind, checkfirst=True)

    op.add_column("workout_definitions", sa.Column("score_type", score_type_enum, nullable=True))

    op.execute(
        """
        UPDATE workout_definitions
        SET score_type = 'REPS'
        WHERE is_test = true
          AND score_type IS NULL
        """
    )

    op.create_table(
        "workout_capacity_weights",
        sa.Column("workout_definition_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("capacity_type", capacity_type_enum, nullable=False),
        sa.Column("weight", sa.Numeric(precision=3, scale=2), nullable=False),
        sa.CheckConstraint("weight >= 0 AND weight <= 1", name="ck_workout_capacity_weights_weight_range"),
        sa.ForeignKeyConstraint(
            ["workout_definition_id"],
            ["workout_definitions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("workout_definition_id", "capacity_type"),
    )


def downgrade() -> None:
    op.drop_table("workout_capacity_weights")
    op.drop_column("workout_definitions", "score_type")

    bind = op.get_bind()
    score_type_enum.drop(bind, checkfirst=True)
