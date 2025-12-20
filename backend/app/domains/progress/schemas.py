"""Progress domain Pydantic schemas."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Body Metrics
class BodyMetricCreate(BaseModel):
    """Create body metric request."""

    date: date
    weight: float | None = Field(None, gt=0, le=500)  # kg
    body_fat: float | None = Field(None, ge=0, le=100)  # percentage
    muscle_mass: float | None = Field(None, gt=0, le=200)  # kg


class BodyMetricResponse(BaseModel):
    """Body metric response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    date: date
    weight: float | None = None
    body_fat: float | None = None
    muscle_mass: float | None = None
    created_at: datetime


# Progress Summary
class ProgressSummary(BaseModel):
    """Daily progress summary for dashboard."""

    date: date
    weight: float | None = None
    diet_adherence: int | None = None  # 0-100
    workout_completed: bool = False
    total_volume: float | None = None


# Diet Adherence
class DietAdherenceData(BaseModel):
    """Diet adherence data point."""

    date: date
    calories: float
    protein: float
    carbs: float
    fat: float
    target_calories: float
    adherence: int  # 0-100
    status: Literal["green", "yellow", "red"]


# Training Volume
class TrainingVolumeData(BaseModel):
    """Training volume data point."""

    date: date
    total_volume: float
    volume_by_muscle_group: dict[str, float] = {}
    volume_by_exercise: dict[str, float] = {}


# Weight History
class WeightDataPoint(BaseModel):
    """Weight data point for graphs."""

    date: date
    weight: float


