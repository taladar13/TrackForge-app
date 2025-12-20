# TrackForge Backend API

FastAPI backend for the TrackForge fitness tracking application.

## Features

- **Authentication**: JWT with access/refresh token rotation, reuse detection
- **Diet Tracking**: Plans, meals, food logs, daily adherence calculation
- **Workout Tracking**: Programs, sessions with offline-safe sync (idempotency + client UUIDs)
- **Progress Analytics**: Body metrics, diet adherence, training volume
- **OCR** (MVP): Synchronous mock provider for menu/workout parsing

## Tech Stack

- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL 15 + SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + Argon2 password hashing
- **Cache/Rate Limiting**: Redis
- **Validation**: Pydantic v2

## Quick Start

### With Docker (Recommended)

```bash
# From project root
docker compose up -d

# Run migrations
docker compose exec api alembic upgrade head

# Seed demo data
docker compose exec api python -m scripts.seed
```

### Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -e ".[dev]"

# Start PostgreSQL and Redis (or use Docker)
# ...

# Run migrations
alembic upgrade head

# Seed demo data
python -m scripts.seed

# Start server
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

## Demo Credentials

After seeding:
- **Email**: demo@trackforge.com
- **Password**: demo1234

## Project Structure

```
backend/
├── app/
│   ├── core/           # Config, DB, security, rate limiting
│   ├── domains/        # Feature modules
│   │   ├── auth/       # Register, login, refresh, logout
│   │   ├── users/      # Profile, account management
│   │   ├── nutrition/  # Diet plans, food logs
│   │   ├── workouts/   # Programs, sessions, exercises
│   │   ├── progress/   # Body metrics, analytics
│   │   └── ocr/        # Image processing (mock)
│   └── main.py         # App factory
├── alembic/            # Database migrations
├── tests/              # pytest tests
├── scripts/            # Seed script
└── pyproject.toml      # Dependencies
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth_api.py -v
```

## Key Design Decisions

### Offline-Safe Workout Sync

- Client generates UUIDs for sessions and sets
- `Idempotency-Key` header for safe retries
- Last-write-wins conflict resolution

### Token Rotation

- Access tokens: 15 min expiry
- Refresh tokens: 7 day expiry, single use
- Token family tracking for reuse detection (revokes entire family on reuse)

### Rate Limiting

- Auth endpoints: 5-30 req/min
- OCR uploads: 10 req/hour

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT signing key (generate with `openssl rand -hex 32`)


