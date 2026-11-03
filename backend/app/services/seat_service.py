import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.seat import Seat, SeatTierEnum
from app.models.screen import Screen


class SeatService:
    @classmethod
    def create_screen_seat_layout(
        cls,
        db: Session,
        screen_id: uuid.UUID,
        rows_config: Optional[List[Dict[str, any]]] = None
    ) -> List[Seat]:
        """
        Creates physical seats for a screen.
        rows_config example:
        [
            {"row": "A", "seats": 10, "tier": "CLASSIC"},
            {"row": "B", "seats": 10, "tier": "CLASSIC"},
            {"row": "C", "seats": 12, "tier": "PRIME"},
            {"row": "D", "seats": 12, "tier": "PRIME"},
            {"row": "E", "seats": 8, "tier": "RECLINER"}
        ]
        """
        screen = db.query(Screen).filter(Screen.id == screen_id).first()
        if not screen:
            raise ValueError(f"Screen with id {screen_id} not found.")

        # If no config provided, generate a standard modern cinema layout
        if not rows_config:
            rows_config = [
                {"row": "A", "seats": 12, "tier": SeatTierEnum.CLASSIC},
                {"row": "B", "seats": 12, "tier": SeatTierEnum.CLASSIC},
                {"row": "C", "seats": 14, "tier": SeatTierEnum.PRIME},
                {"row": "D", "seats": 14, "tier": SeatTierEnum.PRIME},
                {"row": "E", "seats": 14, "tier": SeatTierEnum.PRIME},
                {"row": "F", "seats": 10, "tier": SeatTierEnum.RECLINER},
            ]

        # Remove any existing physical seats for this screen to re-generate
        db.query(Seat).filter(Seat.screen_id == screen_id).delete()

        created_seats = []
        for r_item in rows_config:
            row_char = r_item["row"].upper()
            count = r_item["seats"]
            tier = r_item.get("tier", SeatTierEnum.CLASSIC)

            for num in range(1, count + 1):
                seat = Seat(
                    screen_id=screen_id,
                    row=row_char,
                    number=num,
                    tier=tier,
                    is_accessible=(row_char == "A" and num in [1, 2])
                )
                db.add(seat)
                created_seats.append(seat)

        screen.total_seats = len(created_seats)
        db.commit()
        return created_seats

    @classmethod
    def get_seats_by_screen(cls, db: Session, screen_id: uuid.UUID) -> List[Seat]:
        return db.query(Seat).filter(Seat.screen_id == screen_id).order_by(Seat.row, Seat.number).all()
