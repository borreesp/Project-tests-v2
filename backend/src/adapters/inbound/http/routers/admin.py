from typing import Annotated

from fastapi import APIRouter, Depends

from src.adapters.inbound.http.deps import current_user_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.admin import (
    AdminChangeGymRequestDTO,
    AdminChangeGymResponseDTO,
    AdminCreateMovementRequestDTO,
    AdminCreateMovementResponseDTO,
)
from src.application.dtos.ranking import RecomputeRankingsResponseDTO
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.post("/movements", response_model=AdminCreateMovementResponseDTO)
async def admin_create_movement(
    payload: AdminCreateMovementRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> AdminCreateMovementResponseDTO:
    try:
        return service.admin_create_movement(current_user, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/athletes/{athlete_id}/change-gym", response_model=AdminChangeGymResponseDTO)
async def admin_change_athlete_gym(
    athlete_id: str,
    payload: AdminChangeGymRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> AdminChangeGymResponseDTO:
    try:
        return service.admin_change_athlete_gym(current_user, athlete_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/rankings/recompute", response_model=RecomputeRankingsResponseDTO)
async def admin_recompute_rankings(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> RecomputeRankingsResponseDTO:
    try:
        return service.recompute_rankings(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
