from typing import Protocol

from src.domain.progress.entities import Progress
from src.domain.shared.ids import UserId


class ProgressRepositoryPort(Protocol):
    async def get_by_user_id(self, user_id: UserId) -> Progress | None:
        ...
