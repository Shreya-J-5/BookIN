import uuid
import re
from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.movie import Movie, Genre, MovieGenre
from app.models.booking import Review
from app.models.show import Show
from app.models.screen import Screen
from app.models.theatre import Theatre


def generate_slug(title: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9\s-]', '', title).strip().lower()
    return re.sub(r'[\s-]+', '-', cleaned)


class MovieService:
    @staticmethod
    def get_genres(db: Session) -> List[Genre]:
        return db.query(Genre).order_by(Genre.name).all()

    @staticmethod
    def get_or_create_genre(db: Session, name: str) -> Genre:
        name_clean = name.strip()
        genre = db.query(Genre).filter(Genre.name.ilike(name_clean)).first()
        if not genre:
            genre = Genre(name=name_clean)
            db.add(genre)
            db.commit()
            db.refresh(genre)
        return genre

    @classmethod
    def get_movies(
        cls,
        db: Session,
        city: Optional[str] = None,
        genre: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Movie]:
        query = db.query(Movie).filter(Movie.is_active == True)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Movie.title.ilike(search_term),
                    Movie.description.ilike(search_term)
                )
            )

        if language:
            query = query.filter(Movie.language.ilike(language.strip()))

        if genre:
            query = query.join(Movie.genres).filter(Genre.name.ilike(genre.strip()))

        if city:
            # Filter movies that have shows scheduled in theatres located in that city
            query = (
                query.join(Movie.shows)
                .join(Show.screen)
                .join(Screen.theatre)
                .filter(Theatre.city.ilike(city.strip()), Show.is_active == True)
                .distinct()
            )

        return query.order_by(desc(Movie.release_date)).offset(offset).limit(limit).all()

    @classmethod
    def get_movie_by_id(cls, db: Session, movie_id: uuid.UUID) -> Optional[Movie]:
        return db.query(Movie).filter(Movie.id == movie_id).first()

    @classmethod
    def get_movie_by_slug(cls, db: Session, slug: str) -> Optional[Movie]:
        return db.query(Movie).filter(Movie.slug == slug).first()

    @classmethod
    def create_movie(
        cls,
        db: Session,
        title: str,
        language: str,
        duration_minutes: int,
        release_date: date,
        description: Optional[str] = None,
        slug: Optional[str] = None,
        poster_url: Optional[str] = None,
        banner_url: Optional[str] = None,
        trailer_url: Optional[str] = None,
        certification: str = "UA",
        genre_names: Optional[List[str]] = None
    ) -> Movie:
        if not slug:
            slug = generate_slug(title)

        existing = db.query(Movie).filter(Movie.slug == slug).first()
        if existing:
            # Append random hex to make unique
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        movie = Movie(
            title=title.strip(),
            slug=slug,
            description=description.strip() if description else None,
            language=language.strip(),
            duration_minutes=duration_minutes,
            release_date=release_date,
            poster_url=poster_url,
            banner_url=banner_url,
            trailer_url=trailer_url,
            certification=certification.strip().upper(),
            is_active=True
        )
        db.add(movie)
        db.flush()

        if genre_names:
            for g_name in genre_names:
                genre = cls.get_or_create_genre(db, g_name)
                movie_genre = MovieGenre(movie_id=movie.id, genre_id=genre.id)
                db.add(movie_genre)

        db.commit()
        db.refresh(movie)
        return movie

    @classmethod
    def update_movie(
        cls,
        db: Session,
        movie_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        language: Optional[str] = None,
        duration_minutes: Optional[int] = None,
        poster_url: Optional[str] = None,
        banner_url: Optional[str] = None,
        trailer_url: Optional[str] = None,
        certification: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Movie:
        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            raise ValueError(f"Movie with id {movie_id} not found.")

        if title is not None:
            movie.title = title.strip()
        if description is not None:
            movie.description = description.strip()
        if language is not None:
            movie.language = language.strip()
        if duration_minutes is not None:
            movie.duration_minutes = duration_minutes
        if poster_url is not None:
            movie.poster_url = poster_url
        if banner_url is not None:
            movie.banner_url = banner_url
        if trailer_url is not None:
            movie.trailer_url = trailer_url
        if certification is not None:
            movie.certification = certification.strip().upper()
        if is_active is not None:
            movie.is_active = is_active

        db.commit()
        db.refresh(movie)
        return movie

    @classmethod
    def add_review(
        cls,
        db: Session,
        user_id: uuid.UUID,
        movie_id: uuid.UUID,
        rating: int,
        comment: Optional[str] = None
    ) -> Review:
        if rating < 1 or rating > 10:
            raise ValueError("Rating must be between 1 and 10.")

        review = Review(
            user_id=user_id,
            movie_id=movie_id,
            rating=rating,
            comment=comment.strip() if comment else None
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
