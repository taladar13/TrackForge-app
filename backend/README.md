# TrackForge Backend — New Developer Guide

This is the definitive onboarding guide to the TrackForge backend. After reading, you should be able to run the stack, understand the architecture and contracts, and contribute safely.

---

## Architecture at a Glance
- **FastAPI (async)** with a modular monolith layout.
- **PostgreSQL 15** via async SQLAlchemy 2.0.
- **Redis** for rate limiting and idempotency cache.
- **JWT Auth** with refresh rotation and reuse detection; Argon2 password hashing.
- **Alembic** for migrations.
- **Domains**:
  - `auth`: register, login, refresh, logout, token revocation
  - `users`: profile (units), delete account
  - `nutrition`: diet plans/meals/items, food logs, day view/adherence
  - `workouts`: programs, sessions (client UUIDs + idempotency), exercises
  - `progress`: body metrics, diet adherence, training volume
  - `ocr`: synchronous deterministic mock (menu/workout)
  - `core`: config, db, security, rate_limit, idempotency, errors, deps

Routers are mounted under `/api/v1` in `app/main.py`.

---

## Runbook

### Docker (recommended)
```bash
# from repo root
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed
```

### Local (without Docker)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
# ensure Postgres + Redis are running and env vars are set
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

API docs:
- Swagger: http://localhost:8000/api/v1/docs
- ReDoc:  http://localhost:8000/api/v1/redoc
- OpenAPI: http://localhost:8000/api/v1/openapi.json

Demo credentials (after seed):
- Email: `demo@trackforge.com`
- Password: `demo1234`

---

## Project Structure (essentials)
```
backend/
├─ app/
│  ├─ core/          # config, db, security, rate_limit, idempotency, errors, deps
│  ├─ domains/
│  │  ├─ auth/       # models, schemas, service, router
│  │  ├─ users/
│  │  ├─ nutrition/
│  │  ├─ workouts/
│  │  ├─ progress/
│  │  └─ ocr/
│  └─ main.py        # app factory, CORS, router include, Redis lifespan
├─ alembic/          # migrations
├─ scripts/seed.py   # demo data
├─ tests/            # unit + integration
├─ pyproject.toml
└─ Dockerfile
```

---

## Configuration
See `.env.example`. Key vars:
- `DATABASE_URL` (asyncpg URI)
- `REDIS_URL`
- `SECRET_KEY` (generate with `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `CORS_ORIGINS` (list of frontend origins)
- Rate limit defaults: `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`

---

## Domain Deep-Dive

### Auth
- Access tokens: 15 minutes. Refresh tokens: 7 days, single-use rotation.
- Refresh reuse detection: any reuse revokes the entire family.
- Logout: stores access JTI with the token’s real expiry; refresh family revoked if provided.
- Password hashing: Argon2 (bcrypt fallback). Email uniqueness enforced.
- Endpoints rate-limited via Redis sliding window.

### Users
- Profile with unit preferences (weight/height/energy). Stored in canonical metric units; convert on read if needed by frontend.
- Account deletion is hard delete with cascade.

### Nutrition
- Diet plans (days_of_week), meals with items; soft delete on plans.
- Food logs: planned and ad-hoc; planned upsert keyed by (user, date, meal, food). On upsert, log is reloaded with `food` relationship before response.
- Day view computes adherence as average relative macro deviation, clamped 0–100 (matches frontend).

### Workouts
- Programs with split (day → workout name) and day definitions (exercises JSONB).
- Sessions: client-generated UUIDs for session and sets; idempotent writes using `Idempotency-Key`.
- Update sessions: upsert sets by ID, last-write-wins.
- Pagination for listing sessions; totals include volume and optional duration.

### Progress
- Body metrics upsert by date (unique per user/date).
- Diet adherence and training volume aggregated over date ranges.

### OCR
- MVP: synchronous deterministic mock provider; files stored locally under `uploads/ocr`.
- Rate-limited (10/hour). No Celery/S3 yet.

---

## Idempotency & Offline Safety
- Header `Idempotency-Key` required for offline retryable writes (workout sessions).
- Responses cached per `(user_id, idempotency_key)` for 24h; identical key returns cached status/body.
- Client must send stable UUIDs for session and sets; collisions are treated as idempotent.

---

## Security & Cross-Cutting
- CORS: configured origins from env; all methods/headers; credentials allowed.
- Exception handling: uniform `ApiError` shape.
- Rate limiting: auth endpoints (5–30/min), OCR (10/hour).
- Secrets: never commit real `SECRET_KEY`; rotate on compromise.

---

## Migrations
- Create: `alembic revision --autogenerate -m "msg"`
- Apply:  `alembic upgrade head`
- Rollback: `alembic downgrade -1`
Template: `alembic/script.py.mako`.

---

## Testing
```bash
pytest                 # all tests
pytest --cov=app       # coverage
pytest tests/test_auth_api.py -v  # single file
```

---

## Operational Notes & Failure Points
Handled:
- Refresh token reuse detection revokes family.
- Logout stores real access-token expiry so blacklist remains effective.
- Planned food log upsert reloads `food` relationship to satisfy response schema.
- Idempotency responses cached; prevents duplicate side effects.
- CORS and rate limiting configured; Redis-backed.

Gaps / follow-ups:
- No scheduled cleanup job yet for expired `revoked_access_tokens` and stale idempotency keys (cleanup occurs opportunistically on access).
- OCR uses local disk; production should use S3/MinIO + background worker.
- Limited observability (logging/metrics/tracing) — to be added.
- No roles/permissions beyond authenticated user.

---

## Common API Cheatsheet
- Register: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`
- Refresh: `POST /api/v1/auth/refresh` (body `refresh_token`)
- Me: `GET /api/v1/users/me`
- Diet day: `GET /api/v1/days/{date}/diet`
- Food log: `POST /api/v1/food-logs`
- Workout session (idempotent): `POST /api/v1/workout-sessions` + `Idempotency-Key`
- Progress weight: `GET /api/v1/progress/weight?from=&to=`
- OCR menu: `POST /api/v1/ocr/menu` (multipart, mocked)

---

## Contact Points When Changing Things
- Schema changes: add Alembic migration; update models/schemas; consider seed and tests.
- Auth changes: ensure rotation/reuse logic stays consistent; mind token TTLs.
- Offline/idempotency: verify client UUIDs and `Idempotency-Key` handling; collisions are treated as idempotent.
