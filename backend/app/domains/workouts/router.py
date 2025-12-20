"""Workouts domain API routes."""

from datetime import date

from fastapi import APIRouter, Query

from app.core.deps import CurrentUserId, DbSession, IdempotencyKeyHeader
from app.domains.workouts import service
from app.domains.workouts.schemas import (
    ExerciseResponse,
    PaginatedSessions,
    WorkoutDayResponse,
    WorkoutProgramCreate,
    WorkoutProgramListResponse,
    WorkoutProgramResponse,
    WorkoutProgramUpdate,
    WorkoutSessionCreate,
    WorkoutSessionResponse,
    WorkoutSessionUpdate,
)

router = APIRouter(tags=["workouts"])


# Exercises
@router.get("/exercises/search", response_model=list[ExerciseResponse])
async def search_exercises(
    db: DbSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
) -> list[ExerciseResponse]:
    """Search exercises by name."""
    return await service.search_exercises(db, q, limit)


# Workout Programs
@router.get("/workout-programs", response_model=list[WorkoutProgramListResponse])
async def list_workout_programs(
    db: DbSession,
    user_id: CurrentUserId,
) -> list[WorkoutProgramListResponse]:
    """List all workout programs."""
    return await service.list_workout_programs(db, user_id)


@router.post("/workout-programs", response_model=WorkoutProgramResponse)
async def create_workout_program(
    request: WorkoutProgramCreate,
    db: DbSession,
    user_id: CurrentUserId,
) -> WorkoutProgramResponse:
    """Create a new workout program."""
    return await service.create_workout_program(db, user_id, request)


@router.get("/workout-programs/{program_id}", response_model=WorkoutProgramResponse)
async def get_workout_program(
    program_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> WorkoutProgramResponse:
    """Get a specific workout program."""
    return await service.get_workout_program(db, user_id, program_id)


@router.put("/workout-programs/{program_id}", response_model=WorkoutProgramResponse)
async def update_workout_program(
    program_id: str,
    request: WorkoutProgramUpdate,
    db: DbSession,
    user_id: CurrentUserId,
) -> WorkoutProgramResponse:
    """Update a workout program."""
    return await service.update_workout_program(db, user_id, program_id, request)


@router.delete("/workout-programs/{program_id}")
async def delete_workout_program(
    program_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> dict[str, str]:
    """Delete a workout program (soft delete)."""
    await service.delete_workout_program(db, user_id, program_id)
    return {"message": "Workout program deleted"}


# Workout Day View
@router.get("/days/{target_date}/workout", response_model=WorkoutDayResponse)
async def get_workout_day(
    target_date: date,
    db: DbSession,
    user_id: CurrentUserId,
) -> WorkoutDayResponse:
    """Get scheduled workout for a day."""
    return await service.get_workout_day(db, user_id, target_date)


# Workout Sessions
@router.post("/workout-sessions", response_model=WorkoutSessionResponse, status_code=201)
async def create_workout_session(
    request: WorkoutSessionCreate,
    db: DbSession,
    user_id: CurrentUserId,
    idempotency_key: IdempotencyKeyHeader = None,
) -> WorkoutSessionResponse:
    """Create a workout session. Supports idempotency via Idempotency-Key header."""
    return await service.create_workout_session(db, user_id, request, idempotency_key)


@router.get("/workout-sessions", response_model=PaginatedSessions)
async def list_workout_sessions(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedSessions:
    """List workout sessions in date range."""
    return await service.list_workout_sessions(db, user_id, from_date, to_date, page, page_size)


@router.get("/workout-sessions/{session_id}", response_model=WorkoutSessionResponse)
async def get_workout_session(
    session_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> WorkoutSessionResponse:
    """Get a specific workout session."""
    return await service.get_workout_session(db, user_id, session_id)


@router.put("/workout-sessions/{session_id}", response_model=WorkoutSessionResponse)
async def update_workout_session(
    session_id: str,
    request: WorkoutSessionUpdate,
    db: DbSession,
    user_id: CurrentUserId,
    idempotency_key: IdempotencyKeyHeader = None,
) -> WorkoutSessionResponse:
    """Update a workout session. Supports idempotency via Idempotency-Key header."""
    return await service.update_workout_session(db, user_id, session_id, request, idempotency_key)
