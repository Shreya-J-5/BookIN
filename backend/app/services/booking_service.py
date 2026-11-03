import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.booking import (
    Reservation,
    ReservationSeat,
    Booking,
    BookingSeat,
    ReservationStatus,
    BookingStatus,
    Coupon,
)
from app.models.show import Show, ShowSeat, ShowSeatStatus
from app.core.config import settings


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def generate_booking_reference() -> str:
    # Format: BIN-XXXXX (e.g. BIN-7K9A2)
    suffix = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
    return f"BIN-{suffix}"


class BookingService:
    @classmethod
    def reserve_seats(
        cls,
        db: Session,
        show_id: uuid.UUID,
        seat_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        duration_minutes: int = 10
    ) -> Reservation:
        if not seat_ids:
            raise ValueError("At least one seat must be selected.")

        if len(seat_ids) > 10:
            raise ValueError("Cannot reserve more than 10 seats in a single transaction.")

        # Ensure show exists and is active
        show = db.query(Show).filter(Show.id == show_id, Show.is_active == True).first()
        if not show:
            raise ValueError("Show not found or inactive.")

        now = datetime.now(timezone.utc)
        if ensure_utc(show.start_time) < now:
            raise ValueError("Cannot reserve seats for a show that has already started.")

        try:
            # Query target ShowSeats with row-level lock (SELECT FOR UPDATE)
            query = db.query(ShowSeat).filter(
                ShowSeat.show_id == show_id,
                ShowSeat.seat_id.in_(seat_ids)
            )

            # In PostgreSQL or supported DBs, apply with_for_update()
            if not settings.is_sqlite:
                query = query.with_for_update()

            target_show_seats = query.all()

            if len(target_show_seats) != len(seat_ids):
                raise ValueError("One or more selected seats do not exist in this show.")

            # Validate each seat's availability
            for ss in target_show_seats:
                seat_label = f"{ss.seat.row}{ss.seat.number}"

                if ss.status == ShowSeatStatus.BOOKED:
                    raise ValueError(f"Seat {seat_label} is already booked.")

                if ss.status == ShowSeatStatus.LOCKED:
                    # Check if lock has expired
                    if ss.locked_until and ensure_utc(ss.locked_until) > now:
                        # Active lock exists
                        if ss.locked_by_user_id != user_id:
                            raise ValueError(f"Seat {seat_label} is currently reserved by another customer.")

            expires_at = now + timedelta(minutes=duration_minutes)

            # Create Reservation
            reservation = Reservation(
                user_id=user_id,
                show_id=show_id,
                expires_at=expires_at,
                status=ReservationStatus.PENDING
            )
            db.add(reservation)
            db.flush()

            # Associate seats and atomically update status
            for ss in target_show_seats:
                seat_label = f"{ss.seat.row}{ss.seat.number}"
                
                updated_count = db.query(ShowSeat).filter(
                    ShowSeat.id == ss.id,
                    or_(
                        ShowSeat.status == ShowSeatStatus.AVAILABLE,
                        and_(ShowSeat.status == ShowSeatStatus.LOCKED, ShowSeat.locked_until < now),
                        and_(ShowSeat.status == ShowSeatStatus.LOCKED, ShowSeat.locked_by_user_id == user_id)
                    )
                ).update({
                    "status": ShowSeatStatus.LOCKED,
                    "locked_until": expires_at,
                    "locked_by_user_id": user_id
                }, synchronize_session=False)

                if updated_count == 0:
                    raise ValueError(f"Seat {seat_label} is currently reserved by another customer.")

                res_seat = ReservationSeat(
                    reservation_id=reservation.id,
                    show_seat_id=ss.id
                )
                db.add(res_seat)

            db.commit()
            db.refresh(reservation)
            return reservation

        except Exception:
            db.rollback()
            raise

    @classmethod
    def release_reservation(
        cls,
        db: Session,
        reservation_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None
    ) -> bool:
        reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
        if not reservation:
            return False

        if user_id and reservation.user_id != user_id:
            raise ValueError("You do not have permission to release this reservation.")

        if reservation.status == ReservationStatus.PENDING:
            reservation.status = ReservationStatus.CANCELLED
            for rs in reservation.reservation_seats:
                if rs.show_seat and rs.show_seat.status == ShowSeatStatus.LOCKED:
                    rs.show_seat.status = ShowSeatStatus.AVAILABLE
                    rs.show_seat.locked_until = None
                    rs.show_seat.locked_by_user_id = None
            db.commit()
            return True
        return False

    @classmethod
    def cleanup_expired_reservations(cls, db: Session) -> int:
        now = datetime.now(timezone.utc)
        expired_reservations = db.query(Reservation).filter(
            Reservation.status == ReservationStatus.PENDING,
            Reservation.expires_at < now
        ).all()

        count = 0
        for res in expired_reservations:
            res.status = ReservationStatus.EXPIRED
            for rs in res.reservation_seats:
                if rs.show_seat and rs.show_seat.status == ShowSeatStatus.LOCKED:
                    rs.show_seat.status = ShowSeatStatus.AVAILABLE
                    rs.show_seat.locked_until = None
                    rs.show_seat.locked_by_user_id = None
            count += 1

        # Also sweep any orphaned locked seats whose lock time passed
        orphaned_seats = db.query(ShowSeat).filter(
            ShowSeat.status == ShowSeatStatus.LOCKED,
            ShowSeat.locked_until < now
        ).all()
        for os in orphaned_seats:
            os.status = ShowSeatStatus.AVAILABLE
            os.locked_until = None
            os.locked_by_user_id = None

        if count > 0 or orphaned_seats:
            db.commit()

        return count

    @classmethod
    def apply_coupon(
        cls,
        db: Session,
        code: str,
        base_amount: float
    ) -> Tuple[float, Optional[str]]:
        coupon = db.query(Coupon).filter(
            Coupon.code == code.strip().upper(),
            Coupon.is_active == True
        ).first()

        if not coupon:
            return 0.0, "Invalid coupon code."

        now = datetime.now(timezone.utc)
        if ensure_utc(coupon.valid_until) < now:
            return 0.0, "Coupon has expired."

        if base_amount < float(coupon.min_spend):
            return 0.0, f"Minimum spend of ₹{coupon.min_spend} required for this coupon."

        discount = (base_amount * coupon.discount_percent) / 100.0
        if discount > float(coupon.max_discount):
            discount = float(coupon.max_discount)

        return round(discount, 2), None

    @classmethod
    def confirm_booking(
        cls,
        db: Session,
        reservation_id: uuid.UUID,
        user_id: uuid.UUID,
        payment_id: Optional[uuid.UUID] = None,
        discount_amount: float = 0.0
    ) -> Booking:
        now = datetime.now(timezone.utc)

        # Lock the reservation
        query = db.query(Reservation).filter(Reservation.id == reservation_id)
        if not settings.is_sqlite:
            query = query.with_for_update()
        reservation = query.first()

        if not reservation:
            raise ValueError(f"Reservation {reservation_id} not found.")

        if reservation.user_id != user_id:
            raise ValueError("Reservation does not belong to the authenticated user.")

        if reservation.status == ReservationStatus.COMPLETED:
            # Already completed, fetch associated booking
            booking = db.query(Booking).filter(Booking.user_id == user_id, Booking.show_id == reservation.show_id).first()
            if booking:
                return booking
            raise ValueError("Reservation was already converted to a booking.")

        if reservation.status != ReservationStatus.PENDING:
            raise ValueError(f"Cannot confirm booking: reservation is {reservation.status}.")

        if ensure_utc(reservation.expires_at) < now:
            reservation.status = ReservationStatus.EXPIRED
            db.commit()
            raise ValueError("Seat reservation has expired. Please select your seats again.")

        # Compute price calculations
        seat_prices = [float(rs.show_seat.price) for rs in reservation.reservation_seats]
        subtotal = sum(seat_prices)
        convenience_fee = 30.00
        tax = round((subtotal + convenience_fee) * 0.18, 2)  # 18% GST
        final_total = max(0.0, round(subtotal + convenience_fee + tax - discount_amount, 2))

        # Generate unique reference
        booking_ref = generate_booking_reference()

        # Construct QR code payload containing essential verification data
        qr_payload = f"BOOKIN|{booking_ref}|{reservation.show_id}|{len(seat_prices)}SEATS|INR{final_total}"

        booking = Booking(
            booking_ref=booking_ref,
            user_id=user_id,
            show_id=reservation.show_id,
            total_amount=final_total,
            discount_amount=discount_amount,
            convenience_fee=convenience_fee,
            tax_amount=tax,
            status=BookingStatus.CONFIRMED,
            qr_payload=qr_payload
        )
        db.add(booking)
        db.flush()

        # Create BookingSeat records and mark ShowSeats as BOOKED
        for rs in reservation.reservation_seats:
            booking_seat = BookingSeat(
                booking_id=booking.id,
                show_seat_id=rs.show_seat_id,
                price=rs.show_seat.price
            )
            db.add(booking_seat)

            # Permanent booked status
            rs.show_seat.status = ShowSeatStatus.BOOKED
            rs.show_seat.locked_until = None
            rs.show_seat.locked_by_user_id = None

        # Mark reservation as COMPLETED
        reservation.status = ReservationStatus.COMPLETED

        # Link payment if provided
        if payment_id:
            from app.models.payment import Payment
            payment = db.query(Payment).filter(Payment.id == payment_id).first()
            if payment:
                payment.booking_id = booking.id

        db.commit()
        db.refresh(booking)
        return booking

    @classmethod
    def get_booking_by_ref(cls, db: Session, booking_ref: str) -> Optional[Booking]:
        return db.query(Booking).filter(Booking.booking_ref == booking_ref).first()

    @classmethod
    def get_booking_by_id(cls, db: Session, booking_id: uuid.UUID) -> Optional[Booking]:
        return db.query(Booking).filter(Booking.id == booking_id).first()

    @classmethod
    def get_user_bookings(cls, db: Session, user_id: uuid.UUID) -> List[Booking]:
        return (
            db.query(Booking)
            .filter(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
            .all()
        )

    @classmethod
    def cancel_booking(cls, db: Session, booking_id: uuid.UUID, user_id: uuid.UUID) -> Tuple[bool, str, float]:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found.")

        if booking.user_id != user_id:
            raise ValueError("You are not authorized to cancel this booking.")

        if booking.status != BookingStatus.CONFIRMED:
            raise ValueError(f"Booking cannot be cancelled because it is already {booking.status}.")

        # Check showtime cancellation policy: can only cancel > 2 hours before show
        now = datetime.now(timezone.utc)
        if ensure_utc(booking.show.start_time) - now < timedelta(hours=2):
            raise ValueError("Tickets cannot be cancelled within 2 hours of showtime.")

        booking.status = BookingStatus.CANCELLED

        # Release seats back to AVAILABLE
        for bs in booking.booking_seats:
            if bs.show_seat:
                bs.show_seat.status = ShowSeatStatus.AVAILABLE
                bs.show_seat.locked_until = None
                bs.show_seat.locked_by_user_id = None

        # Refund computation (deduct ₹50 cancellation fee)
        refund_amount = max(0.0, float(booking.total_amount) - 50.00)

        db.commit()
        return True, "Booking cancelled successfully. Refund initiated.", refund_amount
