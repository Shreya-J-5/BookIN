# 🎬 BookIN — Movie Ticket Booking Platform

A production-oriented movie ticket booking platform inspired by BookMyShow, designed to provide a seamless experience for discovering movies, exploring theatres, selecting seats, booking tickets, and processing payments.

The platform is built using a **GraphQL-based API architecture** with PostgreSQL as its single primary database. It focuses on data consistency, secure transactions, concurrent seat reservations, scalability, and reliability.

---

## 1. Project Overview

### 1.1 Objective

The objective of CineBook is to develop a full-featured movie ticket booking application that allows customers to:

- Discover currently running and upcoming movies.
- Browse movies by city, language, genre, and category.
- Find nearby theatres and available showtimes.
- View theatre layouts and select seats interactively.
- Reserve seats temporarily during checkout.
- Make secure online payments.
- Receive booking confirmations and digital tickets.
- View booking history and manage cancellations.

The platform also provides administrative functionality for managing movies, theatres, screens, show schedules, pricing, and bookings.

### 1.2 Project Goals

1. Build a scalable movie ticket booking application.
2. Implement GraphQL for frontend-backend communication.
3. Use a single PostgreSQL database for persistent application data.
4. Prevent duplicate seat bookings during concurrent transactions.
5. Integrate secure payment processing.
6. Implement role-based access control.
7. Maintain booking and payment consistency.
8. Design an architecture that can scale as user traffic increases.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Programming Language (Frontend) | JavaScript / TypeScript |
| Backend | Python |
| Backend Framework | FastAPI |
| API Architecture | GraphQL |
| GraphQL Library | Strawberry GraphQL |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| Authentication | JWT + Refresh Tokens |
| Password Security | Argon2 / bcrypt |
| Payment Gateway | Razorpay |
| Real-time Communication | WebSockets |
| Caching | Redis |
| Background Processing | Celery |
| Task Broker | Redis |
| Containerization | Docker |
| Reverse Proxy | Nginx |
| Version Control | Git & GitHub |
| Deployment | AWS |

**Database strategy:** PostgreSQL is the single source of truth for all persistent application data. Redis is an optional supporting infrastructure component for caching, temporary coordination, and background task delivery. It does not replace PostgreSQL or maintain a separate permanent application database.

---

# 3. Functional Requirements

## 3.1 Customer Module

- User registration and login.
- User profile management.
- City selection.
- Movie discovery.
- Movie search and filtering.
- Movie details and trailers.
- Theatre discovery.
- Showtime selection.
- Interactive seat selection.
- Temporary seat reservation.
- Online payment.
- Booking confirmation.
- Digital ticket generation.
- Booking history.
- Booking cancellation according to applicable policies.
- Ratings and reviews.
- Notifications.

## 3.2 Admin Module

- Admin authentication.
- Dashboard and booking analytics.
- User management.
- Movie management.
- Genre management.
- Theatre management.
- Screen management.
- Seat layout configuration.
- Show scheduling.
- Ticket price management.
- Coupon and offer management.
- Booking monitoring.
- Payment monitoring.
- Reports and analytics.

## 3.3 Theatre Management Module

- Theatre registration.
- Theatre profile management.
- Screen management.
- Seat configuration.
- Show scheduling.
- Show availability management.
- Ticket pricing.
- Booking reports.

## 3.4 Payment Module

- Razorpay integration.
- Payment order creation.
- Payment verification.
- Webhook handling.
- Payment status tracking.
- Failed payment handling.
- Refund processing.
- Duplicate payment prevention.
- Payment reconciliation.

---

# 4. Non-Functional Requirements

The application must be designed around the following quality attributes.

| Requirement | Description |
|---|---|
| Scalability | Support increasing traffic and concurrent users. |
| Availability | Minimize downtime through redundant application instances. |
| Reliability | Maintain consistent booking and payment records. |
| Security | Protect customer information and transactions. |
| Performance | Optimize API responses and database queries. |
| Consistency | Prevent conflicting seat reservations. |
| Maintainability | Use modular backend architecture. |
| Recoverability | Support database backup and recovery. |
| Observability | Monitor application errors, latency and infrastructure. |

The exact concurrent-user target, response-time objectives, and availability SLA will be finalized through capacity planning and load testing.

---

# 5. High-Level System Design (HLD)

## 5.1 System Architecture

The application follows a modular monolithic architecture.

The backend is organized into independent functional modules, but initially runs as one deployable application.

