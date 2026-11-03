# BookIN — GraphQL & REST API Documentation

The BookIN platform uses **Strawberry GraphQL** as its primary client-facing API endpoint (`/graphql`), alongside specialized REST endpoints for webhooks (`/api/webhooks/razorpay`) and health probes (`/health`).

---

## 1. Endpoints

| Protocol | Path | Description | Authentication |
|---|---|---|---|
| GraphQL | `/graphql` | Primary API (Queries & Mutations) | Optional / Bearer Token Header |
| WebSocket | `/ws/shows/{show_id}` | Real-time seat availability broadcast | None (Public room per show) |
| REST | `/api/webhooks/razorpay` | Razorpay payment webhook listener | HMAC Signature in Header |
| REST | `/health` | Liveness & Readiness probe | Public |

---

## 2. Authentication

Requests requiring authentication must provide the JWT in the standard `Authorization` header:

```http
Authorization: Bearer <jwt_access_token>
```

Tokens contain claims: `sub` (User ID), `email`, `roles` (`CUSTOMER`, `THEATRE_ADMIN`, `ADMIN`, `SUPER_ADMIN`), and `exp`.

---

## 3. Core GraphQL Queries

### 3.1 `movies`
Fetch all active movies with optional search, genre, and language filtering.
```graphql
query GetMovies($city: String, $genre: String, $language: String, $search: String) {
  movies(city: $city, genre: $genre, language: $language, search: $search) {
    id
    title
    slug
    description
    language
    durationMinutes
    releaseDate
    posterUrl
    bannerUrl
    trailerUrl
    certification
    genres {
      id
      name
    }
  }
}
```

### 3.2 `movie`
Fetch full movie details by ID or slug.
```graphql
query GetMovieDetails($id: UUID, $slug: String) {
  movie(id: $id, slug: $slug) {
    id
    title
    slug
    description
    language
    durationMinutes
    certification
    posterUrl
    bannerUrl
    trailerUrl
    genres {
      name
    }
    reviews {
      id
      user {
        fullName
      }
      rating
      comment
      createdAt
    }
  }
}
```

### 3.3 `theatres`
Fetch theatres in a given city with their screens and active shows.
```graphql
query GetTheatres($city: String!) {
  theatres(city: $city) {
    id
    name
    city
    address
    amenities
    screens {
      id
      name
      screenType
      totalSeats
    }
  }
}
```

### 3.4 `shows`
Fetch scheduled shows for a movie in a specific city on a given date.
```graphql
query GetShows($movieId: UUID!, $city: String!, $date: Date) {
  shows(movieId: $movieId, city: $city, date: $date) {
    id
    startTime
    endTime
    basePrices
    screen {
      id
      name
      screenType
      theatre {
        id
        name
        address
      }
    }
  }
}
```

### 3.5 `showSeats`
Fetch real-time seat inventory for a specific show.
```graphql
query GetShowSeats($showId: UUID!) {
  showSeats(showId: $showId) {
    id
    seatId
    row
    number
    tier
    price
    status       # "AVAILABLE", "LOCKED", "BOOKED"
    isAccessible
  }
}
```

### 3.6 `myBookings`
Fetch the current authenticated user's ticket history.
```graphql
query GetMyBookings {
  myBookings {
    id
    bookingRef
    totalAmount
    discountAmount
    convenienceFee
    taxAmount
    status
    qrPayload
    createdAt
    show {
      startTime
      movie {
        title
        posterUrl
      }
      screen {
        name
        theatre {
          name
          address
        }
      }
    }
    seats {
      row
      number
      tier
      price
    }
  }
}
```

---

## 4. Core GraphQL Mutations

### 4.1 `register`
```graphql
mutation RegisterUser($input: RegisterInput!) {
  register(input: $input) {
    user {
      id
      email
      fullName
      roles
    }
    accessToken
    refreshToken
  }
}
```

### 4.2 `login`
```graphql
mutation LoginUser($input: LoginInput!) {
  login(input: $input) {
    user {
      id
      email
      fullName
      roles
    }
    accessToken
    refreshToken
  }
}
```

### 4.3 `reserveSeats`
Atomically locks seats for 10 minutes using PostgreSQL row-level locks.
```graphql
mutation ReserveSeats($showId: UUID!, $seatIds: [UUID!]!) {
  reserveSeats(showId: $showId, seatIds: $seatIds) {
    reservationId
    expiresAt
    status
    reservedSeatsCount
    totalPrice
  }
}
```

### 4.4 `createPaymentOrder`
Initializes Razorpay order and links to reservation.
```graphql
mutation CreatePaymentOrder($reservationId: UUID!, $couponCode: String) {
  createPaymentOrder(reservationId: $reservationId, couponCode: $couponCode) {
    paymentId
    orderId
    amount
    currency
    keyId
  }
}
```

### 4.5 `verifyPaymentAndBook`
Verifies Razorpay HMAC signature, converts seats to `BOOKED`, and issues confirmed digital ticket.
```graphql
mutation VerifyPaymentAndBook($input: PaymentConfirmationInput!) {
  verifyPaymentAndBook(input: $input) {
    bookingId
    bookingRef
    status
    qrPayload
  }
}
```

### 4.6 `cancelBooking`
Cancels confirmed booking and triggers refund if eligible according to cancellation policy.
```graphql
mutation CancelBooking($bookingId: UUID!) {
  cancelBooking(bookingId: $bookingId) {
    success
    message
    refundAmount
  }
}
```
