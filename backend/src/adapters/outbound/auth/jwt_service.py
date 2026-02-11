class JwtService:
    def encode(self, payload: dict) -> str:
        raise NotImplementedError

    def decode(self, token: str) -> dict:
        raise NotImplementedError
