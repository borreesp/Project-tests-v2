import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


@pytest.mark.integration
@pytest.mark.asyncio
async def test_alembic_head_applied(db_engine: AsyncEngine) -> None:
    async with db_engine.connect() as connection:
        version_result = await connection.execute(text("SELECT version_num FROM alembic_version"))
        version = version_result.scalar_one()

        tables_result = await connection.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        )
        tables = {row[0] for row in tables_result.fetchall()}

    assert version == "0002_score_type_weights"
    assert {"users", "workout_definitions", "attempts", "workout_capacity_weights"}.issubset(tables)
