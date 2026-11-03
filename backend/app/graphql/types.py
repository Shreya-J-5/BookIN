import strawberry
from datetime import datetime, date
from typing import Optional, List
import uuid


@strawberry.type
class RoleType:
    id: int
    name: str


@strawberry.type
class UserType:
    id: uuid.UUID
    email: str
    fullName: str
    phone: Optional[str]
    city: str
    isActive: bool
    roles: List[str]

    @classmethod
    def from_model(cls, user) -> "UserType":
        return cls(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            phone=user.phone,
            city=user.city,
            isActive=user.is_active,
            roles=[r.name for r in user.roles]
        )


@strawberry.type
class AuthPayload:
    user: UserType
    accessToken: str
    refreshToken: str


@strawberry.type
class GenreType:
    id: int
    name: str


@strawberry.type
class ReviewType:
    id: uuid.UUID
    userId: uuid.UUID
    userName: str
    rating: int
    comment: Optional[str]
    createdAt: datetime

    @classmethod
    def from_model(cls, review) -> "ReviewType":
        return cls(
            id=review.id,
            userId=review.user_id,
            userName=review.user.full_name if review.user else "Anonymous",
            rating=review.rating,
            comment=review.comment,
            createdAt=review.created_at
        )


@strawberry.type
class MovieType:
    id: uuid.UUID
    title: str
    slug: str
    description: Optional[str]
    language: str
    durationMinutes: int
    releaseDate: date
    posterUrl: Optional[str]
    bannerUrl: Optional[str]
    trailerUrl: Optional[str]
    certification: str
    isActive: bool
    genres: List[GenreType]
    reviews: List[ReviewType]

    @classmethod
    def from_model(cls, movie) -> "MovieType":
        return cls(
            id=movie.id,
            title=movie.title,
            slug=movie.slug,
            description=movie.description,
            language=movie.language,
            durationMinutes=movie.duration_minutes,
            releaseDate=movie.release_date,
            posterUrl=movie.poster_url,
            bannerUrl=movie.banner_url,
            trailerUrl=movie.trailer_url,
            certification=movie.certification,
            isActive=movie.is_active,
            genres=[GenreType(id=g.id, name=g.name) for g in movie.genres],
            reviews=[ReviewType.from_model(r) for r in movie.reviews]
        )


@strawberry.type
class SeatType:
    id: uuid.UUID
    screenId: uuid.UUID
    row: str
    number: int
    tier: str
    isAccessible: bool


@strawberry.type
class ScreenType:
    id: uuid.UUID
    theatreId: uuid.UUID
    name: str
    screenType: str
    totalSeats: int
    seats: List[SeatType]

    @classmethod
    def from_model(cls, screen) -> "ScreenType":
        return cls(
            id=screen.id,
            theatreId=screen.theatre_id,
            name=screen.name,
            screenType=screen.screen_type,
            totalSeats=screen.total_seats,
            seats=[
                SeatType(
                    id=s.id,
                    screenId=s.screen_id,
                    row=s.row,
                    number=s.number,
                    tier=s.tier,
                    isAccessible=s.is_accessible
                ) for s in screen.seats
            ]
        )


@strawberry.type
class TheatreType:
    id: uuid.UUID
    name: str
    city: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    amenities: List[str]
    isActive: bool
    screens: List[ScreenType]

    @classmethod
    def from_model(cls, theatre) -> "TheatreType":
        return cls(
            id=theatre.id,
            name=theatre.name,
            city=theatre.city,
            address=theatre.address,
            latitude=float(theatre.latitude) if theatre.latitude else None,
            longitude=float(theatre.longitude) if theatre.longitude else None,
            amenities=theatre.amenities or [],
            isActive=theatre.is_active,
            screens=[ScreenType.from_model(s) for s in theatre.screens]
        )


@strawberry.type
class ShowSeatType:
    id: uuid.UUID
    seatId: uuid.UUID
    row: str
    number: int
    tier: str
    price: float
    status: str
    isAccessible: bool

    @classmethod
    def from_model(cls, ss) -> "ShowSeatType":
        return cls(
            id=ss.id,
            seatId=ss.seat_id,
            row=ss.seat.row,
            number=ss.seat.number,
            tier=ss.tier,
            price=float(ss.price),
            status=ss.status,
            isAccessible=ss.seat.is_accessible
        )


