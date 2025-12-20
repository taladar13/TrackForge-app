"""Workouts domain Pydantic schemas."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# Exercises
class ExerciseResponse(BaseModel):
    """Exercise response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    equipment_type: str | None = None
    muscle_groups: list[str] | None = None
    category: str


# Workout Programs
class ProgramExercise(BaseModel):
    """Exercise within a program day."""

    exercise_id: str
    target_sets: int = Field(ge=1)
    target_reps_min: int | None = Field(None, ge=1)
    target_reps_max: int | None = Field(None, ge=1)
    target_weight: float | None = Field(None, ge=0)
    order: int = Field(ge=0)


class WorkoutProgramDayCreate(BaseModel):
    """Create program day request."""

    workout_name: str = Field(max_length=100)
    exercises: list[ProgramExercise] = []


class WorkoutProgramCreate(BaseModel):
    """Create workout program request."""

    name: str = Field(max_length=255)
    frequency: int = Field(ge=1, le=7)
    split: dict[int, str]  # { day_of_week: workout_name }
    workouts: dict[str, WorkoutProgramDayCreate]  # { workout_name: exercises }


class WorkoutProgramUpdate(BaseModel):
    """Update workout program request."""

    name: str | None = Field(None, max_length=255)
    frequency: int | None = Field(None, ge=1, le=7)
    split: dict[int, str] | None = None
    workouts: dict[str, WorkoutProgramDayCreate] | None = None
    is_current: bool | None = None


class WorkoutProgramDayResponse(BaseModel):
    """Program day response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    workout_name: str
    exercises: list[ProgramExercise]


class WorkoutProgramResponse(BaseModel):
    """Workout program response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    frequency: int
    split: dict[str, str]  # JSON returns string keys
    is_current: bool
    days: list[WorkoutProgramDayResponse] = []
    created_at: datetime
    updated_at: datetime


class WorkoutProgramListResponse(BaseModel):
    """Workout program list item."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    frequency: int
    is_current: bool
    created_at: datetime
    updated_at: datetime


# Workout Sessions
class WorkoutSetCreate(BaseModel):
    """Create set request."""

    id: str  # Client-provided UUID
    exercise_id: str
    set_number: int = Field(ge=1)
    weight: float = Field(ge=0)
    reps: int = Field(ge=0)
    rpe: float | None = Field(None, ge=1, le=10)
    completed: bool = True


class WorkoutSessionCreate(BaseModel):
    """Create workout session request."""

    id: str  # Client-provided UUID
    workout_name: str = Field(max_length=255)
    date: date
    program_id: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    sets: list[WorkoutSetCreate] = []


class WorkoutSessionUpdate(BaseModel):
    """Update workout session request."""

    end_time: datetime | None = None
    sets: list[WorkoutSetCreate] | None = None  # Replace all sets


class WorkoutSetResponse(BaseModel):
    """Workout set response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    exercise_id: str
    exercise: ExerciseResponse
    set_number: int
    weight: float
    reps: int
    rpe: float | None = None
    completed: bool


class SessionTotals(BaseModel):
    """Workout session totals."""

    total_sets: int
    total_volume: float  # sum of weight * reps
    duration: int | None = None  # minutes


class WorkoutSessionResponse(BaseModel):
    """Workout session response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    program_id: str | None = None
    workout_name: str
    date: date
    start_time: datetime | None = None
    end_time: datetime | None = None
    sets: list[WorkoutSetResponse] = []
    totals: SessionTotals
    created_at: datetime


class WorkoutSessionListResponse(BaseModel):
    """Workout session list item."""

    id: str
    workout_name: str
    date: date
    totals: SessionTotals
    created_at: datetime


# Workout Day View
class ScheduledExercise(BaseModel):
    """Scheduled exercise for today."""

    exercise_id: str
    exercise: ExerciseResponse
    target_sets: int
    target_reps_min: int | None = None
    target_reps_max: int | None = None
    target_weight: float | None = None
    order: int


class WorkoutDayResponse(BaseModel):
    """Scheduled workout for a day."""

    date: date
    program_id: str | None = None
    workout_name: str | None = None
    exercises: list[ScheduledExercise] = []


# Pagination
class PaginatedSessions(BaseModel):
    """Paginated workout sessions."""

    data: list[WorkoutSessionListResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


