from typing import Protocol

from src.domain.shared.ids import UserId
from src.domain.users.entities import User


class UserRepositoryPort(Protocol):
    async def get_by_id(self, user_id: UserId) -> User | None:
        ...
