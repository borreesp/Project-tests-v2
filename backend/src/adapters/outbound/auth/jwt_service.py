from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from src.infrastructure.config.settings import get_settings


class JwtService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def encode(self, payload: dict, expires_delta: timedelta) -> str:
        to_encode = payload.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def decode(self, token: str) -> dict:
        try:
            return jwt.decode(token, self.settings.jwt_secret_key, algorithms=[self.settings.jwt_algorithm])
        except JWTError as exc:
            raise ValueError("Invalid token") from exc
