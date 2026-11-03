import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Numeric, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, utc_now


class ReservationStatus:
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class BookingStatus:
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    show_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default=ReservationStatus.PENDING, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User")
    show: Mapped["Show"] = relationship("Show")
    reservation_seats: Mapped[List["ReservationSeat"]] = relationship("ReservationSeat", back_populates="reservation", cascade="all, delete-orphan", lazy="selectin")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="reservation", uselist=False)

    def __repr__(self):
        return f"<Reservation {self.id} status={self.status}>"


class ReservationSeat(Base):
    __tablename__ = "reservation_seats"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reservation_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, index=True)
    show_seat_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("show_seats.id", ondelete="RESTRICT"), nullable=False)

    reservation: Mapped[Reservation] = relationship("Reservation", back_populates="reservation_seats")
    show_seat: Mapped["ShowSeat"] = relationship("ShowSeat", lazy="joined")

    __table_args__ = (
        UniqueConstraint("reservation_id", "show_seat_id", name="uq_reservation_seats_res_seat"),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_ref: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    show_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("shows.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    convenience_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=30.00, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=5.40, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    qr_payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="bookings")
    show: Mapped["Show"] = relationship("Show", back_populates="bookings", lazy="joined")
    booking_seats: Mapped[List["BookingSeat"]] = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan", lazy="selectin")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="booking")

    def __repr__(self):
        return f"<Booking {self.booking_ref} status={self.status}>"


class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    show_seat_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("show_seats.id", ondelete="RESTRICT"), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    booking: Mapped[Booking] = relationship("Booking", back_populates="booking_seats")
    show_seat: Mapped["ShowSeat"] = relationship("ShowSeat", lazy="joined")

    __table_args__ = (
        UniqueConstraint("booking_id", "show_seat_id", name="uq_booking_seats_booking_seat"),
    )


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    discount_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    max_discount: Mapped[float] = mapped_column(Numeric(10, 2), default=150.00, nullable=False)
    min_spend: Mapped[float] = mapped_column(Numeric(10, 2), default=200.00, nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Coupon {self.code} ({self.discount_percent}%)>"


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    movie: Mapped["Movie"] = relationship("Movie", back_populates="reviews")

    def __repr__(self):
        return f"<Review {self.id} rating={self.rating}>"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.title}>"
