"""Workouts domain business logic."""

from datetime import date, datetime, UTC

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, NotFoundError
from app.core.idempotency import (
    mark_idempotency_failed,
    start_idempotency_request,
    store_idempotency_response,
)
from app.domains.workouts.models import (
    Exercise,
    WorkoutProgram,
    WorkoutProgramDay,
    WorkoutSession,
    WorkoutSet,
)
from app.domains.workouts.schemas import (
    ExerciseResponse,
    PaginatedSessions,
    ProgramExercise,
    ScheduledExercise,
    SessionTotals,
    WorkoutDayResponse,
    WorkoutProgramCreate,
    WorkoutProgramListResponse,
    WorkoutProgramResponse,
    WorkoutProgramUpdate,
    WorkoutSessionCreate,
    WorkoutSessionListResponse,
    WorkoutSessionResponse,
    WorkoutSessionUpdate,
    WorkoutSetResponse,
)


def calculate_session_totals(sets: list[WorkoutSet], start: datetime | None, end: datetime | None) -> SessionTotals:
    """Calculate session totals from sets."""
    completed_sets = [s for s in sets if s.completed]
    total_volume = sum(s.weight * s.reps for s in completed_sets)

    duration = None
    if start and end:
        duration = int((end - start).total_seconds() / 60)

    return SessionTotals(
        total_sets=len(completed_sets),
        total_volume=total_volume,
        duration=duration,
    )


# Exercises
async def search_exercises(
    db: AsyncSession,
    query: str,
    limit: int = 20,
) -> list[ExerciseResponse]:
    """Search exercises by name."""
    result = await db.execute(
        select(Exercise)
        .where(Exercise.name.ilike(f"%{query}%"))
        .limit(limit)
    )
    exercises = result.scalars().all()
    return [ExerciseResponse.model_validate(e) for e in exercises]


# Workout Programs
async def list_workout_programs(db: AsyncSession, user_id: str) -> list[WorkoutProgramListResponse]:
    """List all workout programs for a user."""
    result = await db.execute(
        select(WorkoutProgram)
        .where(WorkoutProgram.user_id == user_id, WorkoutProgram.deleted_at.is_(None))
        .order_by(WorkoutProgram.created_at.desc())
    )
    programs = result.scalars().all()
    return [WorkoutProgramListResponse.model_validate(p) for p in programs]


async def get_workout_program(db: AsyncSession, user_id: str, program_id: str) -> WorkoutProgramResponse:
    """Get a workout program with days."""
    result = await db.execute(
        select(WorkoutProgram)
        .options(selectinload(WorkoutProgram.days))
        .where(
            WorkoutProgram.id == program_id,
            WorkoutProgram.user_id == user_id,
            WorkoutProgram.deleted_at.is_(None),
        )
    )
    program = result.scalar_one_or_none()

    if not program:
        raise NotFoundError("Workout program not found")

    return WorkoutProgramResponse.model_validate(program)


async def create_workout_program(
    db: AsyncSession,
    user_id: str,
    data: WorkoutProgramCreate,
) -> WorkoutProgramResponse:
    """Create a new workout program."""
    program = WorkoutProgram(
        user_id=user_id,
        name=data.name,
        frequency=data.frequency,
        split=data.split,
    )
    db.add(program)
    await db.flush()

    # Create program days
    for workout_name, day_data in data.workouts.items():
        day = WorkoutProgramDay(
            program_id=program.id,
            workout_name=workout_name,
            exercises=[e.model_dump() for e in day_data.exercises],
        )
        db.add(day)

    await db.flush()
    return await get_workout_program(db, user_id, program.id)


async def update_workout_program(
    db: AsyncSession,
    user_id: str,
    program_id: str,
    data: WorkoutProgramUpdate,
) -> WorkoutProgramResponse:
    """Update a workout program."""
    result = await db.execute(
        select(WorkoutProgram)
        .options(selectinload(WorkoutProgram.days))
        .where(
            WorkoutProgram.id == program_id,
            WorkoutProgram.user_id == user_id,
            WorkoutProgram.deleted_at.is_(None),
        )
    )
    program = result.scalar_one_or_none()

    if not program:
        raise NotFoundError("Workout program not found")

    if data.name is not None:
        program.name = data.name
    if data.frequency is not None:
        program.frequency = data.frequency
    if data.split is not None:
        program.split = data.split
    if data.is_current is not None:
        if data.is_current:
            # Unset other current programs
            other_result = await db.execute(
                select(WorkoutProgram).where(
                    WorkoutProgram.user_id == user_id,
                    WorkoutProgram.is_current == True,
                    WorkoutProgram.id != program_id,
                )
            )
            for other in other_result.scalars().all():
                other.is_current = False
        program.is_current = data.is_current

    if data.workouts is not None:
        # Replace all days
        for day in program.days:
            await db.delete(day)

        for workout_name, day_data in data.workouts.items():
            day = WorkoutProgramDay(
                program_id=program.id,
                workout_name=workout_name,
                exercises=[e.model_dump() for e in day_data.exercises],
            )
            db.add(day)

    await db.flush()
    return await get_workout_program(db, user_id, program_id)


