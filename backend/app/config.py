from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Tuneup API"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./tuneup.db"

    # Auth
    secret_key: str = "change-me-in-production-tuneup-secret-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["*"]

    # Game defaults
    default_rounds: int = 10
    default_guess_time: int = 30  # seconds
    points_per_correct: int = 100
    bonus_max: int = 500  # max bonus for fastest guess

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
