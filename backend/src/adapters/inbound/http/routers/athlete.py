from typing import Annotated

from fastapi import APIRouter, Depends

from src.adapters.inbound.http.deps import current_user_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.athlete import (
    AthleteDashboardDTO,
    AttemptDTO,
    CreateAttemptRequestDTO,
    CreateAttemptResponseDTO,
    SubmitResultRequestDTO,
)
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(prefix="/api/v1/athlete", tags=["athlete"])


@router.get("/dashboard", response_model=AthleteDashboardDTO)
async def athlete_dashboard(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> AthleteDashboardDTO:
    try:
        return service.get_athlete_dashboard(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/workouts/{workout_id}/attempt", response_model=CreateAttemptResponseDTO)
async def create_attempt(
    workout_id: str,
    payload: CreateAttemptRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> CreateAttemptResponseDTO:
    try:
        return service.create_attempt(current_user, workout_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/attempts/{attempt_id}/submit-result", response_model=AttemptDTO)
async def submit_attempt_result(
    attempt_id: str,
    payload: SubmitResultRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> AttemptDTO:
    try:
        return service.submit_attempt_result(current_user, attempt_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
