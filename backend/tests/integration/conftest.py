import os
import subprocess
from collections.abc import Generator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


@pytest.fixture(scope="session")
def test_database_url() -> str:
    return os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/app_test")


@pytest.fixture(scope="session")
def migrated_database(test_database_url: str) -> Generator[None, None, None]:
    env = os.environ.copy()
    env["DATABASE_URL"] = test_database_url

    subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd="backend",
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    try:
        yield
    finally:
        subprocess.run(
            ["alembic", "downgrade", "base"],
            cwd="backend",
            env=env,
            check=True,
            capture_output=True,
            text=True,
        )


@pytest.fixture(scope="session")
async def db_engine(migrated_database: None, test_database_url: str) -> Generator[AsyncEngine, None, None]:
    engine = create_async_engine(test_database_url, future=True)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture(autouse=True)
async def clean_tables(db_engine: AsyncEngine) -> Generator[None, None, None]:
    table_names = (
        "workout_capacity_weights",
        "capacity_history",
        "ranking_snapshots",
        "attempts",
        "workout_assignments",
        "workout_movements",
        "workout_blocks",
        "workout_scales",
        "workout_ideal_scores",
        "workout_definitions",
        "movement_prs",
        "movements",
        "athlete_profiles",
        "coach_profiles",
        "invitations",
        "gym_memberships",
        "gyms",
        "refresh_tokens",
        "users",
    )

    async with db_engine.begin() as connection:
        await connection.execute(text(f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE"))

    yield
