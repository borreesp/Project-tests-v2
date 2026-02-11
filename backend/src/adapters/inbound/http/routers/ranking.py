from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.adapters.inbound.http.deps import current_user_optional_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.ranking import LeaderboardDTO, RankingQueryDTO
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(tags=["ranking"])


def ranking_query_dep(
    workout_id: Annotated[str, Query(alias="workoutId")],
    scope: Annotated[str, Query()],
    period: Annotated[str, Query()],
    scale_code: Annotated[str, Query(alias="scaleCode")],
) -> RankingQueryDTO:
    return RankingQueryDTO(workoutId=workout_id, scope=scope, period=period, scaleCode=scale_code)


@router.get("/api/v1/rankings", response_model=LeaderboardDTO)
async def get_rankings(
    query: Annotated[RankingQueryDTO, Depends(ranking_query_dep)],
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord | None, Depends(current_user_optional_dep)],
) -> LeaderboardDTO:
    try:
        return service.get_rankings(query.workout_id, query.scope, query.period, query.scale_code, current_user)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