```text
                  ┌──────────────────────┐
                  │    React Frontend    │
                  │                      │
                  │  Customer Interface  │
                  │  Admin Dashboard     │
                  │  Theatre Dashboard   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      NGINX           │
                  │   Reverse Proxy      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │     GraphQL API      │
                  │                      │
                  │  Strawberry GraphQL  │
                  │  Authentication      │
                  │  Authorization       │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    FastAPI Backend   │
                  │                      │
                  │  User Module         │
                  │  Movie Module        │
                  │  Theatre Module      │
                  │  Show Module         │
                  │  Seat Module         │
                  │  Booking Module      │
                  │  Payment Module      │
                  │  Notification Module │
                  └──────────┬───────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │ PostgreSQL │ │   Redis    │ │  Celery    │
        │            │ │            │ │  Workers   │
        │ Main DB    │ │ Cache      │ │ Background │
        │            │ │ Temporary  │ │ Tasks      │
        └────────────┘ └────────────┘ └────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  External Services   │
                  │                      │
                  │  Razorpay            │
                  │  Email Provider      │
                  │  SMS Provider        │
                  └──────────────────────┘
```

## 5.2 Architecture Explanation

### Frontend Layer

React.js provides the customer-facing interface and administrative dashboards.

Responsibilities:

- Display movie information.
- Search and filter movies.
- Display theatres and showtimes.
- Render interactive seat layouts.
- Handle booking workflows.
- Display payment status.
- Communicate with GraphQL APIs.

### API Layer

GraphQL acts as the primary communication interface between the frontend and backend.

Responsibilities:

- Process GraphQL queries.
- Execute mutations.
- Validate requests.
- Apply authentication and authorization.
- Invoke appropriate backend services.
- Return structured responses.

### Backend Layer

FastAPI and Strawberry GraphQL handle application logic.

The backend contains separate modules for users, movies, theatres, shows, seats, bookings, payments, and notifications.

### Database Layer

PostgreSQL stores all persistent application data.

Responsibilities:

- User records.
- Movie information.
- Theatre information.
- Screen and seat layouts.
- Show schedules.
- Reservations.
- Bookings.
- Payment records.
- Reviews and notifications.

### Caching Layer

Redis can be used for:

- Frequently accessed movie information.
- Theatre and showtime caching.
- Temporary application data.
- Rate limiting.
- Background task coordination.

Critical booking correctness must always be enforced through PostgreSQL transactions and database constraints.

---

# 6. Database Design

## 6.1 Database Selection

**Selected Database: PostgreSQL**

PostgreSQL is selected because the application contains highly interconnected entities and requires reliable transactional operations.

Reasons:

- ACID transaction support.
- Foreign key constraints.
- Row-level locking.
- Unique constraints.
- Indexing.
- Transaction isolation.
- JSONB support.
- Reliable relational data management.

## 6.2 Database Tables

The database will contain the following primary tables.

| Table | Description |
|---|---|
| users | Customer and administrative accounts |
| roles | Application roles |
| user_roles | User-role relationships |
| movies | Movie details |
| genres | Movie categories |
| movie_genres | Movie-genre relationships |
| theatres | Theatre information |
| screens | Theatre screens |
| seats | Physical seat layouts |
| shows | Scheduled movie screenings |
| show_seats | Seat inventory for individual shows |
| reservations | Temporary seat reservations |
| reservation_seats | Seats associated with reservations |
| bookings | Confirmed booking records |
| booking_seats | Seats associated with bookings |
| payments | Payment transaction records |
| refunds | Refund records |
| coupons | Discount and promotional codes |
| reviews | Customer reviews |
| notifications | Customer notifications |

## 6.3 Database Relationships

```text
USERS
  │
  ├──────── BOOKINGS
  │              │
  │              ├──── BOOKING_SEATS
  │              │
  │              └──── PAYMENTS
  │
  └──────── REVIEWS

MOVIES
  │
  └──────── SHOWS
                │
                ├──── THEATRES
                │        │
                │        └──── SCREENS
                │                  │
                │                  └──── SEATS
                │
                └──── SHOW_SEATS
                           │
                           └──── RESERVATIONS
```

## 6.4 Important Database Design Decision

Physical seats and show-specific seat availability must be stored separately.

Example:

A theatre has 100 physical seats.

The same theatre can host:

- Movie A at 10:00 AM.
- Movie B at 2:00 PM.
- Movie C at 6:00 PM.

