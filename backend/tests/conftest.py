import pytest
from fastapi.testclient import TestClient

from src.adapters.inbound.http.main import app
from src.application.services.runtime_service import reset_runtime_service


@pytest.fixture(autouse=True)
def reset_runtime_state() -> None:
    reset_runtime_service()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
