from dataclasses import dataclass

from src.domain.shared.ids import AttemptId, UserId, WorkoutId


@dataclass(slots=True)
class Attempt:
    id: AttemptId
    user_id: UserId
    workout_id: WorkoutId
    score: int
