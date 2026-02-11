from typing import Protocol

from src.domain.shared.ids import WorkoutId
from src.domain.workouts.entities import Workout


class WorkoutRepositoryPort(Protocol):
    async def get_by_id(self, workout_id: WorkoutId) -> Workout | None:
        ...