async def delete_workout_program(db: AsyncSession, user_id: str, program_id: str) -> None:
    """Soft delete a workout program."""
    result = await db.execute(
        select(WorkoutProgram).where(
            WorkoutProgram.id == program_id,
            WorkoutProgram.user_id == user_id,
            WorkoutProgram.deleted_at.is_(None),
        )
    )
    program = result.scalar_one_or_none()

    if not program:
        raise NotFoundError("Workout program not found")

    program.deleted_at = datetime.now(UTC)


# Workout Sessions
async def create_workout_session(
    db: AsyncSession,
    user_id: str,
    data: WorkoutSessionCreate,
    idempotency_key: str | None = None,
) -> WorkoutSessionResponse:
    """
    Create a workout session with idempotency support.
    
    If idempotency_key is provided, returns cached response on duplicate request.
    """
    # Check idempotency
    if idempotency_key:
        proceed, status_code, body = await start_idempotency_request(db, user_id, idempotency_key)
        if not proceed:
            if status_code == 409:
                from app.core.errors import ApiError
                from fastapi import status
                raise ApiError(body["message"], status_code=status.HTTP_409_CONFLICT)
            return WorkoutSessionResponse.model_validate(body)

    try:
        # Check if session ID already exists (client UUID collision)
        existing = await db.execute(
            select(WorkoutSession).where(WorkoutSession.id == data.id)
        )
        if existing.scalar_one_or_none():
            # Return existing session (idempotent behavior)
            response = await get_workout_session(db, user_id, data.id)
            if idempotency_key:
                await store_idempotency_response(
                    db, user_id, idempotency_key, 201, response.model_dump(mode="json")
                )
            return response

        session = WorkoutSession(
            id=data.id,
            user_id=user_id,
            program_id=data.program_id,
            workout_name=data.workout_name,
            date=data.date,
            start_time=data.start_time,
            end_time=data.end_time,
        )
        db.add(session)
        await db.flush()

        # Create sets
        for set_data in data.sets:
            workout_set = WorkoutSet(
                id=set_data.id,
                session_id=session.id,
                exercise_id=set_data.exercise_id,
                set_number=set_data.set_number,
                weight=set_data.weight,
                reps=set_data.reps,
                rpe=set_data.rpe,
                completed=set_data.completed,
            )
            db.add(workout_set)

        await db.flush()

        response = await get_workout_session(db, user_id, session.id)

        # Store idempotency response
        if idempotency_key:
            await store_idempotency_response(
                db, user_id, idempotency_key, 201, response.model_dump(mode="json")
            )

        return response
    except Exception:
        if idempotency_key:
            await mark_idempotency_failed(db, user_id, idempotency_key)
        raise