@strawberry.type
class ShowType:
    id: uuid.UUID
    movieId: uuid.UUID
    screenId: uuid.UUID
    startTime: datetime
    endTime: datetime
    movie: MovieType
    screen: ScreenType
    theatreName: str
    theatreAddress: str
    theatreCity: str

    @classmethod
    def from_model(cls, show) -> "ShowType":
        return cls(
            id=show.id,
            movieId=show.movie_id,
            screenId=show.screen_id,
            startTime=show.start_time,
            endTime=show.end_time,
            movie=MovieType.from_model(show.movie),
            screen=ScreenType.from_model(show.screen),
            theatreName=show.screen.theatre.name,
            theatreAddress=show.screen.theatre.address,
            theatreCity=show.screen.theatre.city
        )


@strawberry.type
class ReservationType:
    reservationId: uuid.UUID
    showId: uuid.UUID
    expiresAt: datetime
    status: str
    reservedSeatsCount: int
    totalPrice: float
    seatLabels: List[str]


@strawberry.type
class BookingSeatType:
    row: str
    number: int
    tier: str
    price: float


@strawberry.type
class BookingType:
    id: uuid.UUID
    bookingRef: str
    showId: uuid.UUID
    movieTitle: str
    moviePosterUrl: Optional[str]
    theatreName: str
    screenName: str
    theatreCity: str
    startTime: datetime
    totalAmount: float
    discountAmount: float
    convenienceFee: float
    taxAmount: float
    status: str
    qrPayload: Optional[str]
    createdAt: datetime
    seats: List[BookingSeatType]

    @classmethod
    def from_model(cls, b) -> "BookingType":
        return cls(
            id=b.id,
            bookingRef=b.booking_ref,
            showId=b.show_id,
            movieTitle=b.show.movie.title,
            moviePosterUrl=b.show.movie.poster_url,
            theatreName=b.show.screen.theatre.name,
            screenName=b.show.screen.name,
            theatreCity=b.show.screen.theatre.city,
            startTime=b.show.start_time,
            totalAmount=float(b.total_amount),
            discountAmount=float(b.discount_amount),
            convenienceFee=float(b.convenience_fee),
            taxAmount=float(b.tax_amount),
            status=b.status,
            qrPayload=b.qr_payload,
            createdAt=b.created_at,
            seats=[
                BookingSeatType(
                    row=bs.show_seat.seat.row,
                    number=bs.show_seat.seat.number,
                    tier=bs.show_seat.tier,
                    price=float(bs.price)
                ) for bs in b.booking_seats
            ]
        )


@strawberry.type
class PaymentOrderPayload:
    paymentId: str
    orderId: str
    amount: float
    currency: str
    keyId: str
    subtotal: float
    discountAmount: float
    convenienceFee: float
    taxAmount: float


@strawberry.type
class CancelBookingPayload:
    success: bool
    message: str
    refundAmount: float


@strawberry.type
class AdminStatsType:
    totalUsers: int
    totalMovies: int
    totalTheatres: int
    totalShows: int
    totalBookings: int
    totalRevenue: float


# Input Types
@strawberry.input
class RegisterInput:
    email: str
    password: str
    fullName: str
    phone: Optional[str] = None
    city: Optional[str] = "Mumbai"
    role: Optional[str] = "CUSTOMER"


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class CreateMovieInput:
    title: str
    language: str
    durationMinutes: int
    releaseDate: date
    description: Optional[str] = None
    slug: Optional[str] = None
    posterUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    trailerUrl: Optional[str] = None
    certification: Optional[str] = "UA"
    genreNames: Optional[List[str]] = None


@strawberry.input
class CreateTheatreInput:
    name: str
    city: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: Optional[List[str]] = None


@strawberry.input
class CreateScreenInput:
    theatreId: uuid.UUID
    name: str
    screenType: Optional[str] = "Dolby Atmos 2D"


@strawberry.input
class ScheduleShowInput:
    movieId: uuid.UUID
    screenId: uuid.UUID
    startTime: datetime
    classicPrice: Optional[float] = 200.0
    primePrice: Optional[float] = 320.0
    reclinerPrice: Optional[float] = 480.0


@strawberry.input
class PaymentConfirmationInput:
    reservationId: uuid.UUID
    razorpayOrderId: str
    razorpayPaymentId: str
    razorpaySignature: str


@strawberry.input
class AddReviewInput:
    movieId: uuid.UUID
    rating: int
    comment: Optional[str] = None
