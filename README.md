# 🎬 BookIN

BookIN is a modern movie ticket booking platform inspired by BookMyShow. It gives movie lovers a smooth, reliable way to discover trending films, find nearby theatres, pick seats on an interactive layout, and grab digital tickets with QR codes in seconds.

Under the hood, BookIN is designed with a modular FastAPI and Strawberry GraphQL backend, a responsive React frontend, and strict transactional seat locking so two people never book the same seat at once.

---

## ✨ Features

- **Movie Discovery:** Browse now-showing and upcoming movies filtered by city, language, and genre.
- **Interactive Seat Selection:** Real-time visual theatre layout with seat tiers (Standard, Premium, Recliner).
- **Zero Double-Bookings:** 10-minute temporary seat reservation engine powered by database-level locks.
- **Digital Tickets & QR Codes:** Instant booking confirmation with scannable QR tickets and confetti celebration.
- **Admin Dashboard:** Manage movies, theatres, screens, seat layouts, and show schedules in one place.
- **GraphQL First:** Powered by Strawberry GraphQL for lean, fast queries between the client and server.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** for modern styling
- **Lucide React** for clean iconography
- **QR Code & Canvas Confetti** for interactive ticket confirmations

### Backend
- **Python 3.11+** with **FastAPI**
- **Strawberry GraphQL** for typed API schema
- **SQLAlchemy 2.0** + **Alembic** migrations
- **SQLite** (plug-and-play local dev) / **PostgreSQL** (production)
- **JWT Authentication** + Argon2/bcrypt password hashing

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Git

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will start at `http://127.0.0.1:8000`.
- GraphQL Playground: `http://127.0.0.1:8000/graphql`
- Health check: `http://127.0.0.1:8000/health`

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`.

> 💡 **Tip for Windows users:** You can also simply double-click `run_backend.bat` and `run_frontend.bat` in the root folder to launch both servers with one click.

---

## ⚙️ Environment Configuration

Copy the sample environment file to get started:

```bash
cp .env.example .env
```

By default, BookIN uses a local SQLite database (`bookin.db`) so you can run the app immediately without configuring a database server. For production, simply point `DATABASE_URL` to your PostgreSQL instance.

---

## 🔐 Default Admin Account

To access the admin dashboard right away, sign in with the seeded credentials:

- **Email:** `admin@bookin.com`
- **Password:** `Admin@BookIN2026!`

---

## 📂 Project Structure

```text
booking-system/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, database connection, config
│   │   ├── database/       # Models, migrations, seeders
│   │   ├── graphql/        # Queries, mutations, schema types
│   │   ├── models/         # SQLAlchemy database models
│   │   └── services/       # Seat locking, reservations, bookings
│   └── tests/              # Concurrency and integration tests
├── frontend/
│   ├── src/
│   │   ├── components/     # UI widgets, navbar, seat map
│   │   ├── pages/          # Home, Movie details, Checkout, Admin
│   │   └── services/       # GraphQL client and API hooks
├── run_backend.bat         # One-click Windows backend launcher
└── run_frontend.bat        # One-click Windows frontend launcher
```

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are always welcome! Feel free to fork the repository, create a branch, and open a pull request.

---

## 📄 License

This project is open-source and available under the MIT License.
