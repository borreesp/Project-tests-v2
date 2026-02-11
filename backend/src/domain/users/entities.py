from dataclasses import dataclass

from src.domain.shared.ids import OrgId, UserId


@dataclass(slots=True)
class User:
    id: UserId
    org_id: OrgId
    email: str
    hashed_password: str
