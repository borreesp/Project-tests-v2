from fastapi.testclient import TestClient
import pytest

from src.application.services.runtime_service import get_runtime_service


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()


def _build_workout_payload(movement_id: str) -> dict:
    return {
        "title": "QA smoke test workout",
        "description": "basic flow",
        "isTest": True,
        "type": "AMRAP",
        "visibility": "GYMS_ONLY",
        "scoreType": "REPS",
        "capacityWeights": [
            {"capacityType": "STRENGTH", "weight": 0.4},
            {"capacityType": "MUSCULAR_ENDURANCE", "weight": 0.3},
            {"capacityType": "RELATIVE_STRENGTH", "weight": 0.2},
            {"capacityType": "WORK_CAPACITY", "weight": 0.1},
        ],
        "scales": [
            {"code": "RX", "label": "RX", "notes": "", "referenceLoads": {}},
            {"code": "SCALED", "label": "Scaled", "notes": "", "referenceLoads": {}},
        ],
        "blocks": [
            {
                "ord": 1,
                "name": "Main",
                "blockType": "WORK",
                "repeatInt": 1,
                "timeSeconds": 600,
                "movements": [
                    {
                        "ord": 1,
                        "movementId": movement_id,
                        "reps": 20,
                        "loadRule": "ATHLETE_CHOICE",
                        "notes": "",
                    }
                ],
            }
        ],
    }


def _set_gym_ideal_score(client: TestClient, coach_headers: dict[str, str], workout_id: str) -> None:
    service = get_runtime_service()
    coach_user = next(user for user in service.users.values() if user.email == "coach@local.com")
    coach_gym_id = service._coach_gym_id(coach_user.id)  # noqa: SLF001
    assert coach_gym_id is not None

    response = client.put(
        f"/api/v1/coach/workouts/{workout_id}/ideal-scores/gym/{coach_gym_id}",
        json={"idealScoreBase": 8500, "notes": "Gym baseline"},
        headers=coach_headers,
    )
    assert response.status_code == 200


@pytest.mark.integration
def test_create_athlete_workout_attempt_and_read_from_api(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
    create_workout = client.post("/api/v1/coach/workouts", json=_build_workout_payload(movement_id), headers=coach_headers)
    assert create_workout.status_code == 200
    workout_id = create_workout.json()["id"]

    _set_gym_ideal_score(client, coach_headers, workout_id)

    publish_response = client.post(f"/api/v1/coach/workouts/{workout_id}/publish", headers=coach_headers)
    assert publish_response.status_code == 200

    athlete_login = _login(client, "athlete@local.com", "Athlete123!")
    athlete_headers = _auth_headers(athlete_login["accessToken"])

    workouts_response = client.get("/api/v1/workouts", headers=athlete_headers)
    assert workouts_response.status_code == 200
    assert any(workout["id"] == workout_id for workout in workouts_response.json())

    create_attempt_response = client.post(
        f"/api/v1/athlete/workouts/{workout_id}/attempt",
        json={"scaleCode": "RX"},
        headers=athlete_headers,
    )
    assert create_attempt_response.status_code == 200
    attempt_id = create_attempt_response.json()["attemptId"]

    submit_response = client.post(
        f"/api/v1/athlete/attempts/{attempt_id}/submit-result",
        json={"primaryResult": {"type": "REPS", "repsTotal": 100}, "inputs": {"loadKgTotal": 1}},
        headers=athlete_headers,
    )
    assert submit_response.status_code == 200

    attempts_response = client.get("/api/v1/athlete/attempts", headers=athlete_headers)
    assert attempts_response.status_code == 200
    assert any(attempt["id"] == attempt_id for attempt in attempts_response.json())