async def get_workout_session(db: AsyncSession, user_id: str, session_id: str) -> WorkoutSessionResponse:
    """Get a workout session with sets."""
    result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
        .where(WorkoutSession.id == session_id, WorkoutSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise NotFoundError("Workout session not found")

    totals = calculate_session_totals(session.sets, session.start_time, session.end_time)

    return WorkoutSessionResponse(
        id=session.id,
        user_id=session.user_id,
        program_id=session.program_id,
        workout_name=session.workout_name,
        date=session.date,
        start_time=session.start_time,
        end_time=session.end_time,
        sets=[WorkoutSetResponse.model_validate(s) for s in session.sets],
        totals=totals,
        created_at=session.created_at,
    )


async def update_workout_session(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    data: WorkoutSessionUpdate,
    idempotency_key: str | None = None,
) -> WorkoutSessionResponse:
    """Update a workout session with idempotency support."""
    # Check idempotency
    if idempotency_key:
        proceed, status_code, body = await start_idempotency_request(db, user_id, idempotency_key)
        if not proceed:
            if status_code == 409:
                from app.core.errors import ApiError
                from fastapi import status
                raise ApiError(body["message"], status_code=status.HTTP_409_CONFLICT)
            return WorkoutSessionResponse.model_validate(body)

    try:
        result = await db.execute(
            select(WorkoutSession)
            .options(selectinload(WorkoutSession.sets))
            .where(WorkoutSession.id == session_id, WorkoutSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise NotFoundError("Workout session not found")

        if data.end_time is not None:
            session.end_time = data.end_time

        if data.sets is not None:
            # Upsert sets by ID (last-write-wins)
            existing_set_ids = {s.id for s in session.sets}

            for set_data in data.sets:
                if set_data.id in existing_set_ids:
                    # Update existing set
                    for existing_set in session.sets:
                        if existing_set.id == set_data.id:
                            existing_set.weight = set_data.weight
                            existing_set.reps = set_data.reps
                            existing_set.rpe = set_data.rpe
                            existing_set.completed = set_data.completed
                            break
                else:
                    # Create new set
                    new_set = WorkoutSet(
                        id=set_data.id,
                        session_id=session.id,
                        exercise_id=set_data.exercise_id,
                        set_number=set_data.set_number,
                        weight=set_data.weight,
                        reps=set_data.reps,
                        rpe=set_data.rpe,
                        completed=set_data.completed,
                    )
                    db.add(new_set)

        await db.flush()

        response = await get_workout_session(db, user_id, session_id)

        if idempotency_key:
            await store_idempotency_response(
                db, user_id, idempotency_key, 200, response.model_dump(mode="json")
            )

        return response
    except Exception:
        if idempotency_key:
            await mark_idempotency_failed(db, user_id, idempotency_key)
        raise


async def list_workout_sessions(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedSessions:
    """List workout sessions in date range with pagination."""
    # Get total count
    count_result = await db.execute(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.date >= from_date,
            WorkoutSession.date <= to_date,
        )
    )
    total = count_result.scalar() or 0

    # Get paginated sessions
    offset = (page - 1) * page_size
    result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.sets))
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.date >= from_date,
            WorkoutSession.date <= to_date,
        )
        .order_by(WorkoutSession.date.desc(), WorkoutSession.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    sessions = result.scalars().all()

    items = []
    for session in sessions:
        totals = calculate_session_totals(session.sets, session.start_time, session.end_time)
        items.append(WorkoutSessionListResponse(
            id=session.id,
            workout_name=session.workout_name,
            date=session.date,
            totals=totals,
            created_at=session.created_at,
        ))

    return PaginatedSessions(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=offset + len(items) < total,
    )


# Workout Day View
async def get_workout_day(
    db: AsyncSession,
    user_id: str,
    target_date: date,
) -> WorkoutDayResponse:
    """Get scheduled workout for a day."""
    day_of_week = target_date.weekday()
    # Convert to 0=Sunday format
    day_of_week = (day_of_week + 1) % 7

    # Find current program
    result = await db.execute(
        select(WorkoutProgram)
        .options(selectinload(WorkoutProgram.days))
        .where(
            WorkoutProgram.user_id == user_id,
            WorkoutProgram.deleted_at.is_(None),
            WorkoutProgram.is_current == True,
        )
        .limit(1)
    )
    program = result.scalar_one_or_none()

    if not program:
        return WorkoutDayResponse(date=target_date)

    # Check if this day has a workout scheduled
    workout_name = program.split.get(str(day_of_week))
    if not workout_name:
        return WorkoutDayResponse(date=target_date, program_id=program.id)

    # Find the workout day definition
    day_def = next((d for d in program.days if d.workout_name == workout_name), None)
    if not day_def:
        return WorkoutDayResponse(
            date=target_date,
            program_id=program.id,
            workout_name=workout_name,
        )

    # Build exercise list
    exercises = []
    exercise_ids = [e["exercise_id"] for e in day_def.exercises]

    if exercise_ids:
        ex_result = await db.execute(
            select(Exercise).where(Exercise.id.in_(exercise_ids))
        )
        exercise_map = {e.id: e for e in ex_result.scalars().all()}

        for ex_data in sorted(day_def.exercises, key=lambda x: x.get("order", 0)):
            exercise = exercise_map.get(ex_data["exercise_id"])
            if exercise:
                exercises.append(ScheduledExercise(
                    exercise_id=exercise.id,
                    exercise=ExerciseResponse.model_validate(exercise),
                    target_sets=ex_data.get("target_sets", 3),
                    target_reps_min=ex_data.get("target_reps_min"),
                    target_reps_max=ex_data.get("target_reps_max"),
                    target_weight=ex_data.get("target_weight"),
                    order=ex_data.get("order", 0),
                ))

    return WorkoutDayResponse(
        date=target_date,
        program_id=program.id,
        workout_name=workout_name,
        exercises=exercises,
    )


