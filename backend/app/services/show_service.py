import uuid
from datetime import datetime, timedelta, date, timezone
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.show import Show, ShowSeat, ShowSeatStatus
from app.models.movie import Movie
from app.models.screen import Screen
from app.models.seat import Seat, SeatTierEnum
from app.models.theatre import Theatre


class ShowService:
    @classmethod
    def schedule_show(
        cls,
        db: Session,
        movie_id: uuid.UUID,
        screen_id: uuid.UUID,
        start_time: datetime,
        base_prices: Optional[Dict[str, float]] = None
    ) -> Show:
        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            raise ValueError(f"Movie with id {movie_id} not found.")

        screen = db.query(Screen).filter(Screen.id == screen_id).first()
        if not screen:
            raise ValueError(f"Screen with id {screen_id} not found.")

        # Ensure start_time has timezone awareness
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        # Calculate show end time (duration + 20 mins buffer for intermission & cleaning)
        duration_delta = timedelta(minutes=movie.duration_minutes + 20)
        end_time = start_time + duration_delta

        # Check for scheduling overlap on the same screen
        overlapping_show = db.query(Show).filter(
            Show.screen_id == screen_id,
            Show.is_active == True,
            or_(
                and_(Show.start_time <= start_time, Show.end_time > start_time),
                and_(Show.start_time < end_time, Show.end_time >= end_time),
                and_(Show.start_time >= start_time, Show.end_time <= end_time)
            )
        ).first()

        if overlapping_show:
            raise ValueError(
                f"Show scheduling conflict: Screen is already booked for another show from "
                f"{overlapping_show.start_time.strftime('%Y-%m-%d %H:%M')} to "
                f"{overlapping_show.end_time.strftime('%H:%M')}."
            )

        # Default pricing tiers if not specified
        default_prices = {
            SeatTierEnum.CLASSIC: 200.0,
            SeatTierEnum.PRIME: 320.0,
            SeatTierEnum.RECLINER: 480.0
        }
        prices = base_prices or default_prices

        # Create Show
        show = Show(
            movie_id=movie_id,
            screen_id=screen_id,
            start_time=start_time,
            end_time=end_time,
            base_prices=prices,
            is_active=True
        )
        db.add(show)
        db.flush()

        # Query all physical seats on this screen
        physical_seats = db.query(Seat).filter(Seat.screen_id == screen_id).all()
        if not physical_seats:
            raise ValueError("Cannot schedule show: Screen has no physical seats configured.")

        # Seed show_seats inventory for this show
        for seat in physical_seats:
            tier_price = float(prices.get(seat.tier, 200.0))
            show_seat = ShowSeat(
                show_id=show.id,
                seat_id=seat.id,
                tier=seat.tier,
                price=tier_price,
                status=ShowSeatStatus.AVAILABLE,
                locked_until=None,
                locked_by_user_id=None
            )
            db.add(show_seat)

        db.commit()
        db.refresh(show)
        return show

    @classmethod
    def get_shows(
        cls,
        db: Session,
        movie_id: Optional[uuid.UUID] = None,
        city: Optional[str] = None,
        date_filter: Optional[date] = None,
        theatre_id: Optional[uuid.UUID] = None,
        screen_id: Optional[uuid.UUID] = None
    ) -> List[Show]:
        query = db.query(Show).join(Show.screen).join(Screen.theatre).filter(Show.is_active == True)

        if movie_id:
            query = query.filter(Show.movie_id == movie_id)

        if city:
            query = query.filter(Theatre.city.ilike(city.strip()))

        if theatre_id:
            query = query.filter(Theatre.id == theatre_id)

        if screen_id:
            query = query.filter(Show.screen_id == screen_id)

        if date_filter:
            # Match date of start_time
            now = datetime.now(timezone.utc)
            start_of_day = datetime.combine(date_filter, datetime.min.time(), tzinfo=timezone.utc)
            end_of_day = datetime.combine(date_filter, datetime.max.time(), tzinfo=timezone.utc)
            if date_filter == now.date():
                query = query.filter(Show.start_time > now, Show.start_time <= end_of_day)
            else:
                query = query.filter(Show.start_time >= start_of_day, Show.start_time <= end_of_day)
        else:
            # Future upcoming shows
            now = datetime.now(timezone.utc)
            query = query.filter(Show.start_time > now)

        return query.order_by(Show.start_time).all()

    @classmethod
    def get_show_by_id(cls, db: Session, show_id: uuid.UUID) -> Optional[Show]:
        return db.query(Show).filter(Show.id == show_id).first()

    @classmethod
    def get_show_seats(cls, db: Session, show_id: uuid.UUID) -> List[ShowSeat]:
        now = datetime.now(timezone.utc)

        # First, run eager release of expired locks for this show
        expired_seats = db.query(ShowSeat).filter(
            ShowSeat.show_id == show_id,
            ShowSeat.status == ShowSeatStatus.LOCKED,
            ShowSeat.locked_until < now
        ).all()

        if expired_seats:
            for s in expired_seats:
                s.status = ShowSeatStatus.AVAILABLE
                s.locked_until = None
                s.locked_by_user_id = None
            db.commit()

        return (
            db.query(ShowSeat)
            .join(ShowSeat.seat)
            .filter(ShowSeat.show_id == show_id)
            .order_by(Seat.row, Seat.number)
            .all()
        )
