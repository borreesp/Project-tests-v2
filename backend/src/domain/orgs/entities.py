from dataclasses import dataclass

from src.domain.shared.ids import OrgId


@dataclass(slots=True)
class Organization:
    id: OrgId
    name: str
