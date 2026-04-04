from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = f"sqlite:///{BASE_DIR / 'insurgig.db'}"
    openweather_api_key: str = ""
    aqicn_token: str = ""
    google_maps_api_key: str = ""
    imd_alerts_url: str = ""
    cors_origins: str = "http://localhost:8080,http://127.0.0.1:8080"

    ring_window_minutes: int = 15
    ring_claim_threshold: int = 3
    soft_trigger_threshold: float = 0.65
    category_a_multiplier: float = 2.5

    jwt_secret: str = "dev-only-change-in-production"
    otp_ttl_seconds: int = 600
    """When true, OTP verify response includes the code (demo / no SMS provider)."""
    expose_otp_in_response: bool = True


settings = Settings()
