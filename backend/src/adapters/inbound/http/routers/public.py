from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.adapters.inbound.http.deps import current_user_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.auth import MeResponseDTO
from src.application.dtos.common import StatusResponseDTO
from src.application.dtos.public import MovementDTO, WorkoutDefinitionDetailDTO, WorkoutDefinitionSummaryDTO
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(tags=["public"])


@router.get("/health", response_model=StatusResponseDTO)
async def health() -> StatusResponseDTO:
    return StatusResponseDTO(status="ok")


@router.get("/api/v1/me", response_model=MeResponseDTO)
async def me(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> MeResponseDTO:
    try:
        return service.get_me(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/api/v1/movements", response_model=list[MovementDTO])
async def list_movements(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    query: Annotated[str | None, Query()] = None,
) -> list[MovementDTO]:
    try:
        return service.list_movements(query)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/api/v1/workouts", response_model=list[WorkoutDefinitionSummaryDTO])
async def list_workouts(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> list[WorkoutDefinitionSummaryDTO]:
    try:
        return service.list_workouts(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/api/v1/workouts/{workout_id}", response_model=WorkoutDefinitionDetailDTO)
async def get_workout_detail(
    workout_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> WorkoutDefinitionDetailDTO:
    try:
        return service.get_workout_detail(current_user, workout_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
