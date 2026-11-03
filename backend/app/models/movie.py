import uuid
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Text, Date, Boolean, DateTime, ForeignKey, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, utc_now


class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    movies: Mapped[List["Movie"]] = relationship(
        "Movie",
        secondary="movie_genres",
        back_populates="genres"
    )

    def __repr__(self):
        return f"<Genre {self.name}>"


class MovieGenre(Base):
    __tablename__ = "movie_genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    movie_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    genre_id: Mapped[int] = mapped_column(Integer, ForeignKey("genres.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("movie_id", "genre_id", name="uq_movie_genres_movie_genre"),
    )


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    release_date: Mapped[date] = mapped_column(Date, nullable=False)
    poster_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    trailer_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    certification: Mapped[str] = mapped_column(String(10), default="UA", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    genres: Mapped[List[Genre]] = relationship(
        Genre,
        secondary="movie_genres",
        back_populates="movies",
        lazy="selectin"
    )
    shows: Mapped[List["Show"]] = relationship("Show", back_populates="movie", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="movie", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Movie {self.title}>"
