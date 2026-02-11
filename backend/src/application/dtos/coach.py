from datetime import datetime

from pydantic import Field

from src.application.dtos.athlete import AttemptDTO
from src.application.dtos.base import DTOModel
from src.application.dtos.public import WorkoutDefinitionSummaryDTO
from src.adapters.outbound.persistence.models.enums import (
    BlockType,
    CapacityType,
    LoadRule,
    MovementPattern,
    MovementUnit,
    ScaleCode,
    ScoreType,
    WorkoutType,
    WorkoutVisibility,
)


class CoachOverviewDTO(DTOModel):
    gym_id: str = Field(alias="gymId")
    athletes_count: int = Field(alias="athletesCount")
    pending_submissions: int = Field(alias="pendingSubmissions")
    validated_today: int = Field(alias="validatedToday")


class CoachAthleteSummaryDTO(DTOModel):
    athlete_id: str = Field(alias="athleteId")
    user_id: str = Field(alias="userId")
    email: str
    level: int
    level_band: str = Field(alias="levelBand")


class CoachAthleteDetailDTO(DTOModel):
    athlete_id: str = Field(alias="athleteId")
    user_id: str = Field(alias="userId")
    email: str
    gym_id: str = Field(alias="gymId")
    level: int
    level_band: str = Field(alias="levelBand")
    created_at: str = Field(alias="createdAt")


class RejectAttemptRequestDTO(DTOModel):
    reason: str = Field(min_length=1, max_length=200)


class WorkoutScaleInputDTO(DTOModel):
    code: ScaleCode
    label: str
    notes: str = ""
    reference_loads: dict[str, object] = Field(default_factory=dict, alias="referenceLoads")


class WorkoutBlockMovementInputDTO(DTOModel):
    ord: int
    movement_id: str = Field(alias="movementId")
    reps: int | None = None
    meters: int | None = None
    seconds: int | None = None
    calories: int | None = None
    load_rule: LoadRule = Field(alias="loadRule")
    notes: str = ""
    box_height_cm: int | None = Field(default=None, alias="boxHeightCm")


class WorkoutBlockInputDTO(DTOModel):
    ord: int
    name: str = ""
    block_type: BlockType = Field(alias="blockType")
    repeat_int: int = Field(default=1, alias="repeatInt")
    time_seconds: int | None = Field(default=None, alias="timeSeconds")
    cap_seconds: int | None = Field(default=None, alias="capSeconds")
    movements: list[WorkoutBlockMovementInputDTO]


class WorkoutCapacityWeightInputDTO(DTOModel):
    capacity_type: CapacityType = Field(alias="capacityType")
    weight: float


class WorkoutCreateRequestDTO(DTOModel):
    title: str
    description: str = ""
    is_test: bool = Field(default=False, alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    score_type: ScoreType | None = Field(default=None, alias="scoreType")
    scales: list[WorkoutScaleInputDTO]
    blocks: list[WorkoutBlockInputDTO]
    capacity_weights: list[WorkoutCapacityWeightInputDTO] = Field(default_factory=list, alias="capacityWeights")


class WorkoutUpdateRequestDTO(DTOModel):
    title: str
    description: str = ""
    is_test: bool = Field(default=False, alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    score_type: ScoreType | None = Field(default=None, alias="scoreType")
    scales: list[WorkoutScaleInputDTO]
    blocks: list[WorkoutBlockInputDTO]
    capacity_weights: list[WorkoutCapacityWeightInputDTO] = Field(default_factory=list, alias="capacityWeights")


class CoachWorkoutSummaryDTO(DTOModel):
    id: str
    title: str
    is_test: bool = Field(alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    published_at: str | None = Field(default=None, alias="publishedAt")
    score_type: ScoreType | None = Field(default=None, alias="scoreType")


class WorkoutMutationResponseDTO(DTOModel):
    id: str
    title: str
    is_test: bool = Field(alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    score_type: ScoreType | None = Field(default=None, alias="scoreType")
    published_at: str | None = Field(default=None, alias="publishedAt")
    updated_at: str = Field(alias="updatedAt")


class ValidateAttemptResponseDTO(AttemptDTO):
    validated_at: str = Field(alias="validatedAt")


class PublishWorkoutResponseDTO(WorkoutDefinitionSummaryDTO):
    published_at: str = Field(alias="publishedAt")
