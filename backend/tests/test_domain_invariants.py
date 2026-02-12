from __future__ import annotations

import pytest

from src.adapters.outbound.persistence.models.enums import (
    AttemptStatus,
    CapacityType,
    LeaderboardPeriod,
    LeaderboardScope,
    ScaleCode,
    ScoreType,
    WorkoutType,
    WorkoutVisibility,
)
from src.application.dtos.coach import (
    WorkoutBlockInputDTO,
    WorkoutBlockMovementInputDTO,
    WorkoutCapacityWeightInputDTO,
    WorkoutCreateRequestDTO,
    WorkoutScaleInputDTO,
)
from src.application.services.runtime_service import (
    ValidationServiceError,
    get_runtime_service,
    reset_runtime_service,
)


def _build_workout_payload(*, is_test: bool, score_type: ScoreType | None) -> WorkoutCreateRequestDTO:
    service = get_runtime_service()
    movement_id = next(iter(service.movements.keys()))

    return WorkoutCreateRequestDTO(
        title="Invariant Workout",
        description="domain invariant checks",
        is_test=is_test,
        type=WorkoutType.AMRAP,
        visibility=WorkoutVisibility.GYMS_ONLY,
        score_type=score_type,
        capacity_weights=[
            WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.STRENGTH, weight=0.25),
            WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.MUSCULAR_ENDURANCE, weight=0.25),
            WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.RELATIVE_STRENGTH, weight=0.25),
            WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.WORK_CAPACITY, weight=0.25),
        ],
        scales=[
            WorkoutScaleInputDTO(code=ScaleCode.RX, label="RX", notes="", reference_loads={}),
            WorkoutScaleInputDTO(code=ScaleCode.SCALED, label="Scaled", notes="", reference_loads={}),
        ],
        blocks=[
            WorkoutBlockInputDTO(
                ord=1,
                name="Main",
                block_type="WORK",
                repeat_int=1,
                time_seconds=600,
                cap_seconds=None,
                movements=[
                    WorkoutBlockMovementInputDTO(
                        ord=1,
                        movement_id=movement_id,
                        reps=20,
                        meters=None,
                        seconds=None,
                        calories=None,
                        load_rule="ATHLETE_CHOICE",
                        notes="",
                        box_height_cm=None,
                    )
                ],
            )
        ],
    )


def _seed_attempt(*, is_test: bool, score_norm: float, status: AttemptStatus) -> tuple[str, str]:
    service = get_runtime_service()
    coach = next(user for user in service.users.values() if user.email == "coach@local.com")
    athlete = next(user for user in service.users.values() if user.email == "athlete@local.com")
    athlete_profile = service._athlete_profile_by_user(athlete.id)  # noqa: SLF001
    assert athlete_profile is not None

    workout_payload = _build_workout_payload(is_test=is_test, score_type=ScoreType.REPS)
    workout = service.create_workout(coach, workout_payload)

    attempt = service.create_attempt(athlete, workout.id, ScaleCode.RX)
    attempt_record = service.attempts[attempt.attempt_id]
    attempt_record.status = status

    result = service._result_by_attempt(attempt.attempt_id)  # noqa: SLF001
    assert result is not None
    result.score_norm = score_norm

    return athlete_profile.id, workout.id


def test_only_is_test_workouts_alter_capacities() -> None:
    reset_runtime_service()
    athlete_id, _ = _seed_attempt(is_test=False, score_norm=100.0, status=AttemptStatus.VALIDATED)
    service = get_runtime_service()

    service._recalculate_capacities_and_pulse(athlete_id)  # noqa: SLF001

    for capacity in CapacityType:
        record = service.capacities[(athlete_id, capacity)]
        assert record.value_0_100 == 0.0


def test_non_validated_attempts_do_not_affect_ranking() -> None:
    reset_runtime_service()
    _, workout_id = _seed_attempt(is_test=True, score_norm=80.0, status=AttemptStatus.SUBMITTED)
    service = get_runtime_service()

    leaderboard = service._compute_leaderboard(  # noqa: SLF001
        workout_id=workout_id,
        scope=LeaderboardScope.COMMUNITY,
        gym_id=None,
        period=LeaderboardPeriod.ALL_TIME,
        scale_code=ScaleCode.RX,
        current_user=None,
    )

    assert leaderboard.entries == []


def test_capacity_weights_sum_must_be_one() -> None:
    reset_runtime_service()
    service = get_runtime_service()

    bad_weights = [
        WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.STRENGTH, weight=0.4),
        WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.MUSCULAR_ENDURANCE, weight=0.4),
        WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.RELATIVE_STRENGTH, weight=0.1),
        WorkoutCapacityWeightInputDTO(capacity_type=CapacityType.WORK_CAPACITY, weight=0.05),
    ]

    with pytest.raises(ValidationServiceError, match="sum must be 1.00"):
        service._validate_capacity_weights(True, bad_weights)  # noqa: SLF001


def test_score_type_is_required_for_test_workouts() -> None:
    reset_runtime_service()
    service = get_runtime_service()
    coach = next(user for user in service.users.values() if user.email == "coach@local.com")

    payload = _build_workout_payload(is_test=True, score_type=None)

    with pytest.raises(ValidationServiceError, match="scoreType is required"):
        service.create_workout(coach, payload)
