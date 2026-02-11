from dataclasses import dataclass

from src.domain.shared.ids import OrgId, WorkoutId


@dataclass(slots=True)
class Workout:
    id: WorkoutId
    org_id: OrgId
    name: str
