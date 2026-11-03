import uuid
from typing import List
from sqlalchemy import String, Integer, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Screen(Base):
    __tablename__ = "screens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    theatre_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("theatres.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    screen_type: Mapped[str] = mapped_column(String(50), default="Dolby Atmos 2D", nullable=False)
    total_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    theatre: Mapped["Theatre"] = relationship("Theatre", back_populates="screens")
    seats: Mapped[List["Seat"]] = relationship("Seat", back_populates="screen", cascade="all, delete-orphan", lazy="selectin")
    shows: Mapped[List["Show"]] = relationship("Show", back_populates="screen", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Screen {self.name}>"
