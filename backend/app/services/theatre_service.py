import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from app.models.theatre import Theatre
from app.models.screen import Screen


class TheatreService:
    @classmethod
    def get_cities(cls, db: Session) -> List[str]:
        results = db.query(distinct(Theatre.city)).filter(Theatre.is_active == True).order_by(Theatre.city).all()
        return [r[0] for r in results if r[0]]

    @classmethod
    def get_theatres(
        cls,
        db: Session,
        city: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Theatre]:
        query = db.query(Theatre).filter(Theatre.is_active == True)

        if city:
            query = query.filter(Theatre.city.ilike(city.strip()))

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(Theatre.name.ilike(search_term))

        return query.order_by(Theatre.name).offset(offset).limit(limit).all()

    @classmethod
    def get_theatre_by_id(cls, db: Session, theatre_id: uuid.UUID) -> Optional[Theatre]:
        return db.query(Theatre).filter(Theatre.id == theatre_id).first()

    @classmethod
    def create_theatre(
        cls,
        db: Session,
        name: str,
        city: str,
        address: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        amenities: Optional[list] = None
    ) -> Theatre:
        theatre = Theatre(
            name=name.strip(),
            city=city.strip(),
            address=address.strip(),
            latitude=latitude,
            longitude=longitude,
            amenities=amenities or ["Parking", "Food Court", "Dolby Atmos", "Recliner Seats"],
            is_active=True
        )
        db.add(theatre)
        db.commit()
        db.refresh(theatre)
        return theatre

    @classmethod
    def update_theatre(
        cls,
        db: Session,
        theatre_id: uuid.UUID,
        name: Optional[str] = None,
        city: Optional[str] = None,
        address: Optional[str] = None,
        amenities: Optional[list] = None,
        is_active: Optional[bool] = None
    ) -> Theatre:
        theatre = db.query(Theatre).filter(Theatre.id == theatre_id).first()
        if not theatre:
            raise ValueError(f"Theatre with id {theatre_id} not found.")

        if name is not None:
            theatre.name = name.strip()
        if city is not None:
            theatre.city = city.strip()
        if address is not None:
            theatre.address = address.strip()
        if amenities is not None:
            theatre.amenities = amenities
        if is_active is not None:
            theatre.is_active = is_active

        db.commit()
        db.refresh(theatre)
        return theatre

    @classmethod
    def create_screen(
        cls,
        db: Session,
        theatre_id: uuid.UUID,
        name: str,
        screen_type: str = "Dolby Atmos 2D"
    ) -> Screen:
        theatre = db.query(Theatre).filter(Theatre.id == theatre_id).first()
        if not theatre:
            raise ValueError(f"Theatre with id {theatre_id} not found.")

        screen = Screen(
            theatre_id=theatre_id,
            name=name.strip(),
            screen_type=screen_type.strip(),
            total_seats=0
        )
        db.add(screen)
        db.commit()
        db.refresh(screen)
        return screen

    @classmethod
    def get_screen_by_id(cls, db: Session, screen_id: uuid.UUID) -> Optional[Screen]:
        return db.query(Screen).filter(Screen.id == screen_id).first()
