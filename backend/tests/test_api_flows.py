from fastapi.testclient import TestClient

from src.application.services.runtime_service import get_runtime_service


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()


def _build_workout_payload(movement_id: str) -> dict:
    return {
        "title": "Squat Test Session",
        "description": "MVP test workout",
        "isTest": True,
        "type": "AMRAP",
        "visibility": "GYMS_ONLY",
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


def test_auth_login_refresh_logout_me(client: TestClient) -> None:
    login = _login(client, "athlete@local.com", "Athlete123!")
    access_token = login["accessToken"]
    refresh_token = login["refreshToken"]

    me_response = client.get("/api/v1/me", headers=_auth_headers(access_token))
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "ATHLETE"

    refresh_response = client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
    assert refresh_response.status_code == 200
    assert "accessToken" in refresh_response.json()

    logout_response = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": refresh_token},
        headers=_auth_headers(access_token),
    )
    assert logout_response.status_code == 200
    assert logout_response.json() == {"status": "ok"}


def test_invite_flow(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_access = coach_login["accessToken"]

    service = get_runtime_service()
    coach_user = next(user for user in service.users.values() if user.email == "coach@local.com")
    coach_gym_id = service._coach_gym_id(coach_user.id)  # noqa: SLF001
    assert coach_gym_id is not None

    invite_response = client.post(
        "/api/v1/auth/invitations",
        json={"email": "new-athlete@local.com", "gymId": coach_gym_id},
        headers=_auth_headers(coach_access),
    )
    assert invite_response.status_code == 200
    token = invite_response.json()["token"]

    register_response = client.post(
        "/api/v1/auth/register-from-invite",
        json={
            "token": token,
            "password": "NewAthlete123!",
            "athlete": {"sex": "MALE"},
        },
    )
    assert register_response.status_code == 200
    assert register_response.json()["role"] == "ATHLETE"


def test_create_workout_create_attempt_submit_validate_dashboard(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movements_response = client.get("/api/v1/movements")
    assert movements_response.status_code == 200
    movement_id = movements_response.json()[0]["id"]

    create_workout_response = client.post(
        "/api/v1/coach/workouts",
        json=_build_workout_payload(movement_id),
        headers=coach_headers,
    )
    assert create_workout_response.status_code == 200
    workout_id = create_workout_response.json()["id"]

    publish_response = client.post(f"/api/v1/coach/workouts/{workout_id}/publish", headers=coach_headers)
    assert publish_response.status_code == 200

    athlete_login = _login(client, "athlete@local.com", "Athlete123!")
    athlete_headers = _auth_headers(athlete_login["accessToken"])

    workouts_response = client.get("/api/v1/workouts", headers=athlete_headers)
    assert workouts_response.status_code == 200
    visible_ids = {item["id"] for item in workouts_response.json()}
    assert workout_id in visible_ids

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
    assert submit_response.json()["status"] == "SUBMITTED"

    validate_response = client.post(f"/api/v1/coach/attempts/{attempt_id}/validate", headers=coach_headers)
    assert validate_response.status_code == 200
    assert validate_response.json()["status"] == "VALIDATED"

    dashboard_response = client.get("/api/v1/athlete/dashboard", headers=athlete_headers)
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    assert dashboard["counts"]["tests30d"] >= 1
    assert len(dashboard["capacities"]) == 4
