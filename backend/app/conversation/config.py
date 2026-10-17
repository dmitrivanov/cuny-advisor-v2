"""No implicit dotenv discovery; no credential repr or logging."""

from dataclasses import dataclass, field
import os


@dataclass(frozen=True)
class Settings:
    enabled: bool = False
    key: str = field(default="", repr=False)
    model: str = "gemini-3.8-flash"

    @classmethod
    def environment(cls):
        return cls(
            enabled=os.getenv("GEMINI_ENABLED", "").lower() == "true"
            and os.getenv("V2_LOCAL_CONVERSATION") == "1",
            key=os.getenv("GEMINI_API_KEY", ""),
            model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        )

    @property
    def available(self):
        return self.enabled and bool(self.key) and bool(self.model)
