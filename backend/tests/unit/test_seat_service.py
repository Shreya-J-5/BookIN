import pytest
import uuid
from app.services.theatre_service import TheatreService
from app.services.seat_service import SeatService
from app.models.seat import SeatTierEnum


def test_screen_and_seat_layout_creation(db_session):
    theatre = TheatreService.create_theatre(
        db=db_session,
        name=f"Test Cinema {uuid.uuid4().hex[:6]}",
        city="Mumbai",
        address="Test Road, Bandra"
    )

    screen = TheatreService.create_screen(
        db=db_session,
        theatre_id=theatre.id,
        name="Audi 1 - Dolby",
        screen_type="Dolby Atmos 2D"
    )

    seats = SeatService.create_screen_seat_layout(
        db=db_session,
        screen_id=screen.id,
        rows_config=[
            {"row": "A", "seats": 5, "tier": SeatTierEnum.CLASSIC},
            {"row": "B", "seats": 5, "tier": SeatTierEnum.PRIME},
        ]
    )

    assert len(seats) == 10
    assert screen.total_seats == 10

    fetched_seats = SeatService.get_seats_by_screen(db_session, screen.id)
    assert len(fetched_seats) == 10
    row_a = [s for s in fetched_seats if s.row == "A"]
    assert len(row_a) == 5
    assert row_a[0].tier == SeatTierEnum.CLASSIC
