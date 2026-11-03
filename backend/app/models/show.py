import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Numeric, JSON, Uuid, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, utc_now


class ShowSeatStatus:
    AVAILABLE = "AVAILABLE"
    LOCKED = "LOCKED"
    BOOKED = "BOOKED"


class Show(Base):
    __tablename__ = "shows"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    movie_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("movies.id", ondelete="RESTRICT"), nullable=False, index=True)
    screen_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("screens.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    base_prices: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    movie: Mapped["Movie"] = relationship("Movie", back_populates="shows", lazy="joined")
    screen: Mapped["Screen"] = relationship("Screen", back_populates="shows", lazy="joined")
    show_seats: Mapped[List["ShowSeat"]] = relationship("ShowSeat", back_populates="show", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="show")

    __table_args__ = (
        Index("ix_shows_screen_start_time", "screen_id", "start_time"),
    )

    def __repr__(self):
        return f"<Show {self.movie_id} at {self.start_time}>"


class ShowSeat(Base):
    __tablename__ = "show_seats"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    show_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    seat_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("seats.id", ondelete="RESTRICT"), nullable=False, index=True)
    tier: Mapped[str] = mapped_column(String(50), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ShowSeatStatus.AVAILABLE, nullable=False, index=True)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)

    show: Mapped[Show] = relationship("Show", back_populates="show_seats")
    seat: Mapped["Seat"] = relationship("Seat", lazy="joined")

    __table_args__ = (
        UniqueConstraint("show_id", "seat_id", name="uq_show_seats_show_seat"),
        Index("ix_show_seats_show_status", "show_id", "status"),
    )

    def __repr__(self):
        return f"<ShowSeat {self.id} show={self.show_id} status={self.status}>"
