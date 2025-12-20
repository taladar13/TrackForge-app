"""OCR domain business logic with mock provider."""

import os
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.domains.ocr.models import OcrJob
from app.domains.ocr.schemas import (
    MenuOcrResult,
    OcrJobResponse,
    ParsedExercise,
    ParsedMenuItem,
    ParsedMenuSection,
    WorkoutOcrResult,
)

# Upload directory for images
UPLOAD_DIR = "uploads/ocr"


def ensure_upload_dir() -> None:
    """Ensure upload directory exists."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def mock_menu_ocr(image_path: str) -> MenuOcrResult:
    """
    Mock menu OCR provider.
    
    Returns deterministic results for testing/demo purposes.
    In production, this would call an actual OCR API.
    """
    return MenuOcrResult(
        sections=[
            ParsedMenuSection(
                name="Breakfast",
                items=[
                    ParsedMenuItem(
                        name="Egg White Omelette",
                        calories=220,
                        protein=24,
                        carbs=4,
                        fat=12,
                    ),
                    ParsedMenuItem(
                        name="Greek Yogurt Parfait",
                        calories=280,
                        protein=18,
                        carbs=35,
                        fat=8,
                    ),
                    ParsedMenuItem(
                        name="Avocado Toast",
                        calories=350,
                        protein=12,
                        carbs=28,
                        fat=22,
                    ),
                ],
            ),
            ParsedMenuSection(
                name="Lunch",
                items=[
                    ParsedMenuItem(
                        name="Grilled Chicken Salad",
                        calories=420,
                        protein=38,
                        carbs=18,
                        fat=22,
                    ),
                    ParsedMenuItem(
                        name="Salmon Bowl",
                        calories=520,
                        protein=35,
                        carbs=45,
                        fat=20,
                    ),
                ],
            ),
            ParsedMenuSection(
                name="Dinner",
                items=[
                    ParsedMenuItem(
                        name="Lean Beef Stir Fry",
                        calories=450,
                        protein=32,
                        carbs=25,
                        fat=24,
                    ),
                    ParsedMenuItem(
                        name="Grilled Sea Bass",
                        calories=380,
                        protein=42,
                        carbs=8,
                        fat=18,
                    ),
                ],
            ),
        ],
        raw_text="[Mock OCR - actual text would be extracted from image]",
    )


def mock_workout_ocr(image_path: str) -> WorkoutOcrResult:
    """
    Mock workout OCR provider.
    
    Returns deterministic results for testing/demo purposes.
    In production, this would call an actual OCR API.
    """
    return WorkoutOcrResult(
        title="Push Day - Week 3",
        exercises=[
            ParsedExercise(
                name="Bench Press",
                sets=4,
                reps="6-8",
                weight="185 lbs",
                notes="Warm up with 135",
            ),
            ParsedExercise(
                name="Incline Dumbbell Press",
                sets=3,
                reps="8-10",
                weight="65 lbs",
            ),
            ParsedExercise(
                name="Cable Flyes",
                sets=3,
                reps="12-15",
                notes="Focus on squeeze",
            ),
            ParsedExercise(
                name="Overhead Press",
                sets=4,
                reps="6-8",
                weight="115 lbs",
            ),
            ParsedExercise(
                name="Lateral Raises",
                sets=3,
                reps="12-15",
                weight="20 lbs",
            ),
            ParsedExercise(
                name="Tricep Pushdowns",
                sets=3,
                reps="10-12",
            ),
        ],
        raw_text="[Mock OCR - actual text would be extracted from image]",
    )


async def process_menu_ocr(
    db: AsyncSession,
    user_id: str,
    image_data: bytes,
    filename: str,
) -> OcrJobResponse:
    """
    Process menu image with OCR.
    
    For MVP: synchronous processing with mock provider.
    Future: async processing with Celery worker.
    """
    ensure_upload_dir()

    # Save image
    file_ext = os.path.splitext(filename)[1] or ".jpg"
    file_id = str(uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(image_data)

    # Create job record
    job = OcrJob(
        user_id=user_id,
        type="menu",
        status="processing",
        input_path=file_path,
    )
    db.add(job)
    await db.flush()

    try:
        # Process with mock provider (synchronous for MVP)
        result = mock_menu_ocr(file_path)

        job.status = "completed"
        job.result = result.model_dump()
        job.completed_at = datetime.now(UTC)

    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.completed_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(job)

    return OcrJobResponse.model_validate(job)


async def process_workout_ocr(
    db: AsyncSession,
    user_id: str,
    image_data: bytes,
    filename: str,
) -> OcrJobResponse:
    """
    Process workout image with OCR.
    
    For MVP: synchronous processing with mock provider.
    Future: async processing with Celery worker.
    """
    ensure_upload_dir()

    # Save image
    file_ext = os.path.splitext(filename)[1] or ".jpg"
    file_id = str(uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(image_data)

    # Create job record
    job = OcrJob(
        user_id=user_id,
        type="workout",
        status="processing",
        input_path=file_path,
    )
    db.add(job)
    await db.flush()

    try:
        # Process with mock provider (synchronous for MVP)
        result = mock_workout_ocr(file_path)

        job.status = "completed"
        job.result = result.model_dump()
        job.completed_at = datetime.now(UTC)

    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.completed_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(job)

    return OcrJobResponse.model_validate(job)


async def get_ocr_job(
    db: AsyncSession,
    user_id: str,
    job_id: str,
) -> OcrJobResponse:
    """Get OCR job status and result."""
    result = await db.execute(
        select(OcrJob).where(OcrJob.id == job_id, OcrJob.user_id == user_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("OCR job not found")

    return OcrJobResponse.model_validate(job)


