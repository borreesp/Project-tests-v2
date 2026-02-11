import asyncio
from typing import TypedDict
from uuid import UUID, uuid4

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.outbound.persistence.models import (
    AthleteProfileModel,
    CoachProfileModel,
    GymMembershipModel,
    GymModel,
    GymRole,
    LevelBand,
    MovementModel,
    MovementPattern,
    MovementUnit,
    UserModel,
    UserRole,
    UserStatus,
)
from src.infrastructure.db.session import SessionLocal


class MovementSeed(TypedDict):
    name: str
    pattern: MovementPattern
    unit_primary: MovementUnit
    requires_load: bool
    requires_bodyweight: bool


PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
GYM_NAME = "HybridForce HQ"

MOVEMENTS: list[MovementSeed] = [
    {"name": "Air Squat", "pattern": MovementPattern.SQUAT, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Back Squat", "pattern": MovementPattern.SQUAT, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Front Squat", "pattern": MovementPattern.SQUAT, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Goblet Squat", "pattern": MovementPattern.SQUAT, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Thruster", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Deadlift", "pattern": MovementPattern.HINGE, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Romanian Deadlift", "pattern": MovementPattern.HINGE, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Sumo Deadlift High Pull", "pattern": MovementPattern.HINGE, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Kettlebell Swing", "pattern": MovementPattern.HINGE, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Dumbbell Snatch", "pattern": MovementPattern.HINGE, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Walking Lunge", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Reverse Lunge", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Front Rack Lunge", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Burpee", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Box Jump", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Step Up", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Wall Ball Shot", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Row Erg", "pattern": MovementPattern.PULL, "unit_primary": MovementUnit.METERS, "requires_load": False, "requires_bodyweight": False},
    {"name": "SkiErg", "pattern": MovementPattern.PULL, "unit_primary": MovementUnit.METERS, "requires_load": False, "requires_bodyweight": False},
    {"name": "Assault Bike", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.CALORIES, "requires_load": False, "requires_bodyweight": False},
    {"name": "Echo Bike", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.CALORIES, "requires_load": False, "requires_bodyweight": False},
    {"name": "Bike Erg", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.METERS, "requires_load": False, "requires_bodyweight": False},
    {"name": "Run", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.METERS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Sandbag Carry", "pattern": MovementPattern.CARRY, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Farmer Carry", "pattern": MovementPattern.CARRY, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Suitcase Carry", "pattern": MovementPattern.CARRY, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Overhead Carry", "pattern": MovementPattern.CARRY, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Sled Push", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Sled Pull", "pattern": MovementPattern.PULL, "unit_primary": MovementUnit.METERS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Dumbbell Push Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "DB Push Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Barbell Push Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Dumbbell Shoulder Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Bench Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Strict Press", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": True, "requires_bodyweight": False},
    {"name": "Push Up", "pattern": MovementPattern.PUSH, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Pull-up strict", "pattern": MovementPattern.PULL, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Hollow Hold", "pattern": MovementPattern.CORE, "unit_primary": MovementUnit.SECONDS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Sit Up", "pattern": MovementPattern.CORE, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "V-Up", "pattern": MovementPattern.CORE, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Plank Hold", "pattern": MovementPattern.CORE, "unit_primary": MovementUnit.SECONDS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Russian Twist", "pattern": MovementPattern.CORE, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
    {"name": "Jump Rope Single Unders", "pattern": MovementPattern.LOCOMOTION, "unit_primary": MovementUnit.REPS, "requires_load": False, "requires_bodyweight": True},
]


def _hash_password(password: str) -> str:
    return PASSWORD_CONTEXT.hash(password)


async def _upsert_user(session: AsyncSession, email: str, password: str, role: UserRole) -> UUID:
    password_hash = _hash_password(password)
    stmt = (
        insert(UserModel)
        .values(
            id=uuid4(),
            email=email,
            password_hash=password_hash,
            role=role,
            status=UserStatus.ACTIVE,
        )
        .on_conflict_do_update(
            index_elements=[UserModel.email],
            set_={
                "password_hash": password_hash,
                "role": role,
                "status": UserStatus.ACTIVE,
            },
        )
        .returning(UserModel.id)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def _get_or_create_gym(session: AsyncSession, gym_name: str) -> UUID:
    gym = await session.scalar(select(GymModel).where(GymModel.name == gym_name).limit(1))
    if gym is not None:
        return gym.id

    gym = GymModel(id=uuid4(), name=gym_name)
    session.add(gym)
    await session.flush()
    return gym.id


async def _upsert_membership(session: AsyncSession, user_id: UUID, gym_id: UUID, role_in_gym: GymRole) -> None:
    membership = await session.scalar(
        select(GymMembershipModel)
        .where(
            GymMembershipModel.user_id == user_id,
            GymMembershipModel.active.is_(True),
        )
        .limit(1)
    )

    if membership is None:
        session.add(
            GymMembershipModel(
                id=uuid4(),
                user_id=user_id,
                gym_id=gym_id,
                role_in_gym=role_in_gym,
                active=True,
            )
        )
        return

    membership.gym_id = gym_id
    membership.role_in_gym = role_in_gym
    membership.active = True


async def _upsert_coach_profile(session: AsyncSession, user_id: UUID) -> None:
    stmt = (
        insert(CoachProfileModel)
        .values(id=uuid4(), user_id=user_id, display_name="HybridForce Coach")
        .on_conflict_do_update(
            index_elements=[CoachProfileModel.user_id],
            set_={"display_name": "HybridForce Coach"},
        )
    )
    await session.execute(stmt)


async def _upsert_athlete_profile(session: AsyncSession, user_id: UUID, gym_id: UUID) -> None:
    stmt = (
        insert(AthleteProfileModel)
        .values(
            id=uuid4(),
            user_id=user_id,
            current_gym_id=gym_id,
            level=1,
            level_band=LevelBand.BEGINNER,
        )
        .on_conflict_do_update(
            index_elements=[AthleteProfileModel.user_id],
            set_={
                "current_gym_id": gym_id,
                "level": 1,
                "level_band": LevelBand.BEGINNER,
            },
        )
    )
    await session.execute(stmt)


async def _upsert_movements(session: AsyncSession, movements: list[MovementSeed]) -> None:
    for movement in movements:
        stmt = (
            insert(MovementModel)
            .values(id=uuid4(), **movement)
            .on_conflict_do_update(
                index_elements=[MovementModel.name],
                set_={
                    "pattern": movement["pattern"],
                    "unit_primary": movement["unit_primary"],
                    "requires_load": movement["requires_load"],
                    "requires_bodyweight": movement["requires_bodyweight"],
                },
            )
        )
        await session.execute(stmt)


async def run_seed() -> None:
    async with SessionLocal() as session:
        async with session.begin():
            gym_id = await _get_or_create_gym(session, GYM_NAME)

            await _upsert_user(session, "admin@local.com", "Admin123!", UserRole.ADMIN)
            coach_user_id = await _upsert_user(session, "coach@local.com", "Coach123!", UserRole.COACH)
            athlete_user_id = await _upsert_user(session, "athlete@local.com", "Athlete123!", UserRole.ATHLETE)

            await _upsert_coach_profile(session, coach_user_id)
            await _upsert_membership(session, coach_user_id, gym_id, GymRole.COACH)
            await _upsert_membership(session, athlete_user_id, gym_id, GymRole.ATHLETE)
            await _upsert_athlete_profile(session, athlete_user_id, gym_id)
            await _upsert_movements(session, MOVEMENTS)

    print("Seed completed successfully.")
    print(f"Gym: {GYM_NAME}")
    print("Users: admin@local.com, coach@local.com, athlete@local.com")


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
