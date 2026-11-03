import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, utc_now


class PaymentStatus:
    CREATED = "CREATED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    reservation_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("reservations.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    razorpay_signature: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=PaymentStatus.CREATED, nullable=False, index=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User")
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="payments")
    reservation: Mapped[Optional["Reservation"]] = relationship("Reservation", back_populates="payment")
    refunds: Mapped[List["Refund"]] = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Payment {self.id} order={self.razorpay_order_id} status={self.status}>"


class Refund(Base):
    __tablename__ = "refunds"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    razorpay_refund_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    payment: Mapped[Payment] = relationship("Payment", back_populates="refunds")

    def __repr__(self):
        return f"<Refund {self.id} amount={self.amount} status={self.status}>"
