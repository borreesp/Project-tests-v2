import pytest
from fastapi.testclient import TestClient

from src.adapters.inbound.http.main import app

client = TestClient(app)


@pytest.mark.asyncio
async def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
