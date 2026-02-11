from typing import Protocol

from src.domain.attempts.entities import Attempt
from src.domain.shared.ids import AttemptId


class AttemptRepositoryPort(Protocol):
    async def get_by_id(self, attempt_id: AttemptId) -> Attempt | None:
        ...
