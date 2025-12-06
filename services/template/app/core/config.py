from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Template Service"
    
    # Environment
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    JSON_LOGS: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/template_service"
    
    # Security
    ADMIN_API_KEY: str
    INTERNAL_SERVICE_TOKEN: str
    
    # Observability
    OTEL_ENABLE: bool = False
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://otel-collector:4317"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )


settings = Settings()
