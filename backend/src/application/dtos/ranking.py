from pydantic import Field

from src.application.dtos.base import DTOModel
from src.adapters.outbound.persistence.models.enums import LeaderboardPeriod, LeaderboardScope, ScaleCode


class RankingQueryDTO(DTOModel):
    workout_id: str = Field(alias="workoutId")
    scope: LeaderboardScope
    period: LeaderboardPeriod
    scale_code: ScaleCode = Field(alias="scaleCode")


class LeaderboardEntryDTO(DTOModel):
    rank: int
    athlete_id: str = Field(alias="athleteId")
    display_name: str = Field(alias="displayName")
    best_score_norm: float = Field(alias="bestScoreNorm")


class LeaderboardDTO(DTOModel):
    scope: LeaderboardScope
    period: LeaderboardPeriod
    workout_id: str = Field(alias="workoutId")
    scale_code: ScaleCode = Field(alias="scaleCode")
    entries: list[LeaderboardEntryDTO]
    my_rank: int | None = Field(default=None, alias="myRank")


class RecomputeRankingsResponseDTO(DTOModel):
    status: str
    recomputed: int
