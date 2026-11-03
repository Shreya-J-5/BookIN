import strawberry
from typing import Optional, List
from datetime import date
import uuid
from strawberry.types import Info
from app.database.connection import SessionLocal
from app.services.movie_service import MovieService
from app.services.theatre_service import TheatreService
from app.services.show_service import ShowService
from app.services.booking_service import BookingService
from app.services.auth_service import AuthService
from app.models.user import User
from app.models.movie import Movie
from app.models.theatre import Theatre
from app.models.show import Show
from app.models.booking import Booking
from app.graphql.types import (
    MovieType,
    GenreType,
    TheatreType,
    ShowType,
    ShowSeatType,
    UserType,
    BookingType,
    AdminStatsType,
)
from app.core.permissions import RoleEnum


@strawberry.type
class Query:
    @strawberry.field
    def movies(
        self,
        city: Optional[str] = None,
        genre: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[MovieType]:
        db = SessionLocal()
        try:
            movies = MovieService.get_movies(
                db, city=city, genre=genre, language=language, search=search, limit=limit, offset=offset
            )
            return [MovieType.from_model(m) for m in movies]
        finally:
            db.close()

    @strawberry.field
    def movie(
        self,
        id: Optional[uuid.UUID] = None,
        slug: Optional[str] = None
    ) -> Optional[MovieType]:
        db = SessionLocal()
        try:
            if id:
                m = MovieService.get_movie_by_id(db, id)
            elif slug:
                m = MovieService.get_movie_by_slug(db, slug)
            else:
                return None
            return MovieType.from_model(m) if m else None
        finally:
            db.close()

    @strawberry.field
    def genres(self) -> List[GenreType]:
        db = SessionLocal()
        try:
            genres = MovieService.get_genres(db)
            return [GenreType(id=g.id, name=g.name) for g in genres]
        finally:
            db.close()

    @strawberry.field
    def cities(self) -> List[str]:
        db = SessionLocal()
        try:
            cities_list = TheatreService.get_cities(db)
            if not cities_list:
                return ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Pune", "Kolkata"]
            return cities_list
        finally:
            db.close()

    @strawberry.field
    def theatres(
        self,
        city: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[TheatreType]:
        db = SessionLocal()
        try:
            theatres = TheatreService.get_theatres(db, city=city, search=search, limit=limit, offset=offset)
            return [TheatreType.from_model(t) for t in theatres]
        finally:
            db.close()

    @strawberry.field
    def theatre(self, id: uuid.UUID) -> Optional[TheatreType]:
        db = SessionLocal()
        try:
            t = TheatreService.get_theatre_by_id(db, id)
            return TheatreType.from_model(t) if t else None
        finally:
            db.close()

    @strawberry.field
    def shows(
        self,
        movieId: Optional[uuid.UUID] = None,
        city: Optional[str] = None,
        date: Optional[date] = None,
        theatreId: Optional[uuid.UUID] = None,
        screenId: Optional[uuid.UUID] = None
    ) -> List[ShowType]:
        db = SessionLocal()
        try:
            shows = ShowService.get_shows(
                db, movie_id=movieId, city=city, date_filter=date, theatre_id=theatreId, screen_id=screenId
            )
            return [ShowType.from_model(s) for s in shows]
        finally:
            db.close()

    @strawberry.field
    def show(self, id: uuid.UUID) -> Optional[ShowType]:
        db = SessionLocal()
        try:
            s = ShowService.get_show_by_id(db, id)
            return ShowType.from_model(s) if s else None
        finally:
            db.close()

    @strawberry.field
    def showSeats(self, showId: uuid.UUID) -> List[ShowSeatType]:
        db = SessionLocal()
        try:
            show_seats = ShowService.get_show_seats(db, showId)
            return [ShowSeatType.from_model(ss) for ss in show_seats]
        finally:
            db.close()

    @strawberry.field
    def myProfile(self, info: Info) -> UserType:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            user = AuthService.get_user_by_id(db, uuid.UUID(user_ctx["id"]))
            if not user:
                raise ValueError("User not found.")
            return UserType.from_model(user)
        finally:
            db.close()

    @strawberry.field
    def myBookings(self, info: Info) -> List[BookingType]:
        user_ctx = info.context.get("user")
        if not user_ctx:
            raise ValueError("Authentication required.")

        db = SessionLocal()
        try:
            bookings = BookingService.get_user_bookings(db, uuid.UUID(user_ctx["id"]))
            return [BookingType.from_model(b) for b in bookings]
        finally:
            db.close()

    @strawberry.field
    def booking(
        self,
        id: Optional[uuid.UUID] = None,
        bookingRef: Optional[str] = None
    ) -> Optional[BookingType]:
        db = SessionLocal()
        try:
            if id:
                b = BookingService.get_booking_by_id(db, id)
            elif bookingRef:
                b = BookingService.get_booking_by_ref(db, bookingRef)
            else:
                return None
            return BookingType.from_model(b) if b else None
        finally:
            db.close()

    @strawberry.field
    def adminStats(self, info: Info) -> AdminStatsType:
        user_ctx = info.context.get("user")
        if not user_ctx or not any(r in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.THEATRE_ADMIN] for r in user_ctx.get("roles", [])):
            raise ValueError("Administrative privileges required.")

        db = SessionLocal()
        try:
            total_users = db.query(User).count()
            total_movies = db.query(Movie).count()
            total_theatres = db.query(Theatre).count()
            total_shows = db.query(Show).count()
            total_bookings = db.query(Booking).count()

            from sqlalchemy import func
            rev_res = db.query(func.sum(Booking.total_amount)).filter(Booking.status == "CONFIRMED").scalar()
            total_revenue = float(rev_res or 0.0)

            return AdminStatsType(
                totalUsers=total_users,
                totalMovies=total_movies,
                totalTheatres=total_theatres,
                totalShows=total_shows,
                totalBookings=total_bookings,
                totalRevenue=total_revenue
            )
        finally:
            db.close()
