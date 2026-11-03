import asyncio
from celery import Celery
from app.core.config import settings
from app.database.connection import SessionLocal
from app.services.booking_service import BookingService
from app.integrations.email import email_service

celery_app = Celery(
    "bookin_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "cleanup-expired-reservations-every-30s": {
            "task": "app.workers.tasks.cleanup_expired_reservations_task",
            "schedule": 30.0,
        },
    }
)


@celery_app.task(name="app.workers.tasks.cleanup_expired_reservations_task")
def cleanup_expired_reservations_task():
    db = SessionLocal()
    try:
        count = BookingService.cleanup_expired_reservations(db)
        if count > 0:
            print(f"[Celery Sweeper] Released {count} expired seat reservations.")
        return count
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.send_ticket_email_task")
def send_ticket_email_task(
    to_email: str,
    user_name: str,
    booking_ref: str,
    movie_title: str,
    theatre_name: str,
    screen_name: str,
    show_time: str,
    seats_str: str,
    total_amount: float
):
    return email_service.send_ticket_confirmation(
        to_email=to_email,
        user_name=user_name,
        booking_ref=booking_ref,
        movie_title=movie_title,
        theatre_name=theatre_name,
        screen_name=screen_name,
        show_time=show_time,
        seats_str=seats_str,
        total_amount=total_amount
    )


async def async_reservation_sweeper():
    """
    Lightweight background sweeper running inside FastAPI event loop.
    Ensures expired reservations are always swept every 30 seconds even without Celery daemon.
    """
    while True:
        try:
            await asyncio.sleep(30)
            db = SessionLocal()
            try:
                count = BookingService.cleanup_expired_reservations(db)
                if count > 0:
                    print(f"[Async Sweeper] Swept {count} expired seat reservations.")
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Async Sweeper Error] {e}")
