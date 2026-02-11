from typing import Annotated

from fastapi import APIRouter, Depends

from src.adapters.inbound.http.deps import current_user_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.athlete import AttemptDTO
from src.application.dtos.coach import (
    CoachAthleteDetailDTO,
    CoachAthleteSummaryDTO,
    CoachOverviewDTO,
    CoachWorkoutSummaryDTO,
    DeleteWorkoutResponseDTO,
    DuplicateWorkoutResponseDTO,
    IdealScoreGetResponseDTO,
    IdealScoreGymEntryDTO,
    IdealScoreScopeEntryDTO,
    IdealScoreUpsertRequestDTO,
    PublishWorkoutResponseDTO,
    RejectAttemptRequestDTO,
    ValidateAttemptResponseDTO,
    WorkoutCreateRequestDTO,
    WorkoutMutationResponseDTO,
    WorkoutUpdateRequestDTO,
)
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(prefix="/api/v1/coach", tags=["coach"])


@router.get("/overview", response_model=CoachOverviewDTO)
async def coach_overview(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> CoachOverviewDTO:
    try:
        return service.coach_overview(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/athletes", response_model=list[CoachAthleteSummaryDTO])
async def coach_athletes(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> list[CoachAthleteSummaryDTO]:
    try:
        return service.coach_athletes(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/athletes/{athlete_id}", response_model=CoachAthleteDetailDTO)
async def coach_athlete_detail(
    athlete_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> CoachAthleteDetailDTO:
    try:
        return service.coach_athlete_detail(current_user, athlete_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/attempts/{attempt_id}/validate", response_model=ValidateAttemptResponseDTO)
async def validate_attempt(
    attempt_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> ValidateAttemptResponseDTO:
    try:
        return service.validate_attempt(current_user, attempt_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/attempts/{attempt_id}/reject", response_model=AttemptDTO)
async def reject_attempt(
    attempt_id: str,
    payload: RejectAttemptRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> AttemptDTO:
    try:
        return service.reject_attempt(current_user, attempt_id, payload.reason)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/workouts", response_model=list[CoachWorkoutSummaryDTO])
async def coach_workouts(
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> list[CoachWorkoutSummaryDTO]:
    try:
        return service.coach_workouts(current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/workouts", response_model=WorkoutMutationResponseDTO)
async def create_workout(
    payload: WorkoutCreateRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> WorkoutMutationResponseDTO:
    try:
        return service.create_workout(current_user, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.put("/workouts/{workout_id}", response_model=WorkoutMutationResponseDTO)
async def update_workout(
    workout_id: str,
    payload: WorkoutUpdateRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> WorkoutMutationResponseDTO:
    try:
        return service.update_workout(current_user, workout_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/workouts/{workout_id}/duplicate", response_model=DuplicateWorkoutResponseDTO)
async def duplicate_workout(
    workout_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> DuplicateWorkoutResponseDTO:
    try:
        return service.duplicate_workout(current_user, workout_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.delete("/workouts/{workout_id}", response_model=DeleteWorkoutResponseDTO)
async def delete_workout(
    workout_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> DeleteWorkoutResponseDTO:
    try:
        return service.delete_workout(current_user, workout_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.get("/workouts/{workout_id}/ideal-scores", response_model=IdealScoreGetResponseDTO)
async def get_workout_ideal_scores(
    workout_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> IdealScoreGetResponseDTO:
    try:
        return service.get_workout_ideal_scores(current_user, workout_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.put("/workouts/{workout_id}/ideal-scores/community", response_model=IdealScoreScopeEntryDTO)
async def upsert_community_ideal_score(
    workout_id: str,
    payload: IdealScoreUpsertRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> IdealScoreScopeEntryDTO:
    try:
        return service.upsert_workout_community_ideal_score(current_user, workout_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.put("/workouts/{workout_id}/ideal-scores/gym/{gym_id}", response_model=IdealScoreGymEntryDTO)
async def upsert_gym_ideal_score(
    workout_id: str,
    gym_id: str,
    payload: IdealScoreUpsertRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> IdealScoreGymEntryDTO:
    try:
        return service.upsert_workout_gym_ideal_score(current_user, workout_id, gym_id, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/workouts/{workout_id}/publish", response_model=PublishWorkoutResponseDTO)
async def publish_workout(
    workout_id: str,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> PublishWorkoutResponseDTO:
    try:
        return service.publish_workout(current_user, workout_id)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
