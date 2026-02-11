from pydantic import Field

from src.application.dtos.base import DTOModel
from src.adapters.outbound.persistence.models.enums import (
    BlockType,
    LoadRule,
    MovementPattern,
    MovementUnit,
    ScaleCode,
    WorkoutType,
    WorkoutVisibility,
)


class MovementDTO(DTOModel):
    id: str
    name: str
    pattern: MovementPattern
    unit_primary: MovementUnit = Field(alias="unitPrimary")
    requires_load: bool = Field(alias="requiresLoad")
    requires_bodyweight: bool = Field(alias="requiresBodyweight")


class WorkoutDefinitionSummaryDTO(DTOModel):
    id: str
    title: str
    is_test: bool = Field(alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    published_at: str | None = Field(default=None, alias="publishedAt")


class WorkoutScaleDTO(DTOModel):
    code: ScaleCode
    label: str
    notes: str
    reference_loads: dict[str, object] = Field(alias="referenceLoads")


class WorkoutDetailBlockMovementDTO(DTOModel):
    id: str
    ord: int
    movement: MovementDTO
    reps: int | None = None
    meters: int | None = None
    seconds: int | None = None
    calories: int | None = None
    load_rule: LoadRule = Field(alias="loadRule")
    notes: str
    box_height_cm: int | None = Field(default=None, alias="boxHeightCm")


class WorkoutDetailBlockDTO(DTOModel):
    id: str
    ord: int
    name: str
    block_type: BlockType = Field(alias="blockType")
    repeat_int: int = Field(alias="repeatInt")
    time_seconds: int | None = Field(default=None, alias="timeSeconds")
    cap_seconds: int | None = Field(default=None, alias="capSeconds")
    movements: list[WorkoutDetailBlockMovementDTO]


class WorkoutDefinitionDetailDTO(DTOModel):
    id: str
    title: str
    description: str
    is_test: bool = Field(alias="isTest")
    type: WorkoutType
    visibility: WorkoutVisibility
    scales: list[WorkoutScaleDTO]
    blocks: list[WorkoutDetailBlockDTO]
