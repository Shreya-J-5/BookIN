# BookIN — Database Design & Entity Relationship

## 1. Relational Schema Architecture

PostgreSQL is the single primary database. The separation of physical screen layout (`seats`) from show inventory (`show_seats`) is critical to ensure dynamic show scheduling without altering physical layout models.

```
       ┌──────────┐            ┌───────────────┐
       │  users   │◄───────────┤   bookings    │
       └────┬─────┘            └───────┬───────┘
            │                          │
            ▼                          ▼
       ┌──────────┐            ┌───────────────┐
       │ user_roles           │ booking_seats │
       └──────────┘            └───────┬───────┘
                                       │
       ┌──────────┐            ┌───────┴───────┐
       │  movies  ├───────────►│    shows      │
       └──────────┘            └───────┬───────┘
                                       │
       ┌──────────┐            ┌───────┴───────┐
       │ theatres │◄───────────┤  show_seats   │◄───────┐
       └────┬─────┘            └───────┬───────┘        │
            │                          │                │
            ▼                          ▼                │
       ┌──────────┐            ┌───────────────┐ ┌──────┴──────┐
       │ screens  ├───────────►│ reservations  │ │   seats     │
       └──────────┘            └───────────────┘ └─────────────┘
```

## 2. Table Definitions & Constraints

### 2.1 `users`
- `id`: UUID (Primary Key, default uuid_generate_v4())
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `hashed_password`: VARCHAR(255) NOT NULL
- `full_name`: VARCHAR(255) NOT NULL
- `phone`: VARCHAR(20)
- `city`: VARCHAR(100) DEFAULT 'Mumbai'
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### 2.2 `roles` & `user_roles`
- `roles`: `id`, `name` ('CUSTOMER', 'THEATRE_ADMIN', 'ADMIN', 'SUPER_ADMIN')
- `user_roles`: `user_id` FK -> users(id), `role_id` FK -> roles(id). UNIQUE(user_id, role_id).

### 2.3 `movies`
- `id`: UUID Primary Key
- `title`: VARCHAR(255) NOT NULL
- `slug`: VARCHAR(255) UNIQUE NOT NULL
- `description`: TEXT
- `language`: VARCHAR(50) NOT NULL
- `duration_minutes`: INTEGER NOT NULL
- `release_date`: DATE NOT NULL
- `poster_url`: VARCHAR(1024)
- `banner_url`: VARCHAR(1024)
- `trailer_url`: VARCHAR(1024)
- `certification`: VARCHAR(10) (U, UA, A, R)
- `is_active`: BOOLEAN DEFAULT TRUE

### 2.4 `genres` & `movie_genres`
- `genres`: `id`, `name` (Action, Sci-Fi, Drama, Thriller, Comedy, Romance, Horror)
- `movie_genres`: `movie_id`, `genre_id`

### 2.5 `theatres`
- `id`: UUID Primary Key
- `name`: VARCHAR(255) NOT NULL
- `city`: VARCHAR(100) NOT NULL
- `address`: TEXT NOT NULL
- `latitude`: NUMERIC(10, 7)
- `longitude`: NUMERIC(10, 7)
- `amenities`: JSONB DEFAULT '[]'
- `is_active`: BOOLEAN DEFAULT TRUE

### 2.6 `screens`
- `id`: UUID Primary Key
- `theatre_id`: UUID FK -> theatres(id) ON DELETE CASCADE
- `name`: VARCHAR(100) NOT NULL (e.g. "Screen 1 - IMAX")
- `screen_type`: VARCHAR(50) (e.g. "IMAX 3D", "4DX", "Dolby Atmos 2D")
- `total_seats`: INTEGER DEFAULT 0

### 2.7 `seats` (Physical layout)
- `id`: UUID Primary Key
- `screen_id`: UUID FK -> screens(id) ON DELETE CASCADE
- `row`: VARCHAR(5) NOT NULL (e.g. "A", "B", "C")
- `number`: INTEGER NOT NULL (e.g. 1, 2, 3)
- `tier`: VARCHAR(50) NOT NULL (e.g. "CLASSIC", "PRIME", "RECLINER")
- `is_accessible`: BOOLEAN DEFAULT FALSE
- UNIQUE(`screen_id`, `row`, `number`)

