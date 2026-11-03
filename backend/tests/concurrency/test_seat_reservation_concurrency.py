import pytest
import concurrent.futures
import uuid
from app.database.connection import SessionLocal
from app.services.booking_service import BookingService
from app.services.auth_service import AuthService
from app.models.show import Show, ShowSeat, ShowSeatStatus


def test_concurrent_seat_reservation_prevents_double_booking():
    # Setup test show and target seat
    db = SessionLocal()
    try:
        show = db.query(Show).filter(Show.is_active == True).first()
        assert show is not None, "Test show must exist from seed."

        # Find an available seat in this show
        available_show_seat = db.query(ShowSeat).filter(
            ShowSeat.show_id == show.id,
            ShowSeat.status == ShowSeatStatus.AVAILABLE
        ).first()
        assert available_show_seat is not None, "At least one seat must be available for testing."

        target_seat_id = available_show_seat.seat_id
        show_id = show.id

        # Create two distinct test users
        user1, _, _ = AuthService.register_user(
            db, f"concurrent1_{uuid.uuid4().hex[:6]}@test.com", "Pass123!", "User 1"
        )
        user2, _, _ = AuthService.register_user(
            db, f"concurrent2_{uuid.uuid4().hex[:6]}@test.com", "Pass123!", "User 2"
        )
        user1_id = user1.id
        user2_id = user2.id
    finally:
        db.close()

    def attempt_reservation(user_id):
        thread_db = SessionLocal()
        try:
            res = BookingService.reserve_seats(
                db=thread_db,
                show_id=show_id,
                seat_ids=[target_seat_id],
                user_id=user_id,
                duration_minutes=5
            )
            return {"success": True, "reservation_id": res.id, "error": None}
        except Exception as e:
            return {"success": False, "reservation_id": None, "error": str(e)}
        finally:
            thread_db.close()

    # Simulate simultaneous reservation requests using ThreadPoolExecutor
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_reservation, user1_id)
        f2 = executor.submit(attempt_reservation, user2_id)
        results = [f1.result(), f2.result()]

    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]

    # Assert strict concurrency control:
    # Exactly one user must succeed, and the other must be rejected
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}: {results}"
    assert len(failures) == 1, f"Expected exactly 1 failure, got {len(failures)}: {results}"
    assert "reserved by another" in failures[0]["error"] or "already" in failures[0]["error"]

    # Verify database state
    verify_db = SessionLocal()
    try:
        ss = verify_db.query(ShowSeat).filter(
            ShowSeat.show_id == show_id,
            ShowSeat.seat_id == target_seat_id
        ).first()
        assert ss.status == ShowSeatStatus.LOCKED
        # Must be locked by the successful user
        assert ss.locked_by_user_id in [user1_id, user2_id]
    finally:
        verify_db.close()
