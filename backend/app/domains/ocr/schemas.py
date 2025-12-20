"""OCR domain Pydantic schemas."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class OcrJobResponse(BaseModel):
    """OCR job response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    type: Literal["menu", "workout"]
    status: Literal["pending", "processing", "completed", "failed"]
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


# Menu OCR Result
class ParsedMenuItem(BaseModel):
    """Parsed menu item from OCR."""

    name: str
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    price: str | None = None


class ParsedMenuSection(BaseModel):
    """Parsed menu section."""

    name: str
    items: list[ParsedMenuItem]


class MenuOcrResult(BaseModel):
    """Menu OCR result."""

    sections: list[ParsedMenuSection]
    raw_text: str | None = None


# Workout OCR Result
class ParsedExercise(BaseModel):
    """Parsed exercise from OCR."""

    name: str
    sets: int | None = None
    reps: str | None = None  # Could be "8-12" or "8"
    weight: str | None = None
    notes: str | None = None


class WorkoutOcrResult(BaseModel):
    """Workout OCR result."""

    title: str | None = None
    exercises: list[ParsedExercise]
    raw_text: str | None = None


