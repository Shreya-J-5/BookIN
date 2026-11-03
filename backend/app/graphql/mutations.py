import strawberry
from typing import Optional, List
import uuid
from strawberry.types import Info
from app.database.connection import SessionLocal
from app.services.auth_service import AuthService
from app.services.movie_service import MovieService
from app.services.theatre_service import TheatreService
from app.services.seat_service import SeatService
from app.services.show_service import ShowService
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService
from app.models.seat import SeatTierEnum
from app.models.show import ShowSeat
from app.graphql.types import (
    AuthPayload,
    UserType,
    MovieType,
    TheatreType,
    ScreenType,
    ShowType,
    ReservationType,
    BookingType,
    PaymentOrderPayload,
    CancelBookingPayload,
    ReviewType,
    RegisterInput,
    LoginInput,
    CreateMovieInput,
    CreateTheatreInput,
    CreateScreenInput,
    ScheduleShowInput,
    PaymentConfirmationInput,
    AddReviewInput,
)
from app.core.permissions import RoleEnum


@strawberry.type
class Mutation:
    @strawberry.mutation
    def register(self, input: RegisterInput) -> AuthPayload:
        db = SessionLocal()
        try:
            user, access_token, refresh_token = AuthService.register_user(
                db=db,
                email=input.email,
                password=input.password,
                full_name=input.fullName,
                phone=input.phone,
                city=input.city or "Mumbai",
                role_name=input.role or RoleEnum.CUSTOMER
            )
            return AuthPayload(
                user=UserType.from_model(user),
                accessToken=access_token,
                refreshToken=refresh_token
            )
        finally:
            db.close()

    @strawberry.mutation
    def login(self, input: LoginInput) -> AuthPayload:
        db = SessionLocal()
        try:
            user, access_token, refresh_token = AuthService.authenticate_user(
                db=db,
                email=input.email,
                password=input.password
            )
            return AuthPayload(
                user=UserType.from_model(user),
                accessToken=access_token,
                refreshToken=refresh_token
            )
        finally:
            db.close()

    @strawberry.mutation
    def refreshToken(self, refreshToken: str) -> AuthPayload:
        db = SessionLocal()
        try:
            access_token, new_refresh = AuthService.refresh_access_token(db, refreshToken)
            from app.core.security import decode_token
            payload = decode_token(access_token)
            user = AuthService.get_user_by_id(db, uuid.UUID(payload["sub"]))
            return AuthPayload(
                user=UserType.from_model(user),
                accessToken=access_token,
                refreshToken=new_refresh
            )
        finally:
            db.close()

    @strawberry.mutation
    def createMovie(self, info: Info, input: CreateMovieInput) -> MovieType:
        user_ctx = info.context.get("user")
        if not user_ctx or not any(r in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN] for r in user_ctx.get("roles", [])):
            raise ValueError("Admin permissions required to create movies.")

        db = SessionLocal()
        try:
            movie = MovieService.create_movie(
                db=db,
                title=input.title,
                language=input.language,
                duration_minutes=input.durationMinutes,
                release_date=input.releaseDate,
                description=input.description,
                slug=input.slug,
                poster_url=input.posterUrl,
                banner_url=input.bannerUrl,
                trailer_url=input.trailerUrl,
                certification=input.certification or "UA",
                genre_names=input.genreNames
            )
            return MovieType.from_model(movie)
        finally:
            db.close()

    @strawberry.mutation
    def createTheatre(self, info: Info, input: CreateTheatreInput) -> TheatreType:
        user_ctx = info.context.get("user")
        if not user_ctx or not any(r in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN] for r in user_ctx.get("roles", [])):
            raise ValueError("Admin permissions required to create theatres.")

        db = SessionLocal()
        try:
            theatre = TheatreService.create_theatre(
                db=db,
                name=input.name,
                city=input.city,
                address=input.address,
                latitude=input.latitude,
                longitude=input.longitude,
                amenities=input.amenities
            )
            return TheatreType.from_model(theatre)
        finally:
            db.close()

    @strawberry.mutation
    def createScreen(self, info: Info, input: CreateScreenInput) -> ScreenType:
        user_ctx = info.context.get("user")
        if not user_ctx or not any(r in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.THEATRE_ADMIN] for r in user_ctx.get("roles", [])):
            raise ValueError("Theatre Admin or Admin permissions required to create screens.")

        db = SessionLocal()
        try:
            screen = TheatreService.create_screen(
                db=db,
                theatre_id=input.theatreId,
                name=input.name,
                screen_type=input.screenType or "Dolby Atmos 2D"
            )
            # Automatically populate standard screen seat layout
            SeatService.create_screen_seat_layout(db=db, screen_id=screen.id)
            db.refresh(screen)
            return ScreenType.from_model(screen)
        finally:
            db.close()

    @strawberry.mutation
    def scheduleShow(self, info: Info, input: ScheduleShowInput) -> ShowType:
        user_ctx = info.context.get("user")
        if not user_ctx or not any(r in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.THEATRE_ADMIN] for r in user_ctx.get("roles", [])):
            raise ValueError("Theatre Admin or Admin permissions required to schedule shows.")

        db = SessionLocal()
        try:
            base_prices = {
                SeatTierEnum.CLASSIC: input.classicPrice or 200.0,
                SeatTierEnum.PRIME: input.primePrice or 320.0,
                SeatTierEnum.RECLINER: input.reclinerPrice or 480.0
            }
            show = ShowService.schedule_show(
                db=db,
                movie_id=input.movieId,
                screen_id=input.screenId,
                start_time=input.startTime,
                base_prices=base_prices
            )
            return ShowType.from_model(show)
        finally:
            db.close()

    @strawberry.mutation
    def reserveSeats(self, info: Info, showId: uuid.UUID, seatIds: List[uuid.UUID]) -> ReservationType:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required to reserve seats.")

        db = SessionLocal()
        try:
            reservation = BookingService.reserve_seats(
                db=db,
                show_id=showId,
                seat_ids=seatIds,
                user_id=uuid.UUID(user_ctx["id"]),
                duration_minutes=10
            )

            # Query show seats for summary
            show_seats = db.query(ShowSeat).filter(
                ShowSeat.show_id == showId,
                ShowSeat.seat_id.in_(seatIds)
            ).all()

            total_price = sum(float(s.price) for s in show_seats)
            labels = [f"{s.seat.row}{s.seat.number}" for s in show_seats]

            return ReservationType(
                reservationId=reservation.id,
                showId=showId,
                expiresAt=reservation.expires_at,
                status=reservation.status,
                reservedSeatsCount=len(seatIds),
                totalPrice=total_price,
                seatLabels=labels
            )
        finally:
            db.close()

    @strawberry.mutation
    def releaseReservation(self, info: Info, reservationId: uuid.UUID) -> bool:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            return BookingService.release_reservation(
                db=db,
                reservation_id=reservationId,
                user_id=uuid.UUID(user_ctx["id"])
            )
        finally:
            db.close()

    @strawberry.mutation
    def createPaymentOrder(self, info: Info, reservationId: uuid.UUID, couponCode: Optional[str] = None) -> PaymentOrderPayload:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            order_data = PaymentService.create_payment_order(
                db=db,
                reservation_id=reservationId,
                user_id=uuid.UUID(user_ctx["id"]),
                coupon_code=couponCode
            )
            return PaymentOrderPayload(
                paymentId=order_data["payment_id"],
                orderId=order_data["order_id"],
                amount=order_data["amount"],
                currency=order_data["currency"],
                keyId=order_data["key_id"],
                subtotal=order_data["subtotal"],
                discountAmount=order_data["discount_amount"],
                convenienceFee=order_data["convenience_fee"],
                taxAmount=order_data["tax_amount"]
            )
        finally:
            db.close()

    @strawberry.mutation
    def verifyPaymentAndBook(self, info: Info, input: PaymentConfirmationInput) -> BookingType:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            booking = PaymentService.verify_payment_and_confirm(
                db=db,
                reservation_id=input.reservationId,
                razorpay_order_id=input.razorpayOrderId,
                razorpay_payment_id=input.razorpayPaymentId,
                razorpay_signature=input.razorpaySignature,
                user_id=uuid.UUID(user_ctx["id"])
            )
            return BookingType.from_model(booking)
        finally:
            db.close()

    @strawberry.mutation
    def cancelBooking(self, info: Info, bookingId: uuid.UUID) -> CancelBookingPayload:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            success, msg, refund_val = BookingService.cancel_booking(
                db=db,
                booking_id=bookingId,
                user_id=uuid.UUID(user_ctx["id"])
            )
            return CancelBookingPayload(
                success=success,
                message=msg,
                refundAmount=refund_val
            )
        finally:
            db.close()

    @strawberry.mutation
    def addReview(self, info: Info, input: AddReviewInput) -> ReviewType:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            review = MovieService.add_review(
                db=db,
                user_id=uuid.UUID(user_ctx["id"]),
                movie_id=input.movieId,
                rating=input.rating,
                comment=input.comment
            )
            return ReviewType.from_model(review)
        finally:
            db.close()
