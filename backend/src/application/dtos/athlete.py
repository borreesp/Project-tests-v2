from typing import Annotated, Literal

from pydantic import Field

from src.application.dtos.base import DTOModel
from src.adapters.outbound.persistence.models.enums import (
    AttemptStatus,
    CapacityType,
    Confidence,
    LevelBand,
    ScaleCode,
)


class CreateAttemptRequestDTO(DTOModel):
    scale_code: ScaleCode = Field(alias="scaleCode")


class CreateAttemptResponseDTO(DTOModel):
    attempt_id: str = Field(alias="attemptId")
    status: AttemptStatus


class RepsPrimaryResultDTO(DTOModel):
    type: Literal["REPS"]
    reps_total: int = Field(alias="repsTotal")


class MetersPrimaryResultDTO(DTOModel):
    type: Literal["METERS"]
    meters_total: int = Field(alias="metersTotal")


class TimePrimaryResultDTO(DTOModel):
    type: Literal["TIME"]
    time_seconds: int = Field(alias="timeSeconds")


class RoundsMetersPrimaryResultDTO(DTOModel):
    type: Literal["ROUNDS_METERS"]
    rounds: int
    meters: int


PrimaryResultDTO = Annotated[
    RepsPrimaryResultDTO | MetersPrimaryResultDTO | TimePrimaryResultDTO | RoundsMetersPrimaryResultDTO,
    Field(discriminator="type"),
]


class SubmitResultRequestDTO(DTOModel):
    primary_result: PrimaryResultDTO = Field(alias="primaryResult")
    inputs: dict[str, object]


class CapacityImpactDTO(DTOModel):
    strength: float
    muscular_endurance: float = Field(alias="muscularEndurance")
    relative_strength: float = Field(alias="relativeStrength")
    work_capacity: float = Field(alias="workCapacity")


class CapacityImpactMovementSplitDTO(DTOModel):
    movement_id: str = Field(alias="movementId")
    block_id: str = Field(alias="blockId")
    block_ord: int = Field(alias="blockOrd")
    movement_ord: int = Field(alias="movementOrd")
    impact: CapacityImpactDTO


class CapacityImpactBlockSplitDTO(DTOModel):
    block_id: str = Field(alias="blockId")
    block_ord: int = Field(alias="blockOrd")
    impact: CapacityImpactDTO


class CapacityImpactBreakdownDTO(DTOModel):
    total: CapacityImpactDTO
    by_movement: list[CapacityImpactMovementSplitDTO] = Field(default_factory=list, alias="byMovement")
    by_block: list[CapacityImpactBlockSplitDTO] = Field(default_factory=list, alias="byBlock")


class AttemptDTO(DTOModel):
    id: str
    athlete_id: str = Field(alias="athleteId")
    workout_id: str = Field(alias="workoutId")
    performed_at: str = Field(alias="performedAt")
    scale_code: ScaleCode = Field(alias="scaleCode")
    status: AttemptStatus
    score_norm: float | None = Field(default=None, alias="scoreNorm")
    impact_breakdown: CapacityImpactBreakdownDTO | None = Field(default=None, alias="impactBreakdown")


class CapacityDTO(DTOModel):
    type: CapacityType
    value: float
    confidence: Confidence
    last_updated_at: str = Field(alias="lastUpdatedAt")


class PulseExplainItemDTO(DTOModel):
    key: str
    message: str


class PulseDTO(DTOModel):
    value: float
    confidence: Confidence
    computed_at: str = Field(alias="computedAt")
    explain: list[PulseExplainItemDTO]


class AthleteCountsDTO(DTOModel):
    tests7d: int
    tests30d: int


class AthleteTrendDTO(DTOModel):
    type: CapacityType
    delta: float


class AthleteDashboardDTO(DTOModel):
    athlete_id: str = Field(alias="athleteId")
    gym_id: str = Field(alias="gymId")
    level: int
    level_band: LevelBand = Field(alias="levelBand")
    pulse: PulseDTO
    capacities: list[CapacityDTO]
    counts: AthleteCountsDTO
    trends30d: list[AthleteTrendDTO]
