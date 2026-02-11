from pydantic import Field

from src.application.dtos.base import DTOModel
from src.application.dtos.public import MovementDTO
from src.adapters.outbound.persistence.models.enums import MovementPattern, MovementUnit


class AdminCreateMovementRequestDTO(DTOModel):
    name: str
    pattern: MovementPattern
    unit_primary: MovementUnit = Field(alias="unitPrimary")
    requires_load: bool = Field(default=False, alias="requiresLoad")
    requires_bodyweight: bool = Field(default=False, alias="requiresBodyweight")


class AdminCreateMovementResponseDTO(MovementDTO):
    pass


class AdminChangeGymRequestDTO(DTOModel):
    gym_id: str = Field(alias="gymId")


class AdminChangeGymResponseDTO(DTOModel):
    athlete_id: str = Field(alias="athleteId")
    previous_gym_id: str | None = Field(default=None, alias="previousGymId")
    current_gym_id: str = Field(alias="currentGymId")
