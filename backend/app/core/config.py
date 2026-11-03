from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "BookIN"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:5173"

    # Database URLs
    DATABASE_URL: str = "sqlite:///./bookin.db"
    ASYNC_DATABASE_URL: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Authentication
    JWT_SECRET_KEY: str = "9a7b5c3e1f8a2d4b6c8e0f1a3b5c7d9e2f4a6b8c0d1e3f5a7b9c1d3e5f7a9b1c"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Seat Reservation
    SEAT_LOCK_DURATION_MINUTES: int = 10

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = "rzp_test_bookin_mock_key"
    RAZORPAY_KEY_SECRET: str = "rzp_test_bookin_mock_secret"
    RAZORPAY_WEBHOOK_SECRET: str = "rzp_webhook_secret_bookin"

    # Email Notifications
    EMAIL_HOST: Optional[str] = None
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "notifications@bookin.com"

    # Initial Super Admin credentials
    SUPERADMIN_EMAIL: str = "admin@bookin.com"
    SUPERADMIN_PASSWORD: str = "Admin@BookIN2026!"
    SUPERADMIN_NAME: str = "BookIN Super Administrator"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def sync_database_url(self) -> str:
        # Standardize synchronous connection string
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def async_database_url_resolved(self) -> str:
        if self.ASYNC_DATABASE_URL:
            return self.ASYNC_DATABASE_URL
        url = self.DATABASE_URL
        if url.startswith("postgresql+psycopg://"):
            return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url


settings = Settings()
