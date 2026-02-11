from typing import Protocol

from src.domain.orgs.entities import Organization
from src.domain.shared.ids import OrgId


class OrgRepositoryPort(Protocol):
    async def get_by_id(self, org_id: OrgId) -> Organization | None:
        ...
