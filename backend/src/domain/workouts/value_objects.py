from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class WorkoutName:
    value: str
