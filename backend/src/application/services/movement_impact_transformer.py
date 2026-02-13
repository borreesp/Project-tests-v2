from __future__ import annotations

from dataclasses import dataclass

from src.adapters.outbound.persistence.models.enums import CapacityType, MovementPattern

_DEFAULT_IMPACT = 1.0 / len(CapacityType)

_PATTERN_CAPACITY_WEIGHTS: dict[MovementPattern, dict[CapacityType, float]] = {
    MovementPattern.SQUAT: {
        CapacityType.STRENGTH: 0.55,
        CapacityType.MUSCULAR_ENDURANCE: 0.25,
        CapacityType.RELATIVE_STRENGTH: 0.15,
        CapacityType.WORK_CAPACITY: 0.05,
    },
    MovementPattern.HINGE: {
        CapacityType.STRENGTH: 0.55,
        CapacityType.MUSCULAR_ENDURANCE: 0.20,
        CapacityType.RELATIVE_STRENGTH: 0.20,
        CapacityType.WORK_CAPACITY: 0.05,
    },
    MovementPattern.PUSH: {
        CapacityType.STRENGTH: 0.35,
        CapacityType.MUSCULAR_ENDURANCE: 0.45,
        CapacityType.RELATIVE_STRENGTH: 0.15,
        CapacityType.WORK_CAPACITY: 0.05,
    },
    MovementPattern.PULL: {
        CapacityType.STRENGTH: 0.25,
        CapacityType.MUSCULAR_ENDURANCE: 0.20,
        CapacityType.RELATIVE_STRENGTH: 0.50,
        CapacityType.WORK_CAPACITY: 0.05,
    },
    MovementPattern.CARRY: {
        CapacityType.STRENGTH: 0.25,
        CapacityType.MUSCULAR_ENDURANCE: 0.20,
        CapacityType.RELATIVE_STRENGTH: 0.10,
        CapacityType.WORK_CAPACITY: 0.45,
    },
    MovementPattern.CORE: {
        CapacityType.STRENGTH: 0.05,
        CapacityType.MUSCULAR_ENDURANCE: 0.40,
        CapacityType.RELATIVE_STRENGTH: 0.20,
        CapacityType.WORK_CAPACITY: 0.35,
    },
    MovementPattern.LOCOMOTION: {
        CapacityType.STRENGTH: 0.05,
        CapacityType.MUSCULAR_ENDURANCE: 0.25,
        CapacityType.RELATIVE_STRENGTH: 0.10,
        CapacityType.WORK_CAPACITY: 0.60,
    },
    MovementPattern.OTHER: {
        CapacityType.STRENGTH: _DEFAULT_IMPACT,
        CapacityType.MUSCULAR_ENDURANCE: _DEFAULT_IMPACT,
        CapacityType.RELATIVE_STRENGTH: _DEFAULT_IMPACT,
        CapacityType.WORK_CAPACITY: _DEFAULT_IMPACT,
    },
}


@dataclass(slots=True)
class MovementImpactInput:
    movement_id: str
    pattern: MovementPattern
    reps: int | None = None
    meters: int | None = None
    seconds: int | None = None
    calories: int | None = None


def transform_movements_to_capacity_impact(movements: list[MovementImpactInput]) -> dict[CapacityType, float]:
    if not movements:
        return {capacity: _DEFAULT_IMPACT for capacity in CapacityType}

    raw_impact = {capacity: 0.0 for capacity in CapacityType}

    for movement in movements:
        pattern_weights = _PATTERN_CAPACITY_WEIGHTS[movement.pattern]
        movement_volume = _movement_volume(movement)
        for capacity, weight in pattern_weights.items():
            raw_impact[capacity] += weight * movement_volume

    total_impact = sum(raw_impact.values())
    if total_impact <= 0:
        return {capacity: _DEFAULT_IMPACT for capacity in CapacityType}

    return {capacity: raw_impact[capacity] / total_impact for capacity in CapacityType}


def compute_raw_movement_impact(movement: MovementImpactInput) -> dict[CapacityType, float]:
    pattern_weights = _PATTERN_CAPACITY_WEIGHTS[movement.pattern]
    movement_volume = _movement_volume(movement)
    return {capacity: weight * movement_volume for capacity, weight in pattern_weights.items()}


def normalize_capacity_impact(raw_impact: dict[CapacityType, float]) -> dict[CapacityType, float]:
    total_impact = sum(raw_impact.values())
    if total_impact <= 0:
        return {capacity: _DEFAULT_IMPACT for capacity in CapacityType}
    return {capacity: raw_impact[capacity] / total_impact for capacity in CapacityType}


def _movement_volume(movement: MovementImpactInput) -> float:
    reps = float(movement.reps or 0)
    meters = float(movement.meters or 0) / 10.0
    seconds = float(movement.seconds or 0) / 30.0
    calories = float(movement.calories or 0) * 2.0

    computed = reps + meters + seconds + calories
    if computed <= 0:
        return 1.0
    return computed
