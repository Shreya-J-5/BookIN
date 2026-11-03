import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, Text, Numeric, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, utc_now


class Theatre(Base):
    __tablename__ = "theatres"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    amenities: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    screens: Mapped[List["Screen"]] = relationship("Screen", back_populates="theatre", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Theatre {self.name} - {self.city}>"
