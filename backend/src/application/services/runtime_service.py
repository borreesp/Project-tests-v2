from __future__ import annotations

import hashlib
import math
import secrets
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from threading import RLock
from typing import Any
from uuid import uuid4

from src.adapters.outbound.auth.jwt_service import JwtService
from src.adapters.outbound.auth.password_hasher import PasswordHasher
from src.adapters.outbound.persistence.models.enums import (
    AssignmentScope,
    AssignmentStatus,
    AttemptStatus,
    BlockType,
    CapacityType,
    Confidence,
    DataQuality,
    GymRole,
    IdealScope,
    InvitationRole,
    LeaderboardPeriod,
    LeaderboardScope,
    LevelBand,
    LoadRule,
    MovementPattern,
    MovementUnit,
    ScaleCode,
    ScoreType,
    Sex,
    UserRole,
    UserStatus,
    WorkoutType,
    WorkoutVisibility,
)
from src.application.dtos.admin import (
    AdminChangeGymRequestDTO,
    AdminChangeGymResponseDTO,
    AdminCreateMovementRequestDTO,
)
from src.application.dtos.athlete import (
    AthleteDashboardDTO,
    AthleteTrendDTO,
    AttemptDTO,
    CapacityDTO,
    CreateAttemptRequestDTO,
    CreateAttemptResponseDTO,
    MetersPrimaryResultDTO,
    PulseDTO,
    PulseExplainItemDTO,
    RepsPrimaryResultDTO,
    RoundsMetersPrimaryResultDTO,
    SubmitResultRequestDTO,
    TimePrimaryResultDTO,
)
from src.application.dtos.auth import (
    InviteCreateRequestDTO,
    InviteCreateResponseDTO,
    LoginResponseDTO,
    MeResponseDTO,
    RefreshResponseDTO,
    RegisterFromInviteRequestDTO,
    RegisterFromInviteResponseDTO,
)
from src.application.dtos.coach import (
    CoachAthleteDetailDTO,
    CoachAthleteSummaryDTO,
    CoachOverviewDTO,
    CoachWorkoutSummaryDTO,
    PublishWorkoutResponseDTO,
    ValidateAttemptResponseDTO,
    WorkoutCapacityWeightInputDTO,
    WorkoutCreateRequestDTO,
    WorkoutMutationResponseDTO,
    WorkoutUpdateRequestDTO,
)
from src.application.dtos.public import (
    MovementDTO,
    WorkoutCapacityWeightDTO,
    WorkoutDefinitionDetailDTO,
    WorkoutDefinitionSummaryDTO,
    WorkoutDetailBlockDTO,
    WorkoutDetailBlockMovementDTO,
    WorkoutScaleDTO,
)
from src.application.dtos.ranking import LeaderboardDTO, LeaderboardEntryDTO, RecomputeRankingsResponseDTO
from src.infrastructure.config.settings import get_settings


class ServiceError(Exception):
    pass


class UnauthorizedError(ServiceError):
    pass


class ForbiddenError(ServiceError):
    pass


class NotFoundError(ServiceError):
    pass


class ConflictError(ServiceError):
    pass


class ValidationServiceError(ServiceError):
    pass


@dataclass(slots=True)
class UserRecord:
    id: str
    email: str
    password_hash: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    last_login_at: datetime | None = None


@dataclass(slots=True)
class RefreshTokenRecord:
    id: str
    user_id: str
    token_hash: str
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime


@dataclass(slots=True)
class GymRecord:
    id: str
    name: str
    created_at: datetime


@dataclass(slots=True)
class GymMembershipRecord:
    id: str
    user_id: str
    gym_id: str
    role_in_gym: GymRole
    active: bool
    joined_at: datetime


@dataclass(slots=True)
class GymMembershipHistoryRecord:
    id: str
    user_id: str
    from_gym_id: str | None
    to_gym_id: str
    changed_by_user_id: str
    changed_at: datetime


@dataclass(slots=True)
class InvitationRecord:
    id: str
    email: str
    gym_id: str
    invited_by_user_id: str
    role: InvitationRole
    token: str
    expires_at: datetime
    accepted_at: datetime | None
    created_at: datetime


@dataclass(slots=True)
class AthleteProfileRecord:
    id: str
    user_id: str
    current_gym_id: str
    sex: Sex | None
    birthdate: date | None
    height_cm: int | None
    weight_kg: float | None
    level: int
    level_band: LevelBand
    created_at: datetime


@dataclass(slots=True)
class CoachProfileRecord:
    id: str
    user_id: str
    display_name: str
    created_at: datetime


@dataclass(slots=True)
class MovementRecord:
    id: str
    name: str
    pattern: MovementPattern
    unit_primary: MovementUnit
    requires_load: bool
    requires_bodyweight: bool
    created_at: datetime


@dataclass(slots=True)
class WorkoutScaleRecord:
    id: str
    workout_definition_id: str
    code: ScaleCode
    label: str
    notes: str
    reference_loads_json: dict[str, Any]


@dataclass(slots=True)
class BlockMovementRecord:
    id: str
    block_id: str
    ord: int
    movement_id: str
    reps: int | None
    meters: int | None
    seconds: int | None
    calories: int | None
    load_rule: LoadRule
    notes: str
    box_height_cm: int | None


@dataclass(slots=True)
class WorkoutBlockRecord:
    id: str
    workout_definition_id: str
    ord: int
    name: str
    block_type: BlockType
    repeat_int: int
    time_seconds: int | None
    cap_seconds: int | None
    movements: list[BlockMovementRecord] = field(default_factory=list)


@dataclass(slots=True)
class WorkoutCapacityWeightRecord:
    workout_definition_id: str
    capacity_type: CapacityType
    weight: float


@dataclass(slots=True)
class WorkoutDefinitionRecord:
    id: str
    title: str
    description: str
    author_coach_user_id: str
    is_test: bool
    type: WorkoutType
    visibility: WorkoutVisibility
    score_type: ScoreType | None
    created_at: datetime
    published_at: datetime | None
    updated_at: datetime
    scales: list[WorkoutScaleRecord] = field(default_factory=list)
    blocks: list[WorkoutBlockRecord] = field(default_factory=list)
    capacity_weights: list[WorkoutCapacityWeightRecord] = field(default_factory=list)


@dataclass(slots=True)
class WorkoutAssignmentRecord:
    id: str
    workout_definition_id: str
    scope: AssignmentScope
    gym_id: str | None
    status: AssignmentStatus
    published_at: datetime


@dataclass(slots=True)
class WorkoutAttemptRecord:
    id: str
    athlete_id: str
    workout_definition_id: str
    assignment_id: str | None
    performed_at: datetime
    scale_code: ScaleCode
    status: AttemptStatus


@dataclass(slots=True)
class WorkoutResultRecord:
    id: str
    attempt_id: str
    primary_result_json: dict[str, Any]
    inputs_json: dict[str, Any]
    derived_metrics_json: dict[str, Any]
    score_base: float
    score_norm: float
    data_quality: DataQuality
    validated_by_user_id: str | None
    validated_at: datetime | None
    reject_reason: str | None


@dataclass(slots=True)
class WorkoutIdealProfileRecord:
    id: str
    workout_definition_id: str
    scope: IdealScope
    gym_id: str | None
    coach_user_id: str
    ideal_score_base: float
    notes: str


@dataclass(slots=True)
class AthleteCapacityRecord:
    athlete_id: str
    capacity_type: CapacityType
    value_0_100: float
    confidence: Confidence
    last_updated_at: datetime


@dataclass(slots=True)
class AthletePulseRecord:
    athlete_id: str
    value_0_100: float
    confidence: Confidence
    computed_at: datetime
    explain_json: list[dict[str, str]]


@dataclass(slots=True)
class LeaderboardEntryRecord:
    leaderboard_id: str
    athlete_id: str
    best_attempt_id: str
    best_score_norm: float
    rank: int
    updated_at: datetime


