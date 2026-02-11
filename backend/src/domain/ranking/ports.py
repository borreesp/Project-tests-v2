from typing import Protocol

from src.domain.ranking.entities import RankingEntry


class RankingRepositoryPort(Protocol):
    async def top(self, limit: int) -> list[RankingEntry]:
        ...
