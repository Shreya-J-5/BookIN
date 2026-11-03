from datetime import date, datetime, timedelta, timezone
import uuid
from app.database.connection import SessionLocal
from app.models.user import User, Role, UserRole
from app.models.movie import Movie, Genre, MovieGenre
from app.models.theatre import Theatre
from app.models.screen import Screen
from app.models.seat import Seat, SeatTierEnum
from app.models.show import Show, ShowSeat, ShowSeatStatus
from app.models.booking import Coupon
from app.core.security import hash_password
from app.core.permissions import RoleEnum
from app.services.seat_service import SeatService
from app.services.show_service import ShowService


def seed_database():
    db = SessionLocal()
    try:
        print("[BookIN Seed] Initializing roles...")
        roles = {}
        for role_name in [RoleEnum.CUSTOMER, RoleEnum.THEATRE_ADMIN, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
            roles[role_name] = role

        print("[BookIN Seed] Initializing administrative users...")
        superadmin = db.query(User).filter(User.email == "admin@bookin.com").first()
        if not superadmin:
            superadmin = User(
                email="admin@bookin.com",
                hashed_password=hash_password("Admin@BookIN2026!"),
                full_name="BookIN Super Administrator",
                phone="9876543210",
                city="Mumbai",
                is_active=True
            )
            db.add(superadmin)
            db.flush()
            db.add(UserRole(user_id=superadmin.id, role_id=roles[RoleEnum.SUPER_ADMIN].id))
            db.add(UserRole(user_id=superadmin.id, role_id=roles[RoleEnum.ADMIN].id))

        demo_customer = db.query(User).filter(User.email == "customer@bookin.com").first()
        if not demo_customer:
            demo_customer = User(
                email="customer@bookin.com",
                hashed_password=hash_password("Customer@123"),
                full_name="Rahul Sharma",
                phone="9123456789",
                city="Mumbai",
                is_active=True
            )
            db.add(demo_customer)
            db.flush()
            db.add(UserRole(user_id=demo_customer.id, role_id=roles[RoleEnum.CUSTOMER].id))

        theatre_admin = db.query(User).filter(User.email == "theatre@bookin.com").first()
        if not theatre_admin:
            theatre_admin = User(
                email="theatre@bookin.com",
                hashed_password=hash_password("Theatre@123"),
                full_name="PVR Cinemas Manager",
                phone="9988776655",
                city="Mumbai",
                is_active=True
            )
            db.add(theatre_admin)
            db.flush()
            db.add(UserRole(user_id=theatre_admin.id, role_id=roles[RoleEnum.THEATRE_ADMIN].id))

        print("[BookIN Seed] Initializing genres...")
        genres = {}
        for g_name in ["Action", "Sci-Fi", "Drama", "Thriller", "Adventure", "Comedy", "Romance", "IMAX"]:
            genre = db.query(Genre).filter(Genre.name == g_name).first()
            if not genre:
                genre = Genre(name=g_name)
                db.add(genre)
                db.flush()
            genres[g_name] = genre

        print("[BookIN Seed] Initializing movies...")
        movie_data = [
            {
                "title": "Dune: Part Two",
                "slug": "dune-part-two",
                "description": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                "language": "English",
                "duration_minutes": 166,
                "release_date": date(2024, 3, 1),
                "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
                "banner_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
                "trailer_url": "https://www.youtube.com/watch?v=Way9Dexny3w",
                "certification": "UA",
                "genres": ["Action", "Sci-Fi", "Adventure"]
            },
            {
                "title": "Oppenheimer",
                "slug": "oppenheimer",
                "description": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
                "language": "English",
                "duration_minutes": 180,
                "release_date": date(2023, 7, 21),
                "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
                "banner_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
                "trailer_url": "https://www.youtube.com/watch?v=uYPbbksJxIg",
                "certification": "A",
                "genres": ["Drama", "Thriller"]
            },
            {
                "title": "Kalki 2898 AD",
                "slug": "kalki-2898-ad",
                "description": "A modern avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces.",
                "language": "Hindi",
                "duration_minutes": 181,
                "release_date": date(2024, 6, 27),
                "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
                "banner_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
                "trailer_url": "https://www.youtube.com/watch?v=kQDd1AhGIHk",
                "certification": "UA",
                "genres": ["Action", "Sci-Fi"]
            },
            {
                "title": "Interstellar (Special Re-Release)",
                "slug": "interstellar-re-release",
                "description": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers.",
                "language": "English",
                "duration_minutes": 169,
                "release_date": date(2024, 10, 1),
                "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
                "banner_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
                "trailer_url": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
                "certification": "UA",
                "genres": ["Sci-Fi", "Drama", "Adventure"]
            }
        ]

        seeded_movies = []
        for m_item in movie_data:
            movie = db.query(Movie).filter(Movie.slug == m_item["slug"]).first()
            if not movie:
                movie = Movie(
                    title=m_item["title"],
                    slug=m_item["slug"],
                    description=m_item["description"],
                    language=m_item["language"],
                    duration_minutes=m_item["duration_minutes"],
                    release_date=m_item["release_date"],
                    poster_url=m_item["poster_url"],
                    banner_url=m_item["banner_url"],
                    trailer_url=m_item["trailer_url"],
                    certification=m_item["certification"],
                    is_active=True
                )
                db.add(movie)
                db.flush()
                for g in m_item["genres"]:
                    if g in genres:
                        db.add(MovieGenre(movie_id=movie.id, genre_id=genres[g].id))
            seeded_movies.append(movie)

        print("[BookIN Seed] Initializing theatres and screens...")
        theatres_data = [
            {
                "name": "PVR INOX: Phoenix Palladium",
                "city": "Mumbai",
                "address": "462, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013",
                "screens": ["IMAX Laser 3D", "Screen 2 - Dolby Atmos", "Screen 3 - Luxe"]
            },
            {
                "name": "Cinépolis: Viviana Mall",
                "city": "Mumbai",
                "address": "Eastern Express Hwy, Near Jupiter Hospital, Thane West, Mumbai 400606",
                "screens": ["4DX Screen", "Macro XE Atmos"]
            },
            {
                "name": "PVR: Directors Cut, Vasant Kunj",
                "city": "Delhi-NCR",
                "address": "Ambience Mall, Nelson Mandela Marg, Vasant Kunj, New Delhi 110070",
                "screens": ["Auditorium 1", "Auditorium 2"]
            },
            {
                "name": "PVR: Forum Mall, Koramangala",
                "city": "Bengaluru",
                "address": "Hosur Rd, Koramangala, Bengaluru, Karnataka 560095",
                "screens": ["IMAX 3D", "Screen 1"]
            }
        ]

        now = datetime.now(timezone.utc)

        for t_item in theatres_data:
            theatre = db.query(Theatre).filter(Theatre.name == t_item["name"]).first()
            if not theatre:
                theatre = Theatre(
                    name=t_item["name"],
                    city=t_item["city"],
                    address=t_item["address"],
                    amenities=["Dolby Atmos", "Recliner Seats", "Valet Parking", "Gourmet Food", "Wheelchair Access"],
                    is_active=True
                )
                db.add(theatre)
                db.flush()

                for s_name in t_item["screens"]:
                    screen = Screen(
                        theatre_id=theatre.id,
                        name=s_name,
                        screen_type="IMAX 3D" if "IMAX" in s_name else "Dolby Atmos 2D",
                        total_seats=0
                    )
                    db.add(screen)
                    db.flush()

                    # Generate seat layout
                    SeatService.create_screen_seat_layout(db, screen.id)

                    # Schedule upcoming shows with non-overlapping slots
                    show_slots = [
                        (10, 0),
                        (14, 30),
                        (19, 0),
                    ]
                    # Assign a movie to this screen based on screen name / index
                    chosen_movie = seeded_movies[hash(s_name) % len(seeded_movies)]

                    for day_offset in [0, 1, 2]:
                        for hr, mn in show_slots:
                            show_time = (now + timedelta(days=day_offset)).replace(
                                hour=hr, minute=mn, second=0, microsecond=0
                            )
                            existing_show = db.query(Show).filter(
                                Show.screen_id == screen.id,
                                Show.start_time == show_time
                            ).first()
                            if not existing_show:
                                ShowService.schedule_show(
                                    db=db,
                                    movie_id=chosen_movie.id,
                                    screen_id=screen.id,
                                    start_time=show_time,
                                    base_prices={
                                        SeatTierEnum.CLASSIC: 250.0,
                                        SeatTierEnum.PRIME: 380.0,
                                        SeatTierEnum.RECLINER: 550.0
                                    }
                                )

        print("[BookIN Seed] Initializing coupons...")
        coupons_data = [
            {"code": "WELCOME100", "percent": 20, "max": 100.0, "min": 300.0},
            {"code": "BOOKIN50", "percent": 15, "max": 50.0, "min": 250.0},
            {"code": "CINEMA2026", "percent": 25, "max": 150.0, "min": 500.0},
        ]
        for c in coupons_data:
            existing = db.query(Coupon).filter(Coupon.code == c["code"]).first()
            if not existing:
                coupon = Coupon(
                    code=c["code"],
                    discount_percent=c["percent"],
                    max_discount=c["max"],
                    min_spend=c["min"],
                    valid_until=now + timedelta(days=90),
                    is_active=True
                )
                db.add(coupon)

        db.commit()
        print("[BookIN Seed] Seed database completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[BookIN Seed] Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