@dataclass(slots=True)
class LeaderboardRecord:
    id: str
    workout_definition_id: str
    scope: LeaderboardScope
    gym_id: str | None
    period: LeaderboardPeriod
    scale_code: ScaleCode
    updated_at: datetime
    entries: list[LeaderboardEntryRecord] = field(default_factory=list)


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class RuntimeService:
    def __init__(self) -> None:
        self._lock = RLock()
        self._hasher = PasswordHasher()
        self._jwt = JwtService()
        self._settings = get_settings()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.users: dict[str, UserRecord] = {}
            self.refresh_tokens: dict[str, RefreshTokenRecord] = {}
            self.gyms: dict[str, GymRecord] = {}
            self.memberships: dict[str, GymMembershipRecord] = {}
            self.membership_history: dict[str, GymMembershipHistoryRecord] = {}
            self.invitations: dict[str, InvitationRecord] = {}
            self.athlete_profiles: dict[str, AthleteProfileRecord] = {}
            self.coach_profiles: dict[str, CoachProfileRecord] = {}
            self.movements: dict[str, MovementRecord] = {}
            self.workouts: dict[str, WorkoutDefinitionRecord] = {}
            self.assignments: dict[str, WorkoutAssignmentRecord] = {}
            self.attempts: dict[str, WorkoutAttemptRecord] = {}
            self.results: dict[str, WorkoutResultRecord] = {}
            self.ideal_profiles: dict[str, WorkoutIdealProfileRecord] = {}
            self.capacities: dict[tuple[str, CapacityType], AthleteCapacityRecord] = {}
            self.capacity_history: list[tuple[str, CapacityType, datetime, float]] = []
            self.pulses: dict[str, AthletePulseRecord] = {}
            self.leaderboards: dict[
                tuple[str, LeaderboardScope, str | None, LeaderboardPeriod, ScaleCode], LeaderboardRecord
            ] = {}
            self._seed_defaults()

    def _seed_defaults(self) -> None:
        now = _now()
        gym = GymRecord(id=str(uuid4()), name="HybridForce HQ", created_at=now)
        self.gyms[gym.id] = gym

        admin = self._create_user("admin@local.com", "Admin123!", UserRole.ADMIN)
        coach = self._create_user("coach@local.com", "Coach123!", UserRole.COACH)
        athlete = self._create_user("athlete@local.com", "Athlete123!", UserRole.ATHLETE)

        self._upsert_membership(coach.id, gym.id, GymRole.COACH)
        self._upsert_membership(athlete.id, gym.id, GymRole.ATHLETE)

        coach_profile = CoachProfileRecord(
            id=str(uuid4()),
            user_id=coach.id,
            display_name="HybridForce Coach",
            created_at=now,
        )
        self.coach_profiles[coach_profile.id] = coach_profile

        athlete_profile = AthleteProfileRecord(
            id=str(uuid4()),
            user_id=athlete.id,
            current_gym_id=gym.id,
            sex=None,
            birthdate=None,
            height_cm=None,
            weight_kg=None,
            level=1,
            level_band=LevelBand.BEGINNER,
            created_at=now,
        )
        self.athlete_profiles[athlete_profile.id] = athlete_profile

        initial_movements = [
            ("Air Squat", MovementPattern.SQUAT, MovementUnit.REPS, False, True),
            ("Back Squat", MovementPattern.SQUAT, MovementUnit.REPS, True, False),
            ("Strict Press", MovementPattern.PUSH, MovementUnit.REPS, True, False),
            ("DB Push Press", MovementPattern.PUSH, MovementUnit.REPS, True, False),
            ("Deadlift", MovementPattern.HINGE, MovementUnit.REPS, True, False),
            ("Pull-up strict", MovementPattern.PULL, MovementUnit.REPS, False, True),
            ("Hollow Hold", MovementPattern.CORE, MovementUnit.SECONDS, False, True),
            ("Farmer Carry", MovementPattern.CARRY, MovementUnit.METERS, True, False),
            ("Sled Push", MovementPattern.LOCOMOTION, MovementUnit.METERS, True, False),
            ("Burpee", MovementPattern.LOCOMOTION, MovementUnit.REPS, False, True),
            ("Row Erg", MovementPattern.PULL, MovementUnit.METERS, False, False),
        ]
        for name, pattern, unit_primary, requires_load, requires_bodyweight in initial_movements:
            movement = MovementRecord(
                id=str(uuid4()),
                name=name,
                pattern=pattern,
                unit_primary=unit_primary,
                requires_load=requires_load,
                requires_bodyweight=requires_bodyweight,
                created_at=now,
            )
            self.movements[movement.id] = movement

        self._ensure_capacity_defaults(athlete_profile.id)
        self._ensure_pulse_default(athlete_profile.id)
        _ = admin

    def _create_user(self, email: str, password: str, role: UserRole) -> UserRecord:
        user = UserRecord(
            id=str(uuid4()),
            email=email.lower(),
            password_hash=self._hasher.hash(password),
            role=role,
            status=UserStatus.ACTIVE,
            created_at=_now(),
            last_login_at=None,
        )
        self.users[user.id] = user
        return user

    def _upsert_membership(self, user_id: str, gym_id: str, role_in_gym: GymRole) -> GymMembershipRecord:
        for membership in self.memberships.values():
            if membership.user_id == user_id and membership.active:
                membership.active = False

        membership = GymMembershipRecord(
            id=str(uuid4()),
            user_id=user_id,
            gym_id=gym_id,
            role_in_gym=role_in_gym,
            active=True,
            joined_at=_now(),
        )
        self.memberships[membership.id] = membership
        return membership

    def decode_access_token(self, token: str) -> UserRecord:
        payload = self._jwt.decode(token)
        user_id = payload.get("sub")
        if not isinstance(user_id, str):
            raise UnauthorizedError("Invalid token payload")

        user = self.users.get(user_id)
        if user is None or user.status != UserStatus.ACTIVE:
            raise UnauthorizedError("User not found")

        return user

    def login(self, email: str, password: str) -> LoginResponseDTO:
        with self._lock:
            user = self._get_user_by_email(email)
            if user is None or not self._hasher.verify(password, user.password_hash):
                raise UnauthorizedError("Invalid credentials")
            if user.status != UserStatus.ACTIVE:
                raise UnauthorizedError("User is disabled")

            user.last_login_at = _now()
            access_token = self._issue_access_token(user)
            refresh_token = self._issue_refresh_token(user.id)
            return LoginResponseDTO(accessToken=access_token, refreshToken=refresh_token, role=user.role)

    def refresh(self, refresh_token: str) -> RefreshResponseDTO:
        with self._lock:
            token_record = self._find_refresh_token(refresh_token)
            if token_record is None:
                raise UnauthorizedError("Invalid refresh token")
            if token_record.revoked_at is not None or token_record.expires_at <= _now():
                raise UnauthorizedError("Refresh token expired")

            user = self.users.get(token_record.user_id)
            if user is None or user.status != UserStatus.ACTIVE:
                raise UnauthorizedError("User not available")

            token_record.revoked_at = _now()
            new_refresh_token = self._issue_refresh_token(user.id)
            new_access_token = self._issue_access_token(user)
            return RefreshResponseDTO(accessToken=new_access_token, refreshToken=new_refresh_token)

    def logout(self, refresh_token: str | None, user: UserRecord) -> None:
        with self._lock:
            if refresh_token is None:
                for token_record in self.refresh_tokens.values():
                    if token_record.user_id == user.id and token_record.revoked_at is None:
                        token_record.revoked_at = _now()
                return

            token_record = self._find_refresh_token(refresh_token)
            if token_record is None:
                return

            if token_record.user_id != user.id:
                raise ForbiddenError("Refresh token does not belong to user")

            token_record.revoked_at = _now()

    def create_invitation(self, current_user: UserRecord, payload: InviteCreateRequestDTO) -> InviteCreateResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH})
            coach_gym_id = self._coach_gym_id(current_user.id)
            if coach_gym_id is None:
                raise ForbiddenError("Coach does not belong to any gym")
            if payload.gym_id != coach_gym_id:
                raise ForbiddenError("Coach can only invite to own gym")
            if payload.gym_id not in self.gyms:
                raise NotFoundError("Gym not found")

            invitation = InvitationRecord(
                id=str(uuid4()),
                email=payload.email.lower(),
                gym_id=payload.gym_id,
                invited_by_user_id=current_user.id,
                role=InvitationRole.ATHLETE,
                token=secrets.token_urlsafe(32),
                expires_at=_now() + timedelta(days=7),
                accepted_at=None,
                created_at=_now(),
            )
            self.invitations[invitation.id] = invitation
            return InviteCreateResponseDTO(
                invitationId=invitation.id,
                token=invitation.token,
                expiresAt=_iso(invitation.expires_at) or "",
            )

    def register_from_invite(self, payload: RegisterFromInviteRequestDTO) -> RegisterFromInviteResponseDTO:
        with self._lock:
            invitation = self._get_valid_invitation(payload.token)
            if invitation is None:
                raise ValidationServiceError("Invalid invitation token")
            if invitation.expires_at <= _now():
                raise ValidationServiceError("Invitation expired")
            if invitation.accepted_at is not None:
                raise ConflictError("Invitation already used")
            if self._get_user_by_email(invitation.email) is not None:
                raise ConflictError("Email already registered")

            user = self._create_user(invitation.email, payload.password, UserRole.ATHLETE)
            self._upsert_membership(user.id, invitation.gym_id, GymRole.ATHLETE)
            invitation.accepted_at = _now()

            athlete_profile = AthleteProfileRecord(
                id=str(uuid4()),
                user_id=user.id,
                current_gym_id=invitation.gym_id,
                sex=payload.athlete.sex,
                birthdate=payload.athlete.birthdate,
                height_cm=payload.athlete.height_cm,
                weight_kg=payload.athlete.weight_kg,
                level=1,
                level_band=LevelBand.BEGINNER,
                created_at=_now(),
            )
            self.athlete_profiles[athlete_profile.id] = athlete_profile
            self._ensure_capacity_defaults(athlete_profile.id)
            self._ensure_pulse_default(athlete_profile.id)

            access_token = self._issue_access_token(user)
            refresh_token = self._issue_refresh_token(user.id)
            return RegisterFromInviteResponseDTO(
                accessToken=access_token,
                refreshToken=refresh_token,
                role="ATHLETE",
            )

    def get_me(self, user: UserRecord) -> MeResponseDTO:
        return MeResponseDTO(id=user.id, email=user.email, role=user.role, status=user.status)

    def list_movements(self, query: str | None) -> list[MovementDTO]:
        movements = list(self.movements.values())
        if query:
            lowered = query.strip().lower()
            movements = [movement for movement in movements if lowered in movement.name.lower()]
        movements.sort(key=lambda item: item.name.lower())
        return [self._movement_to_dto(movement) for movement in movements]

    def list_workouts(self, current_user: UserRecord) -> list[WorkoutDefinitionSummaryDTO]:
        workouts = self._workouts_for_user(current_user)
        workouts.sort(key=lambda item: item.created_at, reverse=True)
        return [self._workout_summary_to_dto(workout) for workout in workouts]

    def get_workout_detail(self, current_user: UserRecord, workout_id: str) -> WorkoutDefinitionDetailDTO:
        workout = self.workouts.get(workout_id)
        if workout is None:
            raise NotFoundError("Workout not found")

        if current_user.role == UserRole.ATHLETE:
            visible_ids = {item.id for item in self._workouts_for_user(current_user)}
            if workout_id not in visible_ids:
                raise ForbiddenError("Workout not assigned to athlete")

        return self._workout_detail_to_dto(workout)

    def create_attempt(
        self, current_user: UserRecord, workout_id: str, payload: CreateAttemptRequestDTO
    ) -> CreateAttemptResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.ATHLETE})
            workout = self.workouts.get(workout_id)
            if workout is None:
                raise NotFoundError("Workout not found")

            athlete_profile = self._athlete_profile_by_user(current_user.id)
            if athlete_profile is None:
                raise ForbiddenError("Athlete profile missing")

            visible_ids = {item.id for item in self._workouts_for_user(current_user)}
            if workout_id not in visible_ids:
                raise ForbiddenError("Workout not assigned to athlete")

            if payload.scale_code not in {scale.code for scale in workout.scales}:
                raise ValidationServiceError("Invalid scale code for workout")

            assignment_id = self._pick_assignment_for_athlete(workout_id, athlete_profile.current_gym_id)
            attempt = WorkoutAttemptRecord(
                id=str(uuid4()),
                athlete_id=athlete_profile.id,
                workout_definition_id=workout_id,
                assignment_id=assignment_id,
                performed_at=_now(),
                scale_code=payload.scale_code,
                status=AttemptStatus.DRAFT,
            )
            self.attempts[attempt.id] = attempt
            return CreateAttemptResponseDTO(attemptId=attempt.id, status=attempt.status)

    def submit_attempt_result(
        self, current_user: UserRecord, attempt_id: str, payload: SubmitResultRequestDTO
    ) -> AttemptDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.ATHLETE})
            athlete_profile = self._athlete_profile_by_user(current_user.id)
            if athlete_profile is None:
                raise ForbiddenError("Athlete profile missing")

            attempt = self.attempts.get(attempt_id)
            if attempt is None:
                raise NotFoundError("Attempt not found")
            if attempt.athlete_id != athlete_profile.id:
                raise ForbiddenError("Attempt does not belong to athlete")

            workout = self.workouts.get(attempt.workout_definition_id)
            if workout is None:
                raise NotFoundError("Workout not found")

            self._validate_primary_result_for_workout(workout.type, payload.primary_result.type)

            score_base = self._compute_score_base(payload.primary_result, payload.inputs)
            score_norm = self._compute_score_norm(workout.id, athlete_profile.current_gym_id, score_base)

            existing_result = self._result_by_attempt(attempt.id)
            if existing_result is None:
                result = WorkoutResultRecord(
                    id=str(uuid4()),
                    attempt_id=attempt.id,
                    primary_result_json=payload.primary_result.model_dump(mode="json", by_alias=True),
                    inputs_json=payload.inputs,
                    derived_metrics_json={},
                    score_base=score_base,
                    score_norm=score_norm,
                    data_quality=DataQuality.OK,
                    validated_by_user_id=None,
                    validated_at=None,
                    reject_reason=None,
                )
                self.results[result.id] = result
            else:
                existing_result.primary_result_json = payload.primary_result.model_dump(mode="json", by_alias=True)
                existing_result.inputs_json = payload.inputs
                existing_result.score_base = score_base
                existing_result.score_norm = score_norm
                existing_result.reject_reason = None
                existing_result.validated_by_user_id = None
                existing_result.validated_at = None

            attempt.status = AttemptStatus.SUBMITTED
            return self._attempt_to_dto(attempt)

    def get_athlete_dashboard(self, current_user: UserRecord) -> AthleteDashboardDTO:
        self._require_roles(current_user, {UserRole.ATHLETE})
        athlete_profile = self._athlete_profile_by_user(current_user.id)
        if athlete_profile is None:
            raise NotFoundError("Athlete profile not found")

        capacities = self._capacity_dtos(athlete_profile.id)
        pulse = self._pulse_to_dto(athlete_profile.id)
        tests7d, tests30d = self._attempt_counts(athlete_profile.id)
        trends = self._capacity_trends_30d(athlete_profile.id)

        return AthleteDashboardDTO(
            athleteId=athlete_profile.id,
            gymId=athlete_profile.current_gym_id,
            level=athlete_profile.level,
            levelBand=athlete_profile.level_band,
            pulse=pulse,
            capacities=capacities,
            counts={"tests7d": tests7d, "tests30d": tests30d},
            trends30d=trends,
        )

    def coach_overview(self, current_user: UserRecord) -> CoachOverviewDTO:
        self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
        if current_user.role == UserRole.ADMIN:
            athletes = list(self.athlete_profiles.values())
            coach_gym_id = "ALL"
        else:
            coach_gym_id = self._coach_gym_id(current_user.id)
            if coach_gym_id is None:
                raise ForbiddenError("Coach gym not found")
            athletes = [profile for profile in self.athlete_profiles.values() if profile.current_gym_id == coach_gym_id]

        athlete_ids = {profile.id for profile in athletes}
        pending_submissions = sum(
            1
            for attempt in self.attempts.values()
            if attempt.athlete_id in athlete_ids and attempt.status == AttemptStatus.SUBMITTED
        )

        today = _now().date()
        validated_today = 0
        for result in self.results.values():
            if result.validated_at is None:
                continue
            attempt = self.attempts.get(result.attempt_id)
            if attempt is None or attempt.athlete_id not in athlete_ids:
                continue
            if result.validated_at.date() == today:
                validated_today += 1

        return CoachOverviewDTO(
            gymId=coach_gym_id,
            athletesCount=len(athletes),
            pendingSubmissions=pending_submissions,
            validatedToday=validated_today,
        )

    def coach_athletes(self, current_user: UserRecord) -> list[CoachAthleteSummaryDTO]:
        self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
        coach_gym_id = self._coach_gym_id(current_user.id) if current_user.role == UserRole.COACH else None
        if current_user.role == UserRole.COACH and coach_gym_id is None:
            raise ForbiddenError("Coach gym not found")

        result: list[CoachAthleteSummaryDTO] = []
        for athlete in self.athlete_profiles.values():
            if coach_gym_id is not None and athlete.current_gym_id != coach_gym_id:
                continue
            user = self.users.get(athlete.user_id)
            if user is None:
                continue
            result.append(
                CoachAthleteSummaryDTO(
                    athleteId=athlete.id,
                    userId=user.id,
                    email=user.email,
                    level=athlete.level,
                    levelBand=athlete.level_band.value,
                )
            )

        result.sort(key=lambda item: item.email)
        return result

    def coach_athlete_detail(self, current_user: UserRecord, athlete_id: str) -> CoachAthleteDetailDTO:
        self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
        coach_gym_id = self._coach_gym_id(current_user.id) if current_user.role == UserRole.COACH else None
        athlete = self.athlete_profiles.get(athlete_id)
        if athlete is None:
            raise NotFoundError("Athlete not found")
        if coach_gym_id is not None and coach_gym_id != athlete.current_gym_id:
            raise ForbiddenError("Coach can only access athletes in own gym")

        user = self.users.get(athlete.user_id)
        if user is None:
            raise NotFoundError("Athlete user not found")

        return CoachAthleteDetailDTO(
            athleteId=athlete.id,
            userId=user.id,
            email=user.email,
            gymId=athlete.current_gym_id,
            level=athlete.level,
            levelBand=athlete.level_band.value,
            createdAt=_iso(athlete.created_at) or "",
        )

    def coach_workouts(self, current_user: UserRecord) -> list[CoachWorkoutSummaryDTO]:
        self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
        workouts = list(self.workouts.values())
        if current_user.role == UserRole.COACH:
            workouts = [item for item in workouts if item.author_coach_user_id == current_user.id]
        workouts.sort(key=lambda item: item.created_at, reverse=True)
        return [self._coach_workout_summary_to_dto(item) for item in workouts]

    def validate_attempt(self, current_user: UserRecord, attempt_id: str) -> ValidateAttemptResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            attempt = self.attempts.get(attempt_id)
            if attempt is None:
                raise NotFoundError("Attempt not found")
            if attempt.status != AttemptStatus.SUBMITTED:
                raise ValidationServiceError("Only submitted attempts can be validated")

            athlete = self.athlete_profiles.get(attempt.athlete_id)
            if athlete is None:
                raise NotFoundError("Athlete profile not found")
            coach_gym_id = self._coach_gym_id(current_user.id) if current_user.role == UserRole.COACH else None
            if coach_gym_id is not None and coach_gym_id != athlete.current_gym_id:
                raise ForbiddenError("Coach can only validate attempts in own gym")

            result = self._result_by_attempt(attempt.id)
            if result is None:
                raise ValidationServiceError("Attempt has no result submitted")

            attempt.status = AttemptStatus.VALIDATED
            result.validated_by_user_id = current_user.id
            result.validated_at = _now()
            result.reject_reason = None
            result.data_quality = DataQuality.OK
            self._recalculate_capacities_and_pulse(athlete.id)

            attempt_dto = self._attempt_to_dto(attempt)
            return ValidateAttemptResponseDTO(
                **attempt_dto.model_dump(),
                validatedAt=_iso(result.validated_at) or "",
            )

    def reject_attempt(self, current_user: UserRecord, attempt_id: str, reason: str) -> AttemptDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            attempt = self.attempts.get(attempt_id)
            if attempt is None:
                raise NotFoundError("Attempt not found")

            athlete = self.athlete_profiles.get(attempt.athlete_id)
            if athlete is None:
                raise NotFoundError("Athlete profile not found")
            coach_gym_id = self._coach_gym_id(current_user.id) if current_user.role == UserRole.COACH else None
            if coach_gym_id is not None and coach_gym_id != athlete.current_gym_id:
                raise ForbiddenError("Coach can only reject attempts in own gym")

            result = self._result_by_attempt(attempt.id)
            if result is None:
                raise ValidationServiceError("Attempt has no result to reject")

            attempt.status = AttemptStatus.REJECTED
            result.reject_reason = reason
            result.validated_at = None
            result.validated_by_user_id = None
            return self._attempt_to_dto(attempt)

    def create_workout(self, current_user: UserRecord, payload: WorkoutCreateRequestDTO) -> WorkoutMutationResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            self._assert_movement_ids_exist(payload)
            self._validate_workout_payload(payload)

            now = _now()
            workout = WorkoutDefinitionRecord(
                id=str(uuid4()),
                title=payload.title,
                description=payload.description,
                author_coach_user_id=current_user.id,
                is_test=payload.is_test,
                type=payload.type,
                visibility=payload.visibility,
                score_type=payload.score_type,
                created_at=now,
                published_at=None,
                updated_at=now,
                scales=[],
                blocks=[],
                capacity_weights=[],
            )

            self._set_workout_structure(workout, payload.scales, payload.blocks, payload.capacity_weights)
            self.workouts[workout.id] = workout
            return self._workout_mutation_to_dto(workout)

    def update_workout(
        self, current_user: UserRecord, workout_id: str, payload: WorkoutUpdateRequestDTO
    ) -> WorkoutMutationResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            workout = self.workouts.get(workout_id)
            if workout is None:
                raise NotFoundError("Workout not found")
            if current_user.role != UserRole.ADMIN and workout.author_coach_user_id != current_user.id:
                raise ForbiddenError("Coach can only edit own workouts")

            self._assert_movement_ids_exist(payload)
            self._validate_workout_payload(payload)
            workout.title = payload.title
            workout.description = payload.description
            workout.is_test = payload.is_test
            workout.type = payload.type
            workout.visibility = payload.visibility
            workout.score_type = payload.score_type
            workout.updated_at = _now()
            self._set_workout_structure(workout, payload.scales, payload.blocks, payload.capacity_weights)
            return self._workout_mutation_to_dto(workout)

    def publish_workout(self, current_user: UserRecord, workout_id: str) -> PublishWorkoutResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            workout = self.workouts.get(workout_id)
            if workout is None:
                raise NotFoundError("Workout not found")
            if current_user.role != UserRole.ADMIN and workout.author_coach_user_id != current_user.id:
                raise ForbiddenError("Coach can only publish own workouts")

            now = _now()
            workout.published_at = now
            workout.updated_at = now

            coach_gym_id = self._coach_gym_id(current_user.id) if current_user.role == UserRole.COACH else None
            if coach_gym_id is None and current_user.role == UserRole.ADMIN:
                coach_gym_id = next(iter(self.gyms.keys()), None)
            if coach_gym_id is None:
                raise ForbiddenError("Coach gym not found")

            scope = AssignmentScope.COMMUNITY if workout.visibility == WorkoutVisibility.COMMUNITY else AssignmentScope.GYM
            gym_id = None if scope == AssignmentScope.COMMUNITY else coach_gym_id

            assignment = self._find_assignment(workout.id, scope, gym_id)
            if assignment is None:
                assignment = WorkoutAssignmentRecord(
                    id=str(uuid4()),
                    workout_definition_id=workout.id,
                    scope=scope,
                    gym_id=gym_id,
                    status=AssignmentStatus.ACTIVE,
                    published_at=now,
                )
                self.assignments[assignment.id] = assignment
            else:
                assignment.status = AssignmentStatus.ACTIVE
                assignment.published_at = now

            return PublishWorkoutResponseDTO(
                id=workout.id,
                title=workout.title,
                isTest=workout.is_test,
                type=workout.type,
                visibility=workout.visibility,
                scoreType=workout.score_type,
                publishedAt=_iso(workout.published_at) or "",
            )

    def duplicate_workout(self, current_user: UserRecord, workout_id: str) -> WorkoutMutationResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.COACH, UserRole.ADMIN})
            source = self.workouts.get(workout_id)
            if source is None:
                raise NotFoundError("Workout not found")
            if current_user.role != UserRole.ADMIN and source.author_coach_user_id != current_user.id:
                raise ForbiddenError("Coach can only duplicate own workouts")

            now = _now()
            duplicate = WorkoutDefinitionRecord(
                id=str(uuid4()),
                title=f"{source.title} (Copy)",
                description=source.description,
                author_coach_user_id=current_user.id,
                is_test=source.is_test,
                type=source.type,
                visibility=source.visibility,
                score_type=source.score_type,
                created_at=now,
                published_at=None,
                updated_at=now,
                scales=[],
                blocks=[],
                capacity_weights=[],
            )

            self._set_workout_structure(duplicate, source.scales, source.blocks, source.capacity_weights)
            self.workouts[duplicate.id] = duplicate
            return self._workout_mutation_to_dto(duplicate)

    def get_rankings(
        self,
        workout_id: str,
        scope: LeaderboardScope,
        period: LeaderboardPeriod,
        scale_code: ScaleCode,
        current_user: UserRecord | None,
    ) -> LeaderboardDTO:
        if workout_id not in self.workouts:
            raise NotFoundError("Workout not found")

        gym_id: str | None = None
        if scope == LeaderboardScope.GYM:
            if current_user is None:
                raise UnauthorizedError("Authentication required for gym ranking")
            gym_id = self._user_current_gym(current_user)
            if gym_id is None:
                raise ForbiddenError("User has no gym context")

        return self._compute_leaderboard(workout_id, scope, gym_id, period, scale_code, current_user)

    def recompute_rankings(self, current_user: UserRecord) -> RecomputeRankingsResponseDTO:
        self._require_roles(current_user, {UserRole.ADMIN})
        recomputed = 0
        with self._lock:
            self.leaderboards.clear()
            gym_ids = sorted({athlete.current_gym_id for athlete in self.athlete_profiles.values()})
            for workout in self.workouts.values():
                for scale in workout.scales:
                    for period in (LeaderboardPeriod.ALL_TIME, LeaderboardPeriod.D30):
                        self._persist_leaderboard(workout.id, LeaderboardScope.COMMUNITY, None, period, scale.code)
                        recomputed += 1
                        for gym_id in gym_ids:
                            self._persist_leaderboard(workout.id, LeaderboardScope.GYM, gym_id, period, scale.code)
                            recomputed += 1

        return RecomputeRankingsResponseDTO(status="ok", recomputed=recomputed)

    def admin_create_movement(
        self, current_user: UserRecord, payload: AdminCreateMovementRequestDTO
    ) -> MovementDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.ADMIN})
            existing = next(
                (movement for movement in self.movements.values() if movement.name.lower() == payload.name.lower()),
                None,
            )
            if existing is not None:
                raise ConflictError("Movement already exists")

            movement = MovementRecord(
                id=str(uuid4()),
                name=payload.name,
                pattern=payload.pattern,
                unit_primary=payload.unit_primary,
                requires_load=payload.requires_load,
                requires_bodyweight=payload.requires_bodyweight,
                created_at=_now(),
            )
            self.movements[movement.id] = movement
            return self._movement_to_dto(movement)

    def admin_change_athlete_gym(
        self, current_user: UserRecord, athlete_id: str, payload: AdminChangeGymRequestDTO
    ) -> AdminChangeGymResponseDTO:
        with self._lock:
            self._require_roles(current_user, {UserRole.ADMIN})
            athlete = self.athlete_profiles.get(athlete_id)
            if athlete is None:
                raise NotFoundError("Athlete not found")
            if payload.gym_id not in self.gyms:
                raise NotFoundError("Gym not found")

            previous_gym_id = athlete.current_gym_id
            if previous_gym_id != payload.gym_id:
                athlete.current_gym_id = payload.gym_id
                self._upsert_membership(athlete.user_id, payload.gym_id, GymRole.ATHLETE)
                history = GymMembershipHistoryRecord(
                    id=str(uuid4()),
                    user_id=athlete.user_id,
                    from_gym_id=previous_gym_id,
                    to_gym_id=payload.gym_id,
                    changed_by_user_id=current_user.id,
                    changed_at=_now(),
                )
                self.membership_history[history.id] = history

            return AdminChangeGymResponseDTO(
                athleteId=athlete.id,
                previousGymId=previous_gym_id,
                currentGymId=athlete.current_gym_id,
            )

    def _get_user_by_email(self, email: str) -> UserRecord | None:
        email_key = email.strip().lower()
        return next((user for user in self.users.values() if user.email == email_key), None)

    def _issue_access_token(self, user: UserRecord) -> str:
        return self._jwt.encode(
            {"sub": user.id, "role": user.role.value, "email": user.email},
            expires_delta=timedelta(minutes=self._settings.access_token_expires_minutes),
        )

    def _issue_refresh_token(self, user_id: str) -> str:
        raw = secrets.token_urlsafe(48)
        record = RefreshTokenRecord(
            id=str(uuid4()),
            user_id=user_id,
            token_hash=_hash_token(raw),
            expires_at=_now() + timedelta(days=self._settings.refresh_token_expires_days),
            revoked_at=None,
            created_at=_now(),
        )
        self.refresh_tokens[record.id] = record
        return raw

    def _find_refresh_token(self, raw_token: str) -> RefreshTokenRecord | None:
        token_hash = _hash_token(raw_token)
        return next((token for token in self.refresh_tokens.values() if token.token_hash == token_hash), None)

    def _require_roles(self, current_user: UserRecord, allowed: set[UserRole]) -> None:
        if current_user.role not in allowed:
            raise ForbiddenError("Insufficient permissions")

    def _coach_gym_id(self, coach_user_id: str) -> str | None:
        for membership in self.memberships.values():
            if membership.user_id == coach_user_id and membership.active and membership.role_in_gym == GymRole.COACH:
                return membership.gym_id
        return None

    def _athlete_profile_by_user(self, user_id: str) -> AthleteProfileRecord | None:
        return next((profile for profile in self.athlete_profiles.values() if profile.user_id == user_id), None)

    def _workouts_for_user(self, current_user: UserRecord) -> list[WorkoutDefinitionRecord]:
        if current_user.role in {UserRole.COACH, UserRole.ADMIN}:
            return list(self.workouts.values())

        athlete_profile = self._athlete_profile_by_user(current_user.id)
        if athlete_profile is None:
            return []

        visible_workout_ids: set[str] = set()
        for assignment in self.assignments.values():
            if assignment.status != AssignmentStatus.ACTIVE:
                continue
            if assignment.scope == AssignmentScope.COMMUNITY:
                visible_workout_ids.add(assignment.workout_definition_id)
            elif assignment.scope == AssignmentScope.GYM and assignment.gym_id == athlete_profile.current_gym_id:
                visible_workout_ids.add(assignment.workout_definition_id)

        return [workout for workout in self.workouts.values() if workout.id in visible_workout_ids]

    def _pick_assignment_for_athlete(self, workout_id: str, gym_id: str) -> str | None:
        for assignment in self.assignments.values():
            if assignment.workout_definition_id != workout_id or assignment.status != AssignmentStatus.ACTIVE:
                continue
            if assignment.scope == AssignmentScope.GYM and assignment.gym_id == gym_id:
                return assignment.id
            if assignment.scope == AssignmentScope.COMMUNITY:
                return assignment.id
        return None

    def _result_by_attempt(self, attempt_id: str) -> WorkoutResultRecord | None:
        return next((result for result in self.results.values() if result.attempt_id == attempt_id), None)

    def _get_valid_invitation(self, token: str) -> InvitationRecord | None:
        return next((invitation for invitation in self.invitations.values() if invitation.token == token), None)

    def _assert_movement_ids_exist(self, payload: WorkoutCreateRequestDTO | WorkoutUpdateRequestDTO) -> None:
        available_ids = set(self.movements.keys())
        for block in payload.blocks:
            for movement in block.movements:
                if movement.movement_id not in available_ids:
                    raise ValidationServiceError(f"Movement not found: {movement.movement_id}")

    def _validate_workout_payload(self, payload: WorkoutCreateRequestDTO | WorkoutUpdateRequestDTO) -> None:
        self._validate_block_order_and_structure(payload.blocks)
        self._validate_capacity_weights(payload.is_test, payload.capacity_weights)

        if payload.is_test and payload.score_type is None:
            raise ValidationServiceError("scoreType is required for test workouts")

        if payload.is_test and payload.type in {WorkoutType.AMRAP, WorkoutType.EMOM, WorkoutType.BLOCKS}:
            if payload.type == WorkoutType.EMOM and self._is_press_emom_exception(payload.blocks):
                return

            duration_seconds = self._estimate_duration_seconds(payload.blocks)
            if duration_seconds != 600:
                raise ValidationServiceError("Test workouts must have fixed duration of 600 seconds")

    def _validate_block_order_and_structure(self, blocks: list) -> None:
        if not blocks:
            raise ValidationServiceError("Workout must contain at least one block")

        ords = sorted(block.ord for block in blocks)
        expected = list(range(1, len(blocks) + 1))
        if ords != expected:
            raise ValidationServiceError("Block ord values must be unique and consecutive (1..n)")

        for block in blocks:
            movement_ords = sorted(movement.ord for movement in block.movements)
            expected_movement_ords = list(range(1, len(block.movements) + 1))
            if movement_ords != expected_movement_ords:
                raise ValidationServiceError("Block movement ord values must be unique and consecutive (1..n)")

            if block.block_type == BlockType.REST:
                if block.movements:
                    raise ValidationServiceError("REST blocks cannot contain movements")
                if block.time_seconds is None:
                    raise ValidationServiceError("REST blocks must define timeSeconds")
            elif block.block_type == BlockType.WORK and len(block.movements) == 0:
                raise ValidationServiceError("WORK blocks must contain at least one movement")

    def _validate_capacity_weights(self, is_test: bool, weights: list[WorkoutCapacityWeightInputDTO]) -> None:
        if not weights and not is_test:
            return

        unique_types = {item.capacity_type for item in weights}
        if len(unique_types) != len(weights):
            raise ValidationServiceError("capacityWeights cannot contain duplicated capacityType entries")

        for item in weights:
            if item.weight < 0 or item.weight > 1:
                raise ValidationServiceError("capacityWeights values must be between 0 and 1")

        if is_test:
            expected_types = set(CapacityType)
            if unique_types != expected_types:
                raise ValidationServiceError("Test workouts must define 4 capacityWeights entries (one per capacity)")
            total = sum(item.weight for item in weights)
            if abs(total - 1.0) > 0.01:
                raise ValidationServiceError("capacityWeights sum must be 1.00 (+/- 0.01)")

    def _estimate_duration_seconds(self, blocks: list) -> int:
        total = 0
        for block in blocks:
            interval = block.time_seconds if block.time_seconds is not None else block.cap_seconds
            if interval is None:
                continue
            total += int(interval) * int(block.repeat_int)
        return total

    def _is_press_emom_exception(self, blocks: list) -> bool:
        if len(blocks) != 20:
            return False

        ordered = sorted(blocks, key=lambda item: item.ord)
        for index, block in enumerate(ordered, start=1):
            expected_type = BlockType.WORK if index % 2 == 1 else BlockType.REST
            if block.block_type != expected_type:
                return False
            if block.time_seconds != 60:
                return False
            if block.repeat_int != 1:
                return False
            if expected_type == BlockType.WORK and len(block.movements) == 0:
                return False
            if expected_type == BlockType.REST and len(block.movements) > 0:
                return False
        return True

    def _set_workout_structure(
        self,
        workout: WorkoutDefinitionRecord,
        scales: list,
        blocks: list,
        capacity_weights: list,
    ) -> None:
        workout.scales = []
        for scale in scales:
            reference_loads = getattr(scale, "reference_loads", getattr(scale, "reference_loads_json", {}))
            workout.scales.append(
                WorkoutScaleRecord(
                    id=str(uuid4()),
                    workout_definition_id=workout.id,
                    code=scale.code,
                    label=scale.label,
                    notes=scale.notes,
                    reference_loads_json={k: v for k, v in reference_loads.items()},
                )
            )

        workout.blocks = []
        for block in sorted(blocks, key=lambda item: item.ord):
            block_record = WorkoutBlockRecord(
                id=str(uuid4()),
                workout_definition_id=workout.id,
                ord=block.ord,
                name=block.name,
                block_type=block.block_type,
                repeat_int=block.repeat_int,
                time_seconds=block.time_seconds,
                cap_seconds=block.cap_seconds,
                movements=[],
            )

            for movement in sorted(block.movements, key=lambda item: item.ord):
                block_record.movements.append(
                    BlockMovementRecord(
                        id=str(uuid4()),
                        block_id=block_record.id,
                        ord=movement.ord,
                        movement_id=movement.movement_id,
                        reps=movement.reps,
                        meters=movement.meters,
                        seconds=movement.seconds,
                        calories=movement.calories,
                        load_rule=movement.load_rule,
                        notes=movement.notes,
                        box_height_cm=movement.box_height_cm,
                    )
                )

            workout.blocks.append(block_record)

        workout.capacity_weights = []
        for item in capacity_weights:
            workout.capacity_weights.append(
                WorkoutCapacityWeightRecord(
                    workout_definition_id=workout.id,
                    capacity_type=item.capacity_type,
                    weight=float(item.weight),
                )
            )

    def _validate_primary_result_for_workout(self, workout_type: WorkoutType, result_type: str) -> None:
        allowed_map = {
            WorkoutType.AMRAP: {"REPS", "METERS", "ROUNDS_METERS"},
            WorkoutType.EMOM: {"REPS"},
            WorkoutType.FORTIME: {"TIME"},
            WorkoutType.INTERVALS: {"REPS", "METERS", "TIME", "ROUNDS_METERS"},
            WorkoutType.BLOCKS: {"REPS", "METERS", "TIME", "ROUNDS_METERS"},
        }
        allowed = allowed_map.get(workout_type, set())
        if result_type not in allowed:
            raise ValidationServiceError(f"Primary result type {result_type} is not valid for workout type {workout_type.value}")

    def _compute_score_base(
        self,
        primary_result: RepsPrimaryResultDTO | MetersPrimaryResultDTO | TimePrimaryResultDTO | RoundsMetersPrimaryResultDTO,
        inputs: dict[str, Any],
    ) -> float:
        load_factor = 1.0
        raw_load = inputs.get("loadKgTotal")
        if isinstance(raw_load, (int, float)) and raw_load > 0:
            load_factor = float(raw_load)

        if isinstance(primary_result, RepsPrimaryResultDTO):
            return float(primary_result.reps_total) * load_factor
        if isinstance(primary_result, MetersPrimaryResultDTO):
            return float(primary_result.meters_total) * load_factor
        if isinstance(primary_result, TimePrimaryResultDTO):
            if primary_result.time_seconds <= 0:
                raise ValidationServiceError("timeSeconds must be > 0")
            return 100000.0 / float(primary_result.time_seconds)
        if isinstance(primary_result, RoundsMetersPrimaryResultDTO):
            return float(primary_result.rounds * 1000 + primary_result.meters) * load_factor

        raise ValidationServiceError("Unsupported primary result payload")

    def _compute_score_norm(self, workout_id: str, gym_id: str, score_base: float) -> float:
        gym_ideal = next(
            (
                ideal
                for ideal in self.ideal_profiles.values()
                if ideal.workout_definition_id == workout_id
                and ideal.scope == IdealScope.GYM
                and ideal.gym_id == gym_id
                and ideal.ideal_score_base > 0
            ),
            None,
        )
        if gym_ideal is not None:
            return _clamp((score_base / gym_ideal.ideal_score_base) * 100.0, 0.0, 100.0)

        community_ideal = next(
            (
                ideal
                for ideal in self.ideal_profiles.values()
                if ideal.workout_definition_id == workout_id
                and ideal.scope == IdealScope.COMMUNITY
                and ideal.ideal_score_base > 0
            ),
            None,
        )
        if community_ideal is not None:
            return _clamp((score_base / community_ideal.ideal_score_base) * 100.0, 0.0, 100.0)

        return _clamp(score_base, 0.0, 100.0)

    def _recalculate_capacities_and_pulse(self, athlete_id: str) -> None:
        now = _now()
        validated_records: list[tuple[WorkoutAttemptRecord, WorkoutResultRecord, WorkoutDefinitionRecord]] = []
        for attempt in self.attempts.values():
            if attempt.athlete_id != athlete_id or attempt.status != AttemptStatus.VALIDATED:
                continue
            result = self._result_by_attempt(attempt.id)
            workout = self.workouts.get(attempt.workout_definition_id)
            if result is None or workout is None:
                continue
            validated_records.append((attempt, result, workout))

        validated_records.sort(key=lambda item: item[0].performed_at)
        attempts_last_60d = sum(1 for attempt, _, _ in validated_records if attempt.performed_at >= now - timedelta(days=60))
        confidence = self._confidence_from_attempts(attempts_last_60d)

        for capacity_type in CapacityType:
            sequence: list[float] = []
            for attempt, result, workout in validated_records:
                weights = self._capacity_weights(workout)
                weight = weights.get(capacity_type)
                if weight is None:
                    continue
                days = max((now - attempt.performed_at).total_seconds() / 86400.0, 0.0)
                decay = math.exp(-(days / 60.0))
                sequence.append(float(result.score_norm) * weight * decay)

            if sequence:
                ema = sequence[0]
                for value in sequence[1:]:
                    ema = (0.3 * value) + (0.7 * ema)
                capacity_value = _clamp(ema, 0.0, 100.0)
            else:
                current = self.capacities.get((athlete_id, capacity_type))
                capacity_value = current.value_0_100 if current else 0.0

            record = AthleteCapacityRecord(
                athlete_id=athlete_id,
                capacity_type=capacity_type,
                value_0_100=capacity_value,
                confidence=confidence,
                last_updated_at=now,
            )
            self.capacities[(athlete_id, capacity_type)] = record
            self.capacity_history.append((athlete_id, capacity_type, now, capacity_value))

        self._recompute_pulse(athlete_id, now)

    def _capacity_weights(self, workout: WorkoutDefinitionRecord) -> dict[CapacityType, float]:
        if workout.capacity_weights:
            return {item.capacity_type: float(item.weight) for item in workout.capacity_weights}

        name = workout.title.lower()
        if "farmer" in name and "sled" in name:
            return {CapacityType.WORK_CAPACITY: 0.8, CapacityType.MUSCULAR_ENDURANCE: 0.2}
        if "deadlift" in name and "farmer" in name:
            return {CapacityType.STRENGTH: 0.6, CapacityType.WORK_CAPACITY: 0.4}
        if "squat" in name:
            return {CapacityType.STRENGTH: 0.4, CapacityType.MUSCULAR_ENDURANCE: 0.6}
        if "press" in name:
            return {CapacityType.MUSCULAR_ENDURANCE: 0.7, CapacityType.STRENGTH: 0.3}
        if "pull" in name:
            return {CapacityType.RELATIVE_STRENGTH: 0.8, CapacityType.MUSCULAR_ENDURANCE: 0.2}
        return {
            CapacityType.STRENGTH: 0.25,
            CapacityType.MUSCULAR_ENDURANCE: 0.25,
            CapacityType.RELATIVE_STRENGTH: 0.25,
            CapacityType.WORK_CAPACITY: 0.25,
        }

    def _confidence_from_attempts(self, attempts_last_60d: int) -> Confidence:
        if attempts_last_60d < 2:
            return Confidence.LOW
        if attempts_last_60d < 5:
            return Confidence.MED
        return Confidence.HIGH

    def _recompute_pulse(self, athlete_id: str, computed_at: datetime) -> None:
        capacities = [self.capacities[(athlete_id, capacity)] for capacity in CapacityType]
        value = _clamp(sum(item.value_0_100 for item in capacities) / len(capacities), 0.0, 100.0)
        confidence = min((item.confidence for item in capacities), key=self._confidence_order)
        explain = [
            {"key": capacity.capacity_type.value, "message": f"value={capacity.value_0_100:.2f}; confidence={capacity.confidence.value}"}
            for capacity in capacities
        ]
        self.pulses[athlete_id] = AthletePulseRecord(
            athlete_id=athlete_id,
            value_0_100=value,
            confidence=confidence,
            computed_at=computed_at,
            explain_json=explain,
        )

    def _confidence_order(self, confidence: Confidence) -> int:
        order = {Confidence.LOW: 0, Confidence.MED: 1, Confidence.HIGH: 2}
        return order[confidence]

    def _ensure_capacity_defaults(self, athlete_id: str) -> None:
        now = _now()
        for capacity in CapacityType:
            key = (athlete_id, capacity)
            if key not in self.capacities:
                self.capacities[key] = AthleteCapacityRecord(
                    athlete_id=athlete_id,
                    capacity_type=capacity,
                    value_0_100=0.0,
                    confidence=Confidence.LOW,
                    last_updated_at=now,
                )

    def _ensure_pulse_default(self, athlete_id: str) -> None:
        if athlete_id in self.pulses:
            return
        self.pulses[athlete_id] = AthletePulseRecord(
            athlete_id=athlete_id,
            value_0_100=0.0,
            confidence=Confidence.LOW,
            computed_at=_now(),
            explain_json=[],
        )

    def _capacity_dtos(self, athlete_id: str) -> list[CapacityDTO]:
        self._ensure_capacity_defaults(athlete_id)
        result: list[CapacityDTO] = []
        for capacity_type in CapacityType:
            record = self.capacities[(athlete_id, capacity_type)]
            result.append(
                CapacityDTO(
                    type=record.capacity_type,
                    value=round(record.value_0_100, 2),
                    confidence=record.confidence,
                    lastUpdatedAt=_iso(record.last_updated_at) or "",
                )
            )
        return result

    def _pulse_to_dto(self, athlete_id: str) -> PulseDTO:
        self._ensure_pulse_default(athlete_id)
        pulse = self.pulses[athlete_id]
        return PulseDTO(
            value=round(pulse.value_0_100, 2),
            confidence=pulse.confidence,
            computedAt=_iso(pulse.computed_at) or "",
            explain=[PulseExplainItemDTO(**item) for item in pulse.explain_json],
        )

    def _attempt_counts(self, athlete_id: str) -> tuple[int, int]:
        now = _now()
        tests7d = 0
        tests30d = 0
        for attempt in self.attempts.values():
            if attempt.athlete_id != athlete_id or attempt.status != AttemptStatus.VALIDATED:
                continue
            if attempt.performed_at >= now - timedelta(days=7):
                tests7d += 1
            if attempt.performed_at >= now - timedelta(days=30):
                tests30d += 1
        return tests7d, tests30d

    def _capacity_trends_30d(self, athlete_id: str) -> list[AthleteTrendDTO]:
        now = _now()
        threshold = now - timedelta(days=30)
        trends: list[AthleteTrendDTO] = []
        for capacity in CapacityType:
            current = self.capacities.get((athlete_id, capacity))
            if current is None:
                trends.append(AthleteTrendDTO(type=capacity, delta=0.0))
                continue

            past_values = [
                value
                for aid, ctype, timestamp, value in self.capacity_history
                if aid == athlete_id and ctype == capacity and timestamp <= threshold
            ]
            baseline = past_values[-1] if past_values else current.value_0_100
            delta = round(current.value_0_100 - baseline, 2)
            trends.append(AthleteTrendDTO(type=capacity, delta=delta))
        return trends

    def _find_assignment(
        self, workout_id: str, scope: AssignmentScope, gym_id: str | None
    ) -> WorkoutAssignmentRecord | None:
        for assignment in self.assignments.values():
            if (
                assignment.workout_definition_id == workout_id
                and assignment.scope == scope
                and assignment.gym_id == gym_id
            ):
                return assignment
        return None

    def _user_current_gym(self, current_user: UserRecord) -> str | None:
        if current_user.role == UserRole.ATHLETE:
            athlete = self._athlete_profile_by_user(current_user.id)
            return athlete.current_gym_id if athlete else None
        if current_user.role == UserRole.COACH:
            return self._coach_gym_id(current_user.id)
        return None

    def _compute_leaderboard(
        self,
        workout_id: str,
        scope: LeaderboardScope,
        gym_id: str | None,
        period: LeaderboardPeriod,
        scale_code: ScaleCode,
        current_user: UserRecord | None,
    ) -> LeaderboardDTO:
        now = _now()
        threshold = now - timedelta(days=30)
        athlete_by_attempt: dict[str, tuple[WorkoutAttemptRecord, WorkoutResultRecord]] = {}

        for attempt in self.attempts.values():
            if attempt.workout_definition_id != workout_id:
                continue
            if attempt.status != AttemptStatus.VALIDATED:
                continue
            if attempt.scale_code != scale_code:
                continue
            if period == LeaderboardPeriod.D30 and attempt.performed_at < threshold:
                continue

            athlete = self.athlete_profiles.get(attempt.athlete_id)
            if athlete is None:
                continue
            if scope == LeaderboardScope.GYM and athlete.current_gym_id != gym_id:
                continue

            result = self._result_by_attempt(attempt.id)
            if result is None:
                continue

            current_best = athlete_by_attempt.get(athlete.id)
            if current_best is None or result.score_norm > current_best[1].score_norm:
                athlete_by_attempt[athlete.id] = (attempt, result)

        ranked = sorted(
            athlete_by_attempt.items(),
            key=lambda item: item[1][1].score_norm,
            reverse=True,
        )

        entries: list[LeaderboardEntryDTO] = []
        my_rank: int | None = None
        for idx, (athlete_id, (_attempt, result)) in enumerate(ranked, start=1):
            athlete_profile = self.athlete_profiles.get(athlete_id)
            user = self.users.get(athlete_profile.user_id) if athlete_profile else None
            display_name = user.email.split("@", 1)[0] if user else athlete_id
            entries.append(
                LeaderboardEntryDTO(
                    rank=idx,
                    athleteId=athlete_id,
                    displayName=display_name,
                    bestScoreNorm=round(result.score_norm, 2),
                )
            )
            if current_user and current_user.role == UserRole.ATHLETE and athlete_profile and athlete_profile.user_id == current_user.id:
                my_rank = idx

        return LeaderboardDTO(
            scope=scope,
            period=period,
            workoutId=workout_id,
            scaleCode=scale_code,
            entries=entries,
            myRank=my_rank,
        )

    def _persist_leaderboard(
        self,
        workout_id: str,
        scope: LeaderboardScope,
        gym_id: str | None,
        period: LeaderboardPeriod,
        scale_code: ScaleCode,
    ) -> None:
        dto = self._compute_leaderboard(workout_id, scope, gym_id, period, scale_code, None)
        key = (workout_id, scope, gym_id, period, scale_code)
        leaderboard = LeaderboardRecord(
            id=str(uuid4()),
            workout_definition_id=workout_id,
            scope=scope,
            gym_id=gym_id,
            period=period,
            scale_code=scale_code,
            updated_at=_now(),
            entries=[],
        )
        for entry in dto.entries:
            best_attempt_id = next(
                (
                    attempt.id
                    for attempt in self.attempts.values()
                    if attempt.athlete_id == entry.athlete_id
                    and attempt.workout_definition_id == workout_id
                    and attempt.scale_code == scale_code
                    and attempt.status == AttemptStatus.VALIDATED
                ),
                "",
            )
            leaderboard.entries.append(
                LeaderboardEntryRecord(
                    leaderboard_id=leaderboard.id,
                    athlete_id=entry.athlete_id,
                    best_attempt_id=best_attempt_id,
                    best_score_norm=entry.best_score_norm,
                    rank=entry.rank,
                    updated_at=_now(),
                )
            )
        self.leaderboards[key] = leaderboard

    def _movement_to_dto(self, movement: MovementRecord) -> MovementDTO:
        return MovementDTO(
            id=movement.id,
            name=movement.name,
            pattern=movement.pattern,
            unitPrimary=movement.unit_primary,
            requiresLoad=movement.requires_load,
            requiresBodyweight=movement.requires_bodyweight,
        )

    def _workout_summary_to_dto(self, workout: WorkoutDefinitionRecord) -> WorkoutDefinitionSummaryDTO:
        return WorkoutDefinitionSummaryDTO(
            id=workout.id,
            title=workout.title,
            isTest=workout.is_test,
            type=workout.type,
            visibility=workout.visibility,
            scoreType=workout.score_type,
            publishedAt=_iso(workout.published_at),
        )

    def _workout_detail_to_dto(self, workout: WorkoutDefinitionRecord) -> WorkoutDefinitionDetailDTO:
        scales = [
            WorkoutScaleDTO(
                code=scale.code,
                label=scale.label,
                notes=scale.notes,
                referenceLoads=scale.reference_loads_json,
            )
            for scale in sorted(workout.scales, key=lambda item: item.code.value)
        ]

        blocks: list[WorkoutDetailBlockDTO] = []
        for block in sorted(workout.blocks, key=lambda item: item.ord):
            movements = []
            for item in sorted(block.movements, key=lambda row: row.ord):
                movement = self.movements.get(item.movement_id)
                if movement is None:
                    continue
                movements.append(
                    WorkoutDetailBlockMovementDTO(
                        id=item.id,
                        ord=item.ord,
                        movement=self._movement_to_dto(movement),
                        reps=item.reps,
                        meters=item.meters,
                        seconds=item.seconds,
                        calories=item.calories,
                        loadRule=item.load_rule,
                        notes=item.notes,
                        boxHeightCm=item.box_height_cm,
                    )
                )

            blocks.append(
                WorkoutDetailBlockDTO(
                    id=block.id,
                    ord=block.ord,
                    name=block.name,
                    blockType=block.block_type,
                    repeatInt=block.repeat_int,
                    timeSeconds=block.time_seconds,
                    capSeconds=block.cap_seconds,
                    movements=movements,
                )
            )

        return WorkoutDefinitionDetailDTO(
            id=workout.id,
            title=workout.title,
            description=workout.description,
            isTest=workout.is_test,
            type=workout.type,
            visibility=workout.visibility,
            scoreType=workout.score_type,
            scales=scales,
            blocks=blocks,
            capacityWeights=[
                WorkoutCapacityWeightDTO(capacityType=item.capacity_type, weight=round(item.weight, 2))
                for item in sorted(workout.capacity_weights, key=lambda row: row.capacity_type.value)
            ],
        )

    def _attempt_to_dto(self, attempt: WorkoutAttemptRecord) -> AttemptDTO:
        result = self._result_by_attempt(attempt.id)
        return AttemptDTO(
            id=attempt.id,
            athleteId=attempt.athlete_id,
            workoutId=attempt.workout_definition_id,
            performedAt=_iso(attempt.performed_at) or "",
            scaleCode=attempt.scale_code,
            status=attempt.status,
            scoreNorm=round(result.score_norm, 2) if result is not None else None,
        )

    def _workout_mutation_to_dto(self, workout: WorkoutDefinitionRecord) -> WorkoutMutationResponseDTO:
        return WorkoutMutationResponseDTO(
            id=workout.id,
            title=workout.title,
            isTest=workout.is_test,
            type=workout.type,
            visibility=workout.visibility,
            scoreType=workout.score_type,
            publishedAt=_iso(workout.published_at),
            updatedAt=_iso(workout.updated_at) or "",
        )

    def _coach_workout_summary_to_dto(self, workout: WorkoutDefinitionRecord) -> CoachWorkoutSummaryDTO:
        return CoachWorkoutSummaryDTO(
            id=workout.id,
            title=workout.title,
            isTest=workout.is_test,
            type=workout.type,
            visibility=workout.visibility,
            scoreType=workout.score_type,
            publishedAt=_iso(workout.published_at),
        )


_RUNTIME_SERVICE: RuntimeService | None = None


def get_runtime_service() -> RuntimeService:
    global _RUNTIME_SERVICE
    if _RUNTIME_SERVICE is None:
        _RUNTIME_SERVICE = RuntimeService()
    return _RUNTIME_SERVICE


def reset_runtime_service() -> RuntimeService:
    service = get_runtime_service()
    service.reset()
    return service
