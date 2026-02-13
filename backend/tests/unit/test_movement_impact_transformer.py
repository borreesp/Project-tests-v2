from __future__ import annotations

import pytest

from src.adapters.outbound.persistence.models.enums import CapacityType, MovementPattern
from src.application.services.movement_impact_transformer import (
    MovementImpactInput,
    transform_movements_to_capacity_impact,
)


def test_transform_returns_normalized_distribution() -> None:
    impacts = transform_movements_to_capacity_impact(
        [
            MovementImpactInput(movement_id="m1", pattern=MovementPattern.SQUAT, reps=30),
            MovementImpactInput(movement_id="m2", pattern=MovementPattern.LOCOMOTION, meters=400),
            MovementImpactInput(movement_id="m3", pattern=MovementPattern.PULL, seconds=120),
        ]
    )

    assert set(impacts.keys()) == set(CapacityType)
    assert sum(impacts.values()) == pytest.approx(1.0, abs=1e-9)


def test_transform_never_returns_negative_values() -> None:
    impacts = transform_movements_to_capacity_impact(
        [
            MovementImpactInput(movement_id="m1", pattern=MovementPattern.CARRY, calories=80),
            MovementImpactInput(movement_id="m2", pattern=MovementPattern.CORE, reps=40),
        ]
    )

    assert all(value >= 0.0 for value in impacts.values())


def test_transform_handles_empty_movements_with_uniform_distribution() -> None:
    impacts = transform_movements_to_capacity_impact([])

    assert impacts == {
        CapacityType.STRENGTH: pytest.approx(0.25),
        CapacityType.MUSCULAR_ENDURANCE: pytest.approx(0.25),
        CapacityType.RELATIVE_STRENGTH: pytest.approx(0.25),
        CapacityType.WORK_CAPACITY: pytest.approx(0.25),
    }
    assert sum(impacts.values()) == pytest.approx(1.0, abs=1e-12)