The physical seats remain unchanged, but the availability of those seats is independent for each show.

Therefore:

- `seats` stores the theatre's physical seat configuration.
- `show_seats` stores the inventory and booking status for each show.

A uniqueness constraint on `(show_id, seat_id)` ensures that one seat has only one inventory record per show.

---

# 7. GraphQL API Architecture

GraphQL will be the primary API communication layer.

Instead of creating multiple REST endpoints for different resources, the application exposes a GraphQL endpoint.

Example:

```text
/graphql
```

## 7.1 GraphQL Queries

Queries retrieve application data.

### Get All Movies

```graphql
query {
  movies {
    id
    title
    language
    duration
    rating
  }
}
```

### Get Movie Details

```graphql
query {
  movie(id: "101") {
    id
    title
    description
    language
    duration
    genres
  }
}
```

### Get Available Shows

```graphql
query {
  shows(movieId: "101", city: "Ahmedabad") {
    id
    startTime
    theatre {
      name
      address
    }
  }
}
```

### Get Available Seats

```graphql
query {
  showSeats(showId: "SHOW101") {
    seatId
    seatNumber
    category
    price
    status
  }
}
```

## 7.2 GraphQL Mutations

Mutations modify application data.

### Register User

```graphql
mutation {
  register(
    name: "Test User"
    email: "test@example.com"
    password: "StrongPassword123"
  ) {
    user {
      id
      name
      email
    }
    accessToken
  }
}
```

### Create Seat Reservation

```graphql
mutation {
  reserveSeats(
    showId: "SHOW101"
    seatIds: ["A1", "A2"]
  ) {
    reservationId
    expiresAt
    status
  }
}
```

### Create Payment Order

```graphql
mutation {
  createPaymentOrder(
    reservationId: "RES101"
  ) {
    orderId
    amount
    currency
  }
}
```

### Get Booking Details

```graphql
query {
  booking(id: "BOOK101") {
    id
    status
    totalAmount
    seats {
      seatNumber
    }
  }
}
```

These examples illustrate the intended API contracts. Production implementations must include authenticated user context, input validation, authorization, and appropriate error handling.

---

# 8. Seat Reservation and Concurrency Management

This is one of the most important components of the entire platform.

## 8.1 The Double Booking Problem

Consider two users trying to book the same seat.

```text
User A                  User B
  │                       │
  ▼                       ▼
Select Seat A1        Select Seat A1
  │                       │
  └──────────┬────────────┘
             │
             ▼
       Booking Backend
             │
             ▼
       PostgreSQL
             │
             ▼
       Check Availability
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
     User A      User B
     SUCCESS     REJECTED
```

The database must guarantee that only one user can successfully reserve the seat.

## 8.2 Seat Status Lifecycle

Each show-specific seat can have the following statuses:

| Status | Meaning |
|---|---|
| AVAILABLE | Seat is available for reservation |
| LOCKED | Seat is temporarily reserved |
| BOOKED | Seat has a confirmed booking |

A temporary reservation also has an expiration timestamp.

## 8.3 Reservation Workflow

1. Customer selects a movie.
2. Customer selects a theatre and showtime.
3. Backend retrieves show-specific seat availability.
4. Customer selects one or more seats.
5. Backend starts a PostgreSQL transaction.
6. Selected seat rows are locked using `SELECT ... FOR UPDATE`.
7. Backend checks availability and existing reservation expiry.
8. Available seats are temporarily reserved.
9. Reservation expiration is recorded.
10. Transaction is committed.
11. Customer proceeds to payment.

## 8.4 Payment Confirmation

After the customer completes payment:

1. Payment gateway processes the transaction.
2. Backend receives the payment notification.
3. Backend verifies the payment through the gateway's trusted verification mechanism.
4. Backend validates the reservation.
5. Backend starts a database transaction.
6. Reservation and seat records are locked and validated.
7. Booking records are created.
8. Seat status changes to BOOKED.
9. Payment status is updated.
10. Booking confirmation is generated.

All related database changes must be committed atomically.

## 8.5 Reservation Expiration

If payment is not completed within the reservation period:

- Reservation expires.
- Seats become available again.
- Expiration is processed by a background worker.
- The system checks that the reservation has not already been confirmed before releasing seats.

Payment callbacks and expiration workers must safely handle concurrent execution.

## 8.6 Important Technical Mechanisms

- PostgreSQL transactions.
- Row-level locking.
- `SELECT FOR UPDATE`.
- Unique constraints.
- Transaction isolation.
- Idempotency keys.
- Payment reconciliation.
- Reservation expiration workers.

