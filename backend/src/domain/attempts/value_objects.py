from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AttemptScore:
    value: int
