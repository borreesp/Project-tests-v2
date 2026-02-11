from typing import Annotated

from fastapi import APIRouter, Depends

from src.adapters.inbound.http.deps import current_user_dep, runtime_service_dep
from src.adapters.inbound.http.errors import to_http_exception
from src.application.dtos.auth import (
    InviteCreateRequestDTO,
    InviteCreateResponseDTO,
    LoginRequestDTO,
    LoginResponseDTO,
    LogoutRequestDTO,
    RefreshRequestDTO,
    RefreshResponseDTO,
    RegisterFromInviteRequestDTO,
    RegisterFromInviteResponseDTO,
)
from src.application.dtos.common import StatusResponseDTO
from src.application.services.runtime_service import RuntimeService, ServiceError, UserRecord

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponseDTO)
async def login(
    payload: LoginRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
) -> LoginResponseDTO:
    try:
        return service.login(payload.email, payload.password)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/refresh", response_model=RefreshResponseDTO)
async def refresh(
    payload: RefreshRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
) -> RefreshResponseDTO:
    try:
        return service.refresh(payload.refresh_token)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/logout", response_model=StatusResponseDTO)
async def logout(
    payload: LogoutRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> StatusResponseDTO:
    try:
        service.logout(payload.refresh_token, current_user)
        return StatusResponseDTO(status="ok")
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/invitations", response_model=InviteCreateResponseDTO)
async def create_invitation(
    payload: InviteCreateRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
    current_user: Annotated[UserRecord, Depends(current_user_dep)],
) -> InviteCreateResponseDTO:
    try:
        return service.create_invitation(current_user, payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc


@router.post("/register-from-invite", response_model=RegisterFromInviteResponseDTO)
async def register_from_invite(
    payload: RegisterFromInviteRequestDTO,
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
) -> RegisterFromInviteResponseDTO:
    try:
        return service.register_from_invite(payload)
    except ServiceError as exc:
        raise to_http_exception(exc) from exc