Redis may improve coordination and performance, but PostgreSQL remains responsible for final seat ownership and booking consistency.

---

# 9. Payment Gateway Integration

## 9.1 Payment Workflow

```text
Customer
   │
   ▼
Select Seats
   │
   ▼
Reserve Seats
   │
   ▼
Create Payment Order
   │
   ▼
Razorpay Checkout
   │
   ▼
Customer Completes Payment
   │
   ▼
Payment Verification
   │
   ▼
Webhook Verification
   │
   ▼
Update Payment Status
   │
   ▼
Confirm Booking
   │
   ▼
Generate Digital Ticket
```

## 9.2 Payment Status

The payment table should support statuses such as:

- CREATED
- PENDING
- SUCCESS
- FAILED
- REFUND_PENDING
- REFUNDED

## 9.3 Payment Security

- Never store raw card details.
- Verify Razorpay payment signatures.
- Validate webhook signatures.
- Use idempotency keys.
- Store gateway transaction references.
- Maintain payment audit records.
- Reconcile payment and booking statuses.
- Prevent duplicate booking confirmation.

A browser redirect alone must never be treated as proof of successful payment.

---

# 10. Authentication and Authorization

The application will use JWT-based authentication.

## 10.1 Authentication Flow

```text
User Login
    │
    ▼
Validate Credentials
    │
    ▼
Generate Access Token
    │
    ▼
Generate Refresh Token
    │
    ▼
Return Authentication Response
    │
    ▼
Frontend Stores Credentials Securely
    │
    ▼
Authenticated GraphQL Requests
```

## 10.2 Role-Based Access Control

The application will support multiple roles.

| Role | Permissions |
|---|---|
| CUSTOMER | Browse movies and book tickets |
| THEATRE_ADMIN | Manage assigned theatre and shows |
| ADMIN | Manage platform resources |
| SUPER_ADMIN | Full administrative access |

Authorization must be enforced in backend resolvers and services, not merely hidden in the frontend.

## 10.3 Security Requirements

- Password hashing using Argon2 or bcrypt.
- JWT signature validation.
- Token expiration.
- Refresh-token rotation.
- Role-based authorization.
- Input validation.
- SQL injection prevention.
- Rate limiting.
- CORS configuration.
- Secure HTTP headers.
- Protection against GraphQL query abuse.
- Audit logging for sensitive actions.

---

# 11. Caching and Performance Optimization

Redis will be used to improve application performance.

## 11.1 Cacheable Data

- Movie listings.
- Movie details.
- Genres.
- Theatre information.
- City information.
- Public showtime listings.

## 11.2 Data That Requires Special Handling

Seat availability is dynamic and must not be trusted from stale cache data during a booking operation.

Before reserving seats, the backend must validate the current state in PostgreSQL.

## 11.3 Database Optimization

- Create indexes on frequently queried columns.
- Index foreign keys where appropriate.
- Use pagination for movie and booking lists.
- Avoid N+1 GraphQL queries.
- Use GraphQL DataLoader.
- Optimize SQLAlchemy queries.
- Use connection pooling.
- Monitor slow queries.
- Use query execution plans.

---

# 12. Real-Time Seat Availability

WebSockets can be used to notify customers when seat availability changes.

Example:

```text
Customer A reserves seat A1
           │
           ▼
PostgreSQL updates seat status
           │
           ▼
Backend publishes availability event
           │
           ▼
WebSocket notification
           │
           ▼
Other connected customers
           │
           ▼
Refresh seat availability
```

WebSocket notifications are informational. They do not replace database validation during reservation.

If a customer disconnects and reconnects, the application must fetch the latest seat availability.

---

# 13. Background Processing

Celery workers will process tasks that do not need to block the main booking request.

Examples:

- Sending booking confirmation emails.
- Generating PDF tickets.
- Sending SMS notifications.
- Processing expired reservations.
- Sending refund notifications.
- Updating analytics.
- Scheduled cleanup tasks.

The booking transaction should not depend on successful email or SMS delivery.

---

# 14. High-Level Scalability Design

The initial application will use a modular monolith.

As traffic increases, infrastructure can scale horizontally.

## 14.1 Horizontal Scaling

