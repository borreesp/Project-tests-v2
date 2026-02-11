from dataclasses import dataclass

from src.domain.shared.ids import UserId


@dataclass(slots=True)
class RankingEntry:
    user_id: UserId
    points: int
