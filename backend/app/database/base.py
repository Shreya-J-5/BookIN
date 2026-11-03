import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Uuid, DateTime


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