```text
                 Incoming Traffic
                        │
                        ▼
                 Load Balancer
                        │
             ┌──────────┼──────────┐
             │          │          │
             ▼          ▼          ▼
          Backend 1 Backend 2 Backend 3
             │          │          │
             └──────────┼──────────┘
                        │
                        ▼
                   PostgreSQL
                        │
                ┌───────┴───────┐
                │               │
                ▼               ▼
             Redis         Read Replica
```

This is a conceptual future scaling design. A PostgreSQL read replica is optional and is not another independent source of truth.

## 14.2 Scaling Strategies

- Multiple backend instances.
- Load balancing.
- Redis caching.
- Database indexing.
- Connection pooling.
- Read replicas for suitable read-heavy workloads.
- Background workers.
- CDN for movie posters and static assets.
- Database backup and recovery.
- Monitoring and alerting.

## 14.3 Future Microservices Migration

If the application grows substantially, individual modules can eventually become independent services.

Potential services:

- User Service.
- Movie Service.
- Theatre Service.
- Show Service.
- Booking Service.
- Payment Service.
- Notification Service.

This migration is optional and should be driven by actual scaling, deployment, and organizational requirements.

---

# 15. Data Protection and Disaster Recovery

Data integrity is critical because the platform manages bookings and payments.

## 15.1 Data Protection

- Use database constraints.
- Use transactional booking operations.
- Encrypt connections.
- Protect credentials and API keys.
- Apply least-privilege database permissions.
- Restrict access to sensitive information.
- Maintain audit logs.
- Avoid exposing internal database identifiers unnecessarily.

## 15.2 Backup Strategy

- Automated PostgreSQL backups.
- Point-in-time recovery using WAL archiving.
- Periodic backup restoration tests.
- Encrypted backup storage.
- Separate backup retention policies.
- Monitoring of backup failures.

Backups must be stored independently from the primary database infrastructure.

---

# 16. Project Folder Structure

Proposed repository structure:

```text
cinebook/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── graphql/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── permissions.py
│   │   │
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   ├── base.py
│   │   │   └── migrations/
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── movie.py
│   │   │   ├── theatre.py
│   │   │   ├── screen.py
│   │   │   ├── seat.py
│   │   │   ├── show.py
│   │   │   ├── booking.py
│   │   │   └── payment.py
│   │   │
│   │   ├── schemas/
│   │   ├── graphql/
│   │   │   ├── schema.py
│   │   │   ├── queries.py
│   │   │   ├── mutations.py
│   │   │   └── types.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── movie_service.py
│   │   │   ├── theatre_service.py
│   │   │   ├── show_service.py
│   │   │   ├── seat_service.py
│   │   │   ├── booking_service.py
│   │   │   └── payment_service.py
│   │   │
│   │   ├── integrations/
│   │   │   ├── razorpay.py
│   │   │   └── email.py
│   │   │
│   │   ├── workers/
│   │   │   └── tasks.py
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── concurrency/
│   │
│   └── requirements.txt
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── deployment/
│
├── docs/
│   ├── HLD.md
│   ├── LLD.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   └── BOOKING_FLOW.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 17. Development Roadmap

Development will be divided into phases.

| Phase | Development | Deliverable |
|---|---|---|
| Phase 1 | Requirements and architecture | HLD and project structure |
| Phase 2 | Database design | PostgreSQL schema and migrations |
| Phase 3 | Authentication | Registration, login and roles |
| Phase 4 | Movie management | Movie CRUD and discovery |
| Phase 5 | Theatre management | Theatres, screens and seats |
| Phase 6 | Show management | Show schedules and pricing |
| Phase 7 | Seat reservation | Availability and concurrency handling |
| Phase 8 | Booking system | Booking lifecycle |
| Phase 9 | Payment integration | Razorpay and verification |
| Phase 10 | Frontend | Complete customer interface |
| Phase 11 | Admin dashboard | Management interface |
| Phase 12 | Real-time features | WebSockets and notifications |
| Phase 13 | Testing | Security, integration and load tests |
| Phase 14 | Deployment | Docker and cloud deployment |

---

# 18. Testing Strategy

The platform must be tested at different levels.

### Unit Testing

- User authentication.
- Movie management.
- Theatre management.
- Show creation.
- Reservation validation.
- Payment status handling.

### Integration Testing

- GraphQL and PostgreSQL integration.
- Authentication and authorization.
- Booking and payment workflow.
- Razorpay webhook handling.
- Redis and Celery integration.

### Concurrency Testing

Simulate multiple users trying to reserve the same seat simultaneously.

Expected result:

- Only one reservation succeeds.
- Other users receive a seat-unavailable response.
- No duplicate confirmed bookings are created.

### Load Testing

Use tools such as Locust or k6 to test:

- Concurrent login requests.
- Movie listing requests.
- Showtime searches.
- Seat availability requests.
- Concurrent reservation requests.
- Payment callback processing.

Record throughput, latency, error rate, database load, and resource utilization.

---

# 19. Deployment Architecture

The application will use Docker for consistent development and deployment environments.

Initial deployment components:

- React frontend.
- FastAPI and Strawberry backend.
- PostgreSQL database.
- Redis.
- Celery workers.
- Nginx reverse proxy.

Production deployment should additionally include:

- HTTPS.
- Managed secrets.
- Automated database backups.
- Monitoring.
- Centralized logging.
- Health checks.
- Database migration management.
- CI/CD pipeline.
- Recovery procedures.

---

# 20. Future Enhancements

Potential future improvements include:

- Multiple city support.
- Multiple language support.
- Dynamic ticket pricing.
- Personalized movie recommendations.
- AI-powered movie discovery.
- Loyalty and reward programs.
- Subscription plans.
- Food and beverage pre-booking.
- QR-code ticket verification.
- Multiple payment options.
- Advanced analytics.
- Theatre partner onboarding.
- Promotional campaigns.
- Fraud detection.
- Multi-region deployment.

These features are not part of the initial implementation unless explicitly added to the project scope.

---

# 21. Getting Started

## Prerequisites

Install the following:

- Python 3.11+
- Node.js LTS
- PostgreSQL
- Redis
- Git
- Docker Desktop
- Visual Studio Code

## Clone Repository

```bash
git clone <repository-url>

