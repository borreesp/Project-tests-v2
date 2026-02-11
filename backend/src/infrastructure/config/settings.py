from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Backend API"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    cors_origins: list[str] = []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []

        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        if isinstance(value, list):
            return [origin.strip() for origin in value if origin.strip()]

        raise TypeError("CORS_ORIGINS must be a comma-separated string or a list of strings")


@lru_cache
def get_settings() -> Settings:
    return Settings()
