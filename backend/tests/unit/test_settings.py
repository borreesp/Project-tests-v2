import pytest

from src.infrastructure.config.settings import Settings


@pytest.mark.unit
def test_parse_cors_origins_from_comma_separated_string() -> None:
    settings = Settings(CORS_ORIGINS="http://localhost:3000, http://127.0.0.1:3000")
    assert settings.cors_origins == ["http://localhost:3000", "http://127.0.0.1:3000"]
