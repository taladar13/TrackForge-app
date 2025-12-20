"""Progress domain API routes."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Query

from app.core.deps import CurrentUserId, DbSession
from app.domains.progress import service
from app.domains.progress.schemas import (
    BodyMetricCreate,
    BodyMetricResponse,
    DietAdherenceData,
    ProgressSummary,
    TrainingVolumeData,
    WeightDataPoint,
)

router = APIRouter(tags=["progress"])


# Body Metrics
@router.post("/body-metrics", response_model=BodyMetricResponse)
async def log_body_metric(
    request: BodyMetricCreate,
    db: DbSession,
    user_id: CurrentUserId,
) -> BodyMetricResponse:
    """Log body metrics (upsert by date)."""
    return await service.upsert_body_metric(db, user_id, request)


@router.get("/body-metrics", response_model=list[BodyMetricResponse])
async def get_body_metrics(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
) -> list[BodyMetricResponse]:
    """Get body metrics in date range."""
    return await service.get_body_metrics(db, user_id, from_date, to_date)


# Progress Summary
@router.get("/progress/summary", response_model=ProgressSummary)
async def get_progress_summary(
    db: DbSession,
    user_id: CurrentUserId,
    target_date: date = Query(..., alias="date"),
) -> ProgressSummary:
    """Get progress summary for a day."""
    return await service.get_progress_summary(db, user_id, target_date)


# Weight History
@router.get("/progress/weight", response_model=list[WeightDataPoint])
async def get_weight_history(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
) -> list[WeightDataPoint]:
    """Get weight history for graphing."""
    return await service.get_weight_history(db, user_id, from_date, to_date)


# Diet Adherence
@router.get("/progress/diet-adherence", response_model=list[DietAdherenceData])
async def get_diet_adherence(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
) -> list[DietAdherenceData]:
    """Get diet adherence data for date range."""
    return await service.get_diet_adherence(db, user_id, from_date, to_date)


# Training Volume
@router.get("/progress/training-volume", response_model=list[TrainingVolumeData])
async def get_training_volume(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    group_by: Literal["muscle", "exercise"] = Query("muscle"),
) -> list[TrainingVolumeData]:
    """Get training volume data for date range."""
    return await service.get_training_volume(db, user_id, from_date, to_date, group_by)
