from collections.abc import AsyncGenerator, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.outbound.persistence.models.enums import UserRole
from src.application.services.runtime_service import (
    RuntimeService,
    UnauthorizedError,
    UserRecord,
    get_runtime_service,
)
from src.infrastructure.db.session import get_db_session

bearer_scheme = HTTPBearer(auto_error=False)


async def db_session_dep() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


def runtime_service_dep() -> RuntimeService:
    return get_runtime_service()


def current_user_dep(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
) -> UserRecord:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        return service.decode_access_token(credentials.credentials)
    except UnauthorizedError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def current_user_optional_dep(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    service: Annotated[RuntimeService, Depends(runtime_service_dep)],
) -> UserRecord | None:
    if credentials is None:
        return None

    try:
        return service.decode_access_token(credentials.credentials)
    except UnauthorizedError:
        return None


def require_roles(*roles: UserRole) -> Callable[[UserRecord], UserRecord]:
    allowed = set(roles)

    def dependency(current_user: Annotated[UserRecord, Depends(current_user_dep)]) -> UserRecord:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency
