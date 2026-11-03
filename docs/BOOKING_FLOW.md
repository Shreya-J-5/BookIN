# BookIN — Seat Reservation & Booking Flow Specification

## 1. Concurrency Model & Double-Booking Prevention

Preventing double bookings under extreme concurrent traffic is the most critical technical requirement of the BookIN platform.

```
       User A (T1)                                 User B (T2)
            │                                           │
            ├─► Request Reserve Seat A1, A2            ├─► Request Reserve Seat A1, A3
            │                                           │
            ▼                                           ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
│  Begin PostgreSQL Transaction T1     │    │  Begin PostgreSQL Transaction T2     │
│                                      │    │                                      │
│  SELECT * FROM show_seats            │    │  SELECT * FROM show_seats            │
│  WHERE show_id = :sid                │    │  WHERE show_id = :sid                │
│    AND seat_id IN (:A1, :A2)         │    │    AND seat_id IN (:A1, :A3)         │
│  FOR UPDATE;                         │    │  FOR UPDATE;                         │
└──────────────────┬───────────────────┘    └──────────────────┬───────────────────┘
                   │                                           │
          Acquires lock on A1, A2                              │
                   │                                  Waits for lock on A1...
                   ▼                                           │
┌──────────────────────────────────────┐                       │
│  Validate Status:                    │                       │
│  A1=AVAILABLE, A2=AVAILABLE          │                       │
│  -> Status -> LOCKED                 │                       │
│  -> locked_until = NOW() + 10m       │                       │
│  -> locked_by_user = User A          │                       │
│  INSERT INTO reservations ...        │                       │
│  COMMIT TRANSACTION T1               │                       │
└──────────────────┬───────────────────┘                       │
                   │                                           │
                   ▼ Releases Lock on A1, A2                   ▼
          Reservation Created (10m)                   T2 Acquires lock on A1
                                                               │
                                                               ▼
                                                    ┌──────────────────────────────────────┐
                                                    │  Validate Status:                    │
                                                    │  A1 is LOCKED (and not expired)      │
                                                    │  ABORT TRANSACTION T2                │
                                                    │  Raise SeatUnavailableException      │
                                                    └──────────────────┬───────────────────┘
                                                                       │
                                                                       ▼
                                                              User B Receives 409 Conflict:
                                                              "Seat A1 is already locked"
```

---

## 2. Reservation Expiration & Hold Release

Every temporary reservation has an explicit lifetime (`10 minutes`).

### 2.1 Eager / Opportunistic Expiration Check
During any reservation attempt, if a seat has `status = 'LOCKED'` but its `locked_until < NOW()`, the database transaction treats the lock as expired, automatically overwrites the lock for the new user, and updates the prior reservation status to `EXPIRED`.

### 2.2 Background Sweeper (Celery / Async Task)
A periodic background task executes every 30 seconds:
```sql
UPDATE show_seats
SET status = 'AVAILABLE', locked_until = NULL, locked_by_user_id = NULL
WHERE status = 'LOCKED' AND locked_until < NOW();

UPDATE reservations
SET status = 'EXPIRED'
WHERE status = 'PENDING' AND expires_at < NOW();
```
Following the sweep, released seat IDs are published to the WebSocket channel `/ws/shows/{show_id}` so customer seat maps instantly update back to green (`AVAILABLE`).

---

## 3. End-to-End Booking Lifecycle

```text
[DISCOVER]
  Customer selects City -> Movie -> Date -> Showtime
      │
[SELECT SEATS]
  Customer opens dynamic seat map (VIP Recliner / Prime / Classic)
  Selects seats (e.g. A1, A2)
      │
[RESERVE]
  Client calls mutation: reserveSeats(showId, seatIds)
  PostgreSQL executes row-level locking transaction.
  Seats turn LOCKED (amber) across all connected WebSocket clients.
  10-minute countdown starts on customer checkout screen.
      │
[CHECKOUT]
  Client calls mutation: createPaymentOrder(reservationId, couponCode)
  System computes ticket breakdown:
    Base Amount + Convenience Fee (₹30) + 18% GST - Coupon Discount
  Initializes Razorpay order.
      │
[PAYMENT GATEWAY]
  Customer completes payment via Razorpay checkout modal (UPI / Card / NetBanking).
      │
[CONFIRMATION]
  Client sends Razorpay payment verification payload:
    - razorpay_order_id
    - razorpay_payment_id
    - razorpay_signature
  Backend cryptographically validates HMAC SHA256 signature.
  Atomic database transaction:
    1. Validates reservation is still active.
    2. Marks show_seats as 'BOOKED'.
    3. Creates Booking record with unique reference (e.g. BIN-K829Z).
    4. Marks Reservation as 'COMPLETED' and Payment as 'SUCCESS'.
    5. Commits transaction.
      │
[DISPATCH & TICKETING]
  Background worker generates digital ticket QR code and sends confirmation email.
  WebSocket broadcasts 'BOOKED' status to all users.
  Customer receives instant confirmed e-ticket on screen.
```
