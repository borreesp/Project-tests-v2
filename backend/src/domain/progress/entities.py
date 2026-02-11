from dataclasses import dataclass

from src.domain.shared.ids import UserId


@dataclass(slots=True)
class Progress:
    user_id: UserId
    completed_workouts: int
