from fastapi.testclient import TestClient

from src.application.services.runtime_service import get_runtime_service


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()


def _build_test_workout_payload(movement_id: str) -> dict:
    return {
        "title": "Demo Seed Coherence Test",
        "description": "Workout de prueba para verificar coherencia demo",
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
                        "reps": 30,
                        "loadRule": "ATHLETE_CHOICE",
                        "notes": "",
                    }
                ],
            }
        ],
    }


def _create_completed_demo_attempt(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movements_response = client.get("/api/v1/movements")
    assert movements_response.status_code == 200
    movement_id = movements_response.json()[0]["id"]

    create_workout_response = client.post(
        "/api/v1/coach/workouts",
        json=_build_test_workout_payload(movement_id),
        headers=coach_headers,
    )
    assert create_workout_response.status_code == 200
    workout_id = create_workout_response.json()["id"]

    publish_response = client.post(f"/api/v1/coach/workouts/{workout_id}/publish", headers=coach_headers)
    assert publish_response.status_code == 200

    athlete_login = _login(client, "athlete@local.com", "Athlete123!")
    athlete_headers = _auth_headers(athlete_login["accessToken"])

    create_attempt_response = client.post(
        f"/api/v1/athlete/workouts/{workout_id}/attempt",
        json={"scaleCode": "RX"},
        headers=athlete_headers,
    )
    assert create_attempt_response.status_code == 200
    attempt_id = create_attempt_response.json()["attemptId"]

    submit_response = client.post(
        f"/api/v1/athlete/attempts/{attempt_id}/submit-result",
        json={
            "primaryResult": {"type": "REPS", "repsTotal": 120},
            "inputs": {"loadKgTotal": 1},
        },
        headers=athlete_headers,
    )
    assert submit_response.status_code == 200

    validate_response = client.post(f"/api/v1/coach/attempts/{attempt_id}/validate", headers=coach_headers)
    assert validate_response.status_code == 200


def test_seed_demo_profiles_have_required_core_data(client: TestClient) -> None:
    service = get_runtime_service()

    demo_athlete_user = next((user for user in service.users.values() if user.email == "athlete@local.com"), None)
    assert demo_athlete_user is not None

    athlete_profile = next(
        (profile for profile in service.athlete_profiles.values() if profile.user_id == demo_athlete_user.id),
        None,
    )
    assert athlete_profile is not None
    assert athlete_profile.current_gym_id in service.gyms
    assert athlete_profile.level >= 1
    assert athlete_profile.level_band is not None

    athlete_membership = next(
        (
            membership
            for membership in service.memberships.values()
            if membership.user_id == demo_athlete_user.id and membership.active
        ),
        None,
    )
    assert athlete_membership is not None
    assert athlete_membership.gym_id == athlete_profile.current_gym_id


def test_seed_demo_athletes_with_completed_tests_have_capacities(client: TestClient) -> None:
    _create_completed_demo_attempt(client)
    service = get_runtime_service()

    demo_users = {
        user.id: user
        for user in service.users.values()
        if user.email.endswith("@local.com") and user.role.value == "ATHLETE"
    }
    assert demo_users

    athlete_profiles_by_user = {profile.user_id: profile for profile in service.athlete_profiles.values()}

    completed_attempts_by_user_id: dict[str, int] = {}
    for attempt in service.attempts.values():
        athlete_profile = service.athlete_profiles.get(attempt.athlete_id)
        if athlete_profile is None:
            continue
        if athlete_profile.user_id not in demo_users:
            continue
        if attempt.status.value != "VALIDATED":
            continue
        completed_attempts_by_user_id[athlete_profile.user_id] = completed_attempts_by_user_id.get(athlete_profile.user_id, 0) + 1

    assert completed_attempts_by_user_id, "Debe existir al menos un atleta demo con attempts completados"

    for user_id in completed_attempts_by_user_id:
        profile = athlete_profiles_by_user[user_id]
        profile_capacities = [
            capacity
            for (athlete_id, _capacity_type), capacity in service.capacities.items()
            if athlete_id == profile.id
        ]
        assert profile_capacities, "Atleta demo con tests completados no puede quedar sin capacidades"
        assert all(capacity.value >= 0 for capacity in profile_capacities)
        assert profile.current_gym_id in service.gyms
        assert profile.level >= 1
