"""Workouts domain models."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid4())


class Exercise(Base):
    """Exercise definition."""

    __tablename__ = "exercises"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    equipment_type = Column(String(100), nullable=True)
    muscle_groups = Column(JSONB, nullable=True)  # ["chest", "triceps"]
    category = Column(String(50), nullable=False)  # strength, cardio, flexibility, other
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class WorkoutProgram(Base):
    """Workout program/routine."""

    __tablename__ = "workout_programs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    frequency = Column(Integer, nullable=False)  # days per week
    split = Column(JSONB, nullable=False)  # { 1: "Push", 2: "Pull", ... }
    is_current = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    days = relationship("WorkoutProgramDay", back_populates="program", cascade="all, delete-orphan")


class WorkoutProgramDay(Base):
    """A single workout day within a program."""

    __tablename__ = "workout_program_days"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    program_id = Column(String(36), ForeignKey("workout_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    workout_name = Column(String(100), nullable=False)  # "Push", "Pull", "Legs"
    exercises = Column(JSONB, nullable=False)  # [{ exercise_id, target_sets, target_reps_min, target_reps_max, target_weight, order }]

    # Relationships
    program = relationship("WorkoutProgram", back_populates="days")


class WorkoutSession(Base):
    """A completed or in-progress workout session."""

    __tablename__ = "workout_sessions"

    # Client-provided UUID for offline support
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(String(36), ForeignKey("workout_programs.id", ondelete="SET NULL"), nullable=True)
    workout_name = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    sets = relationship("WorkoutSet", back_populates="session", cascade="all, delete-orphan")


class WorkoutSet(Base):
    """A single set within a workout session."""

    __tablename__ = "workout_sets"

    # Client-provided UUID for offline support
    id = Column(String(36), primary_key=True)
    session_id = Column(String(36), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(String(36), ForeignKey("exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)
    rpe = Column(Float, nullable=True)  # Rate of Perceived Exertion 1-10
    completed = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    session = relationship("WorkoutSession", back_populates="sets")
    exercise = relationship("Exercise")