### 2.8 `shows`
- `id`: UUID Primary Key
- `movie_id`: UUID FK -> movies(id) ON DELETE RESTRICT
- `screen_id`: UUID FK -> screens(id) ON DELETE RESTRICT
- `start_time`: TIMESTAMP WITH TIME ZONE NOT NULL
- `end_time`: TIMESTAMP WITH TIME ZONE NOT NULL
- `base_prices`: JSONB NOT NULL -- e.g. {"CLASSIC": 250, "PRIME": 350, "RECLINER": 500}
- `is_active`: BOOLEAN DEFAULT TRUE
- INDEX(`screen_id`, `start_time`)

### 2.9 `show_seats` (Show-specific inventory)
- `id`: UUID Primary Key
- `show_id`: UUID FK -> shows(id) ON DELETE CASCADE
- `seat_id`: UUID FK -> seats(id) ON DELETE RESTRICT
- `tier`: VARCHAR(50) NOT NULL
- `price`: NUMERIC(10, 2) NOT NULL
- `status`: VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' -- 'AVAILABLE', 'LOCKED', 'BOOKED'
- `locked_until`: TIMESTAMP WITH TIME ZONE
- `locked_by_user_id`: UUID FK -> users(id)
- UNIQUE(`show_id`, `seat_id`)
- INDEX(`show_id`, `status`)

### 2.10 `reservations` & `reservation_seats`
- `reservations`:
  - `id`: UUID Primary Key
  - `user_id`: UUID FK -> users(id)
  - `show_id`: UUID FK -> shows(id)
  - `expires_at`: TIMESTAMP WITH TIME ZONE NOT NULL
  - `status`: VARCHAR(20) DEFAULT 'PENDING' -- 'PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED'
- `reservation_seats`:
  - `reservation_id`: UUID FK -> reservations(id)
  - `show_seat_id`: UUID FK -> show_seats(id)
  - UNIQUE(`reservation_id`, `show_seat_id`)

### 2.11 `bookings` & `booking_seats`
- `bookings`:
  - `id`: UUID Primary Key
  - `booking_ref`: VARCHAR(20) UNIQUE NOT NULL (e.g. "BIN-7X91D")
  - `user_id`: UUID FK -> users(id)
  - `show_id`: UUID FK -> shows(id)
  - `total_amount`: NUMERIC(10, 2) NOT NULL
  - `discount_amount`: NUMERIC(10, 2) DEFAULT 0.00
  - `convenience_fee`: NUMERIC(10, 2) NOT NULL
  - `tax_amount`: NUMERIC(10, 2) NOT NULL
  - `status`: VARCHAR(20) DEFAULT 'CONFIRMED' -- 'CONFIRMED', 'CANCELLED'
  - `qr_payload`: TEXT
  - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### 2.12 `payments` & `refunds`
- `payments`:
  - `id`: UUID Primary Key
  - `booking_id`: UUID FK -> bookings(id)
  - `reservation_id`: UUID FK -> reservations(id)
  - `user_id`: UUID FK -> users(id)
  - `razorpay_order_id`: VARCHAR(100) UNIQUE
  - `razorpay_payment_id`: VARCHAR(100) UNIQUE
  - `razorpay_signature`: VARCHAR(255)
  - `amount`: NUMERIC(10, 2) NOT NULL
  - `currency`: VARCHAR(10) DEFAULT 'INR'
  - `status`: VARCHAR(20) DEFAULT 'CREATED' -- 'CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
  - `idempotency_key`: VARCHAR(100) UNIQUE
  - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### 2.13 `coupons`, `reviews`, `notifications`
- `coupons`: code, discount_percent, max_discount, min_spend, valid_until, active.
- `reviews`: user_id, movie_id, rating (1-10), comment.
- `notifications`: user_id, title, message, is_read, type, created_at.

