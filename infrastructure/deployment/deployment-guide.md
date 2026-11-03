# BookIN — Production Deployment Guide

## 1. Architecture Overview
In production, BookIN runs on containerized services orchestrated by Docker Compose or Kubernetes:
- **Nginx**: Ingress controller, reverse proxy, SSL termination, and static asset delivery.
- **FastAPI / Strawberry backend**: Stateless API workers running under `uvicorn`.
- **PostgreSQL**: Single primary database with write ahead logging (WAL) and automated backups.
- **Redis**: In-memory caching, real-time message broker, and Celery queue.
- **Celery Worker & Beat**: Asynchronous background job processing and 30-second reservation cleanup sweep.

## 2. Docker Compose Deployment
```bash
# 1. Clone repository
git clone <repo_url> /opt/bookin
cd /opt/bookin

# 2. Configure production environment
cp .env.example .env
# Edit .env with secure production credentials (JWT_SECRET_KEY, DATABASE_URL, RAZORPAY_KEYS)

# 3. Launch services in daemon mode
docker compose up -d --build

# 4. Run database migrations
docker compose exec backend alembic upgrade head

# 5. Seed initial data (theatres, movies, screens, shows)
docker compose exec backend python -m app.database.seed
```

## 3. Database Maintenance & Backups
- Perform nightly `pg_dump`:
  ```bash
  docker compose exec -t postgres pg_dump -U bookin_user bookin_db | gzip > /backups/bookin_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
- Store backups on encrypted S3 bucket with lifecycle policies.
