import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.payment import Payment, Refund, PaymentStatus
from app.models.booking import Reservation, ReservationStatus, Booking
from app.services.booking_service import BookingService, ensure_utc
from app.integrations.razorpay import razorpay_client
from app.integrations.email import email_service
from app.core.config import settings


class PaymentService:
    @classmethod
    def create_payment_order(
        cls,
        db: Session,
        reservation_id: uuid.UUID,
        user_id: uuid.UUID,
        coupon_code: Optional[str] = None
    ) -> Dict[str, Any]:
        reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
        if not reservation:
            raise ValueError(f"Reservation {reservation_id} not found.")

        if reservation.user_id != user_id:
            raise ValueError("Reservation does not belong to the authenticated user.")

        now = datetime.now(timezone.utc)
        if reservation.status != ReservationStatus.PENDING or ensure_utc(reservation.expires_at) < now:
            raise ValueError("Reservation has expired or is no longer pending.")

        # Calculate subtotal
        seat_prices = [float(rs.show_seat.price) for rs in reservation.reservation_seats]
        subtotal = sum(seat_prices)

        discount_amount = 0.0
        if coupon_code:
            discount_amount, error = BookingService.apply_coupon(db, coupon_code, subtotal)
            if error:
                raise ValueError(error)

        convenience_fee = 30.00
        tax = round((subtotal + convenience_fee) * 0.18, 2)
        total_amount = max(1.0, round(subtotal + convenience_fee + tax - discount_amount, 2))

        # Check existing payment record for this reservation
        payment = db.query(Payment).filter(Payment.reservation_id == reservation_id).first()

        order_data = razorpay_client.create_order(
            amount_in_rupees=total_amount,
            receipt=f"rcpt_res_{reservation.id.hex[:8]}"
        )

        if not payment:
            payment = Payment(
                reservation_id=reservation_id,
                user_id=user_id,
                razorpay_order_id=order_data["order_id"],
                amount=total_amount,
                currency="INR",
                status=PaymentStatus.PENDING
            )
            db.add(payment)
        else:
            payment.razorpay_order_id = order_data["order_id"]
            payment.amount = total_amount
            payment.status = PaymentStatus.PENDING

        db.commit()
        db.refresh(payment)

        return {
            "payment_id": str(payment.id),
            "order_id": order_data["order_id"],
            "amount": total_amount,
            "currency": "INR",
            "key_id": order_data["key_id"],
            "discount_amount": discount_amount,
            "convenience_fee": convenience_fee,
            "tax_amount": tax,
            "subtotal": subtotal
        }

    @classmethod
    def verify_payment_and_confirm(
        cls,
        db: Session,
        reservation_id: uuid.UUID,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        user_id: uuid.UUID
    ) -> Booking:
        # Cryptographically verify signature
        is_valid = razorpay_client.verify_payment_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature
        )

        if not is_valid:
            raise ValueError("Payment signature verification failed. Transaction cannot be confirmed.")

        # Find payment record
        payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()
        if not payment:
            # Create payment record if created externally
            payment = Payment(
                reservation_id=reservation_id,
                user_id=user_id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                amount=0.0,
                status=PaymentStatus.SUCCESS
            )
            db.add(payment)
            db.flush()

        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = PaymentStatus.SUCCESS

        # Atomically confirm booking
        booking = BookingService.confirm_booking(
            db=db,
            reservation_id=reservation_id,
            user_id=user_id,
            payment_id=payment.id
        )

        # Dispatch confirmation email asynchronously/in background
        try:
            seats_str = ", ".join([f"{bs.show_seat.seat.row}{bs.show_seat.seat.number}" for bs in booking.booking_seats])
            email_service.send_ticket_confirmation(
                to_email=booking.user.email,
                user_name=booking.user.full_name,
                booking_ref=booking.booking_ref,
                movie_title=booking.show.movie.title,
                theatre_name=booking.show.screen.theatre.name,
                screen_name=booking.show.screen.name,
                show_time=booking.show.start_time.strftime("%d %b %Y, %I:%M %p"),
                seats_str=seats_str,
                total_amount=float(booking.total_amount)
            )
        except Exception as e:
            print(f"Non-blocking email warning: {e}")

        return booking

    @classmethod
    def handle_payment_failure(cls, db: Session, razorpay_order_id: str, reason: str) -> None:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()
        if payment:
            payment.status = PaymentStatus.FAILED
            db.commit()

    @classmethod
    def handle_webhook(cls, db: Session, event_payload: dict) -> Dict[str, Any]:
        event_name = event_payload.get("event")
        entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})

        order_id = entity.get("order_id")
        payment_id = entity.get("id")

        if event_name == "payment.captured" and order_id:
            payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
            if payment and payment.status != PaymentStatus.SUCCESS:
                payment.status = PaymentStatus.SUCCESS
                payment.razorpay_payment_id = payment_id
                if payment.reservation_id and payment.user_id:
                    try:
                        BookingService.confirm_booking(
                            db=db,
                            reservation_id=payment.reservation_id,
                            user_id=payment.user_id,
                            payment_id=payment.id
                        )
                    except Exception as e:
                        print(f"Webhook booking confirmation note: {e}")
                db.commit()

        elif event_name == "payment.failed" and order_id:
            cls.handle_payment_failure(db, order_id, entity.get("error_description", "Payment failed"))

        return {"status": "processed", "event": event_name}
