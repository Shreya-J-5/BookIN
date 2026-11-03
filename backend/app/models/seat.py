import uuid
from typing import Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SeatTierEnum:
    CLASSIC = "CLASSIC"
    PRIME = "PRIME"
    RECLINER = "RECLINER"


class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    screen_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("screens.id", ondelete="CASCADE"), nullable=False, index=True)
    row: Mapped[str] = mapped_column(String(5), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    tier: Mapped[str] = mapped_column(String(50), default=SeatTierEnum.CLASSIC, nullable=False)
    is_accessible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    screen: Mapped["Screen"] = relationship("Screen", back_populates="seats")

    __table_args__ = (
        UniqueConstraint("screen_id", "row", "number", name="uq_seats_screen_row_number"),
    )

    def __repr__(self):
        return f"<Seat {self.row}{self.number} ({self.tier})>"
