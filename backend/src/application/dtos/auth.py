from datetime import date
from typing import Literal

from pydantic import EmailStr, Field

from src.application.dtos.base import DTOModel
from src.adapters.outbound.persistence.models.enums import Sex, UserRole, UserStatus


class LoginRequestDTO(DTOModel):
    email: EmailStr
    password: str


class LoginResponseDTO(DTOModel):
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    role: UserRole


class RefreshRequestDTO(DTOModel):
    refresh_token: str = Field(alias="refreshToken")


class RefreshResponseDTO(DTOModel):
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")


class LogoutRequestDTO(DTOModel):
    refresh_token: str | None = Field(default=None, alias="refreshToken")


class InviteCreateRequestDTO(DTOModel):
    email: EmailStr
    gym_id: str = Field(alias="gymId")


class InviteCreateResponseDTO(DTOModel):
    invitation_id: str = Field(alias="invitationId")
    token: str
    expires_at: str = Field(alias="expiresAt")


class RegisterAthletePayloadDTO(DTOModel):
    sex: Sex | None = None
    birthdate: date | None = None
    height_cm: int | None = Field(default=None, alias="heightCm")
    weight_kg: float | None = Field(default=None, alias="weightKg")


class RegisterFromInviteRequestDTO(DTOModel):
    token: str
    password: str
    display_name: str | None = Field(default=None, alias="displayName")
    athlete: RegisterAthletePayloadDTO


class RegisterFromInviteResponseDTO(DTOModel):
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    role: Literal["ATHLETE"]


class MeResponseDTO(DTOModel):
    id: str
    email: EmailStr
    role: UserRole
    status: UserStatus