cd cinebook
```

## Backend Setup

```bash
cd backend

python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables and database connection.

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 22. Environment Configuration

Create a `.env` file using `.env.example` as a reference.

Example:

```env
APP_NAME=CineBook
APP_ENV=development
DEBUG=true

DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/cinebook

REDIS_URL=redis://localhost:6379/0

JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USERNAME=
EMAIL_PASSWORD=
```

Never commit `.env` files, database credentials, JWT secrets, or payment gateway secrets to GitHub.

---

# 23. Project Design Principles

The following principles guide the implementation:

1. PostgreSQL is the single source of truth for persistent data.
2. GraphQL is the primary frontend-backend API.
3. Booking operations must be transactional.
4. Seat availability must be validated by the database.
5. Payment confirmation must be verified independently of frontend responses.
6. Every sensitive operation must be authorized on the backend.
7. Background processing must not compromise booking consistency.
8. Application modules must have clear responsibilities.
9. Performance optimizations must not compromise correctness.
10. The architecture should support future horizontal scaling.

---

# 24. Project Status

<details>
<summary>Planned implementation checklist</summary>

- [ ] Requirements finalization
- [ ] High-Level Design
- [ ] Low-Level Design
- [ ] Database schema
- [ ] Backend project setup
- [ ] GraphQL schema
- [ ] Authentication and authorization
- [ ] Movie management
- [ ] Theatre management
- [ ] Screen and seat management
- [ ] Show management
- [ ] Seat reservation engine
- [ ] Booking management
- [ ] Razorpay integration
- [ ] Customer frontend
- [ ] Admin dashboard
- [ ] WebSocket integration
- [ ] Notification system
- [ ] Automated testing
- [ ] Concurrency testing
- [ ] Load testing
- [ ] Docker configuration
- [ ] Production deployment

</details>

---

# 25. Conclusion

CineBook is designed as a scalable, secure, and reliable movie ticket booking platform inspired by BookMyShow.

The project combines React.js, Python, FastAPI, Strawberry GraphQL, and PostgreSQL to create a complete booking ecosystem.

The primary engineering focus is on:

- Efficient API communication through GraphQL.
- Reliable relational database management.
- Concurrent seat reservation.
- Transaction-safe booking and payment processing.
- Secure authentication and authorization.
- Scalable application infrastructure.

The initial implementation follows a modular monolithic architecture, with a clear path toward horizontal scaling and future service separation.

**Project Name:** CineBook  
**Project Category:** Full-Stack Web Application / System Design  
**Architecture:** Modular Monolith  
**API:** GraphQL  
**Backend:** Python + FastAPI + Strawberry  
**Database:** PostgreSQL  
**Frontend:** React.js  
**Primary Objective:** Reliable online movie ticket booking at scale.