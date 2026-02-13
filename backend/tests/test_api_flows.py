from fastapi.testclient import TestClient
from jose import jwt

from src.application.services.runtime_service import get_runtime_service
from src.infrastructure.config.settings import get_settings


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


def test_me_returns_401_with_expired_access_token(client: TestClient) -> None:
    service = get_runtime_service()
    settings = get_settings()
    athlete_user = next(user for user in service.users.values() if user.email == "athlete@local.com")
    expired_token = jwt.encode(
        {"sub": athlete_user.id, "exp": 1},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    me_response = client.get("/api/v1/me", headers=_auth_headers(expired_token))
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "Invalid token"


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
    submit_payload = submit_response.json()
    assert submit_payload["status"] == "SUBMITTED"
    assert submit_payload["impactBreakdown"]["total"]["strength"] == 0.4
    assert len(submit_payload["impactBreakdown"]["byMovement"]) == 1
    assert len(submit_payload["impactBreakdown"]["byBlock"]) == 1

    validate_response = client.post(f"/api/v1/coach/attempts/{attempt_id}/validate", headers=coach_headers)
    assert validate_response.status_code == 200
    validate_payload = validate_response.json()
    assert validate_payload["status"] == "VALIDATED"
    assert validate_payload["impactBreakdown"]["total"]["strength"] == 0.4

    dashboard_response = client.get("/api/v1/athlete/dashboard", headers=athlete_headers)
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    assert dashboard["counts"]["tests30d"] >= 1
    assert len(dashboard["capacities"]) == 4


def test_coach_workouts_list_and_duplicate(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movements_response = client.get("/api/v1/movements")
    assert movements_response.status_code == 200
    movement_id = movements_response.json()[0]["id"]

    create_response = client.post(
        "/api/v1/coach/workouts",
        json=_build_workout_payload(movement_id),
        headers=coach_headers,
    )
    assert create_response.status_code == 200
    workout = create_response.json()
    assert workout["scoreType"] == "REPS"

    list_response = client.get("/api/v1/coach/workouts", headers=coach_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == workout["id"] and item["scoreType"] == "REPS" for item in list_response.json())

    duplicate_response = client.post(f"/api/v1/coach/workouts/{workout['id']}/duplicate", headers=coach_headers)
    assert duplicate_response.status_code == 200
    duplicated = duplicate_response.json()
    assert duplicated["id"] != workout["id"]


def test_create_test_workout_requires_score_type_and_capacity_weights(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
    payload = _build_workout_payload(movement_id)
    payload.pop("scoreType")
    payload["capacityWeights"] = [{"capacityType": "STRENGTH", "weight": 0.5}]

    create_response = client.post("/api/v1/coach/workouts", json=payload, headers=coach_headers)
    assert create_response.status_code == 422


def test_create_workout_rejects_unknown_movement_id(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    payload = _build_workout_payload("00000000-0000-0000-0000-000000000000")

    create_response = client.post("/api/v1/coach/workouts", json=payload, headers=coach_headers)
    assert create_response.status_code == 422
    assert "Movement not found" in create_response.json()["detail"]


def test_create_attempt_rejects_invalid_payload(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
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

    create_attempt_response = client.post(
        f"/api/v1/athlete/workouts/{workout_id}/attempt",
        json={},
        headers=athlete_headers,
    )
    assert create_attempt_response.status_code == 422


def test_create_workout_rejects_is_test_false(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
    payload = _build_workout_payload(movement_id)
    payload["isTest"] = False

    create_response = client.post("/api/v1/coach/workouts", json=payload, headers=coach_headers)
    assert create_response.status_code == 400


def test_athlete_dashboard_and_rankings_schema_after_attempt_validation(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
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
            "primaryResult": {"type": "REPS", "repsTotal": 98},
            "inputs": {"loadKgTotal": 1},
        },
        headers=athlete_headers,
    )
    assert submit_response.status_code == 200

    validate_response = client.post(f"/api/v1/coach/attempts/{attempt_id}/validate", headers=coach_headers)
    assert validate_response.status_code == 200

    dashboard_response = client.get("/api/v1/athlete/dashboard", headers=athlete_headers)
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    assert dashboard["athleteId"]
    assert dashboard["level"] >= 1
    assert dashboard["levelBand"] in {"BEGINNER", "ATHLETE", "PRO"}
    assert len(dashboard["capacities"]) == 4
    assert set(dashboard["counts"]) == {"tests7d", "tests30d"}

    ranking_response = client.get(
        "/api/v1/rankings",
        params={
            "workoutId": workout_id,
            "scope": "GYM",
            "period": "ALL_TIME",
            "scaleCode": "RX",
        },
        headers=athlete_headers,
    )
    assert ranking_response.status_code == 200
    ranking = ranking_response.json()
    assert ranking["workoutId"] == workout_id
    assert ranking["scope"] == "GYM"
    assert ranking["period"] == "ALL_TIME"
    assert ranking["scaleCode"] == "RX"
    assert isinstance(ranking["entries"], list)
    assert ranking["myRank"] == 1
    assert ranking["entries"][0]["athleteId"] == dashboard["athleteId"]


def test_ideal_scores_permissions_and_upserts(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    admin_login = _login(client, "admin@local.com", "Admin123!")
    admin_headers = _auth_headers(admin_login["accessToken"])

    movements_response = client.get("/api/v1/movements")
    assert movements_response.status_code == 200
    movement_id = movements_response.json()[0]["id"]

    create_response = client.post("/api/v1/coach/workouts", json=_build_workout_payload(movement_id), headers=coach_headers)
    assert create_response.status_code == 200
    workout_id = create_response.json()["id"]

    service = get_runtime_service()
    coach_user = next(user for user in service.users.values() if user.email == "coach@local.com")
    coach_gym_id = service._coach_gym_id(coach_user.id)  # noqa: SLF001
    assert coach_gym_id is not None

    coach_gym_ideal_response = client.put(
        f"/api/v1/coach/workouts/{workout_id}/ideal-scores/gym/{coach_gym_id}",
        json={"idealScoreBase": 8500, "notes": "Gym baseline"},
        headers=coach_headers,
    )
    assert coach_gym_ideal_response.status_code == 200
    assert coach_gym_ideal_response.json()["gymId"] == coach_gym_id

    coach_community_response = client.put(
        f"/api/v1/coach/workouts/{workout_id}/ideal-scores/community",
        json={"idealScoreBase": 9000, "notes": "Community baseline"},
        headers=coach_headers,
    )
    assert coach_community_response.status_code == 403

    admin_community_response = client.put(
        f"/api/v1/coach/workouts/{workout_id}/ideal-scores/community",
        json={"idealScoreBase": 9200, "notes": "Community baseline"},
        headers=admin_headers,
    )
    assert admin_community_response.status_code == 200
    assert admin_community_response.json()["idealScoreBase"] == 9200

    get_response = client.get(f"/api/v1/coach/workouts/{workout_id}/ideal-scores", headers=coach_headers)
    assert get_response.status_code == 200
    payload = get_response.json()
    assert payload["community"]["idealScoreBase"] == 9200
    assert any(item["gymId"] == coach_gym_id for item in payload["gyms"])


def test_delete_test_workout_success_without_attempts(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
    create_response = client.post("/api/v1/coach/workouts", json=_build_workout_payload(movement_id), headers=coach_headers)
    assert create_response.status_code == 200
    workout_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/coach/workouts/{workout_id}", headers=coach_headers)
    assert delete_response.status_code == 200
    assert delete_response.json() == {"status": "ok"}

    list_response = client.get("/api/v1/coach/workouts", headers=coach_headers)
    assert list_response.status_code == 200
    assert all(item["id"] != workout_id for item in list_response.json())


def test_delete_test_workout_returns_409_with_attempts(client: TestClient) -> None:
    coach_login = _login(client, "coach@local.com", "Coach123!")
    coach_headers = _auth_headers(coach_login["accessToken"])

    athlete_login = _login(client, "athlete@local.com", "Athlete123!")
    athlete_headers = _auth_headers(athlete_login["accessToken"])

    movement_id = client.get("/api/v1/movements").json()[0]["id"]
    create_response = client.post("/api/v1/coach/workouts", json=_build_workout_payload(movement_id), headers=coach_headers)
    assert create_response.status_code == 200
    workout_id = create_response.json()["id"]

    publish_response = client.post(f"/api/v1/coach/workouts/{workout_id}/publish", headers=coach_headers)
    assert publish_response.status_code == 200

    create_attempt_response = client.post(
        f"/api/v1/athlete/workouts/{workout_id}/attempt",
        json={"scaleCode": "RX"},
        headers=athlete_headers,
    )
    assert create_attempt_response.status_code == 200

    delete_response = client.delete(f"/api/v1/coach/workouts/{workout_id}", headers=coach_headers)
    assert delete_response.status_code == 409
    assert delete_response.json()["detail"] == "No se puede eliminar porque tiene resultados asociados."
