# BookIN — Low-Level Design (LLD)

## 1. Class & Service Responsibilities

### 1.1 AuthService
- `register(user_data)`: Validates unique email, hashes password with bcrypt/argon2, assigns default `CUSTOMER` role.
- `authenticate(email, password)`: Verifies credentials, returns access & refresh tokens.
- `verify_token(token)`: Validates JWT signature, expiration, and extracts claims (`sub`, `roles`).

### 1.2 Seat & Show Management Service
- `create_physical_layout(screen_id, rows, cols, tiers)`: Populates physical `Seat` records with tier metadata (`CLASSIC`, `PRIME`, `RECLINER`).
- `schedule_show(movie_id, screen_id, start_time, base_prices)`:
  - Verifies screen availability (no overlapping shows with 30 min cleaning buffer).
  - Automatically seeds `ShowSeat` inventory rows for each physical seat on that screen with `status=AVAILABLE`.

### 1.3 Concurrency & Reservation Engine (`SeatReservationService`)
- `reserve_seats(show_id, seat_ids, user_id, duration_minutes=10)`:
  1. Open explicit database transaction.
  2. Query target `ShowSeat` rows using `SELECT * FROM show_seats WHERE show_id = :show_id AND seat_id IN (:seat_ids) FOR UPDATE`.
  3. Validate:
     - All requested `seat_ids` exist in this show.
     - Seat status is `AVAILABLE` OR (`LOCKED` and `locked_until < NOW()`).
     - None are `BOOKED`.
  4. If any seat is taken or actively locked, abort transaction and raise `SeatUnavailableException`.
  5. Compute `expires_at = NOW() + duration`.
  6. Create `Reservation` record with status `PENDING`.
  7. Update `ShowSeat`:
     - `status = LOCKED`
     - `locked_until = expires_at`
     - `locked_by_user_id = user_id`
  8. Commit transaction.
  9. Broadcast `seat_locked` event via WebSocket to room `show_{show_id}`.
  10. Return reservation details with countdown timer.

### 1.4 Booking & Payment Service
- `create_payment_order(reservation_id, user_id)`:
  - Validates reservation is active and belongs to user.
  - Calculates subtotal, convenience fee, GST, coupon discount.
  - Creates or retrieves Razorpay Order (`rzp_order_...`).
  - Records `Payment` record with status `PENDING`.
- `verify_and_confirm_booking(reservation_id, razorpay_order_id, razorpay_payment_id, razorpay_signature)`:
  - Verifies HMAC SHA256 signature using `RAZORPAY_KEY_SECRET`.
  - Begins database transaction.
  - Locks `Reservation` and associated `ShowSeat` records (`FOR UPDATE`).
  - Verifies reservation has not expired.
  - Creates `Booking` record with a unique human-friendly booking reference (e.g. `BIN-8F29A`).
  - Sets `ShowSeat.status = BOOKED`.
  - Sets `Reservation.status = COMPLETED`.
  - Sets `Payment.status = SUCCESS`.
  - Commits transaction.
  - Triggers background Celery task to send confirmation email / digital ticket.
  - Broadcasts `seat_booked` event via WebSocket.

### 1.5 Reservation Expiry Worker
- Periodic background job running every 30 seconds:
  - Finds all reservations where `status = PENDING` and `expires_at < NOW()`.
  - Inside a transaction, updates `ShowSeat` rows back to `AVAILABLE`, sets `Reservation.status = EXPIRED`.
  - Broadcasts `seat_released` event via WebSocket.

