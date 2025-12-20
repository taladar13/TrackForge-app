"""Progress domain business logic."""

from collections import defaultdict
from datetime import date, timedelta
from typing import Literal

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError
from app.domains.nutrition.models import DietPlan, DietMeal, DietMealItem, FoodLog
from app.domains.nutrition.service import calculate_adherence
from app.domains.nutrition.schemas import MacroTotals
from app.domains.progress.models import BodyMetric
from app.domains.progress.schemas import (
    BodyMetricCreate,
    BodyMetricResponse,
    DietAdherenceData,
    ProgressSummary,
    TrainingVolumeData,
    WeightDataPoint,
)
from app.domains.workouts.models import Exercise, WorkoutSession, WorkoutSet


def get_adherence_status(adherence: int) -> Literal["green", "yellow", "red"]:
    """Get adherence status color."""
    if adherence >= 90:
        return "green"
    if adherence >= 70:
        return "yellow"
    return "red"


# Body Metrics
async def upsert_body_metric(
    db: AsyncSession,
    user_id: str,
    data: BodyMetricCreate,
) -> BodyMetricResponse:
    """Create or update body metric for a date (upsert)."""
    # Check for existing metric on this date
    result = await db.execute(
        select(BodyMetric).where(
            BodyMetric.user_id == user_id,
            BodyMetric.date == data.date,
        )
    )
    metric = result.scalar_one_or_none()

    if metric:
        # Update existing
        if data.weight is not None:
            metric.weight = data.weight
        if data.body_fat is not None:
            metric.body_fat = data.body_fat
        if data.muscle_mass is not None:
            metric.muscle_mass = data.muscle_mass
    else:
        # Create new
        metric = BodyMetric(
            user_id=user_id,
            date=data.date,
            weight=data.weight,
            body_fat=data.body_fat,
            muscle_mass=data.muscle_mass,
        )
        db.add(metric)

    await db.flush()
    await db.refresh(metric)
    return BodyMetricResponse.model_validate(metric)


async def get_body_metrics(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
) -> list[BodyMetricResponse]:
    """Get body metrics in date range."""
    result = await db.execute(
        select(BodyMetric)
        .where(
            BodyMetric.user_id == user_id,
            BodyMetric.date >= from_date,
            BodyMetric.date <= to_date,
        )
        .order_by(BodyMetric.date)
    )
    metrics = result.scalars().all()
    return [BodyMetricResponse.model_validate(m) for m in metrics]


# Weight History
async def get_weight_history(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
) -> list[WeightDataPoint]:
    """Get weight history for graphing."""
    result = await db.execute(
        select(BodyMetric)
        .where(
            BodyMetric.user_id == user_id,
            BodyMetric.date >= from_date,
            BodyMetric.date <= to_date,
            BodyMetric.weight.isnot(None),
        )
        .order_by(BodyMetric.date)
    )
    metrics = result.scalars().all()
    return [WeightDataPoint(date=m.date, weight=m.weight) for m in metrics]


# Progress Summary
async def get_progress_summary(
    db: AsyncSession,
    user_id: str,
    target_date: date,
) -> ProgressSummary:
    """Get progress summary for a day."""
    # Get weight
    metric_result = await db.execute(
        select(BodyMetric).where(
            BodyMetric.user_id == user_id,
            BodyMetric.date == target_date,
        )
    )
    metric = metric_result.scalar_one_or_none()
    weight = metric.weight if metric else None

    # Get diet adherence
    adherence = await _calculate_day_adherence(db, user_id, target_date)

    # Check if workout was completed
    session_result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.sets))
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.date == target_date,
        )
    )
    sessions = session_result.scalars().all()

    workout_completed = len(sessions) > 0
    total_volume = sum(
        s.weight * s.reps
        for session in sessions
        for s in session.sets
        if s.completed
    ) if sessions else None

    return ProgressSummary(
        date=target_date,
        weight=weight,
        diet_adherence=adherence,
        workout_completed=workout_completed,
        total_volume=total_volume,
    )


# Diet Adherence
async def get_diet_adherence(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
) -> list[DietAdherenceData]:
    """Get diet adherence data for date range."""
    result = []
    current = from_date

    while current <= to_date:
        data = await _get_day_diet_data(db, user_id, current)
        if data:
            result.append(data)
        current += timedelta(days=1)

    return result


async def _calculate_day_adherence(
    db: AsyncSession,
    user_id: str,
    target_date: date,
) -> int | None:
    """Calculate adherence for a single day."""
    data = await _get_day_diet_data(db, user_id, target_date)
    return data.adherence if data else None


async def _get_day_diet_data(
    db: AsyncSession,
    user_id: str,
    target_date: date,
) -> DietAdherenceData | None:
    """Get diet data for a single day."""
    day_of_week = (target_date.weekday() + 1) % 7  # 0=Sunday

    # Find applicable plan
    plan_result = await db.execute(
        select(DietPlan)
        .options(
            selectinload(DietPlan.meals).selectinload(DietMeal.items).selectinload(DietMealItem.food)
        )
        .where(
            DietPlan.user_id == user_id,
            DietPlan.deleted_at.is_(None),
            DietPlan.days_of_week.contains([day_of_week]),
        )
        .order_by(DietPlan.is_current.desc())
        .limit(1)
    )
    plan = plan_result.scalar_one_or_none()

    # Get food logs
    logs_result = await db.execute(
        select(FoodLog)
        .options(selectinload(FoodLog.food))
        .where(FoodLog.user_id == user_id, FoodLog.date == target_date)
    )
    logs = logs_result.scalars().all()

    # Calculate planned totals
    planned = MacroTotals()
    if plan:
        for meal in plan.meals:
            for item in meal.items:
                factor = item.planned_quantity / 100
                planned.calories += item.food.calories * factor
                planned.protein += item.food.protein * factor
                planned.carbs += item.food.carbs * factor
                planned.fat += item.food.fat * factor

    # Calculate actual totals
    actual = MacroTotals()
    for log in logs:
        factor = log.quantity / 100
        actual.calories += log.food.calories * factor
        actual.protein += log.food.protein * factor
        actual.carbs += log.food.carbs * factor
        actual.fat += log.food.fat * factor

    # No data for this day
    if planned.calories == 0 and actual.calories == 0:
        return None

    adherence = calculate_adherence(actual, planned)

    return DietAdherenceData(
        date=target_date,
        calories=actual.calories,
        protein=actual.protein,
        carbs=actual.carbs,
        fat=actual.fat,
        target_calories=planned.calories,
        adherence=adherence,
        status=get_adherence_status(adherence),
    )


# Training Volume
async def get_training_volume(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
    group_by: Literal["muscle", "exercise"] = "muscle",
) -> list[TrainingVolumeData]:
    """Get training volume data for date range."""
    # Get all sessions in range with sets and exercises
    result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.date >= from_date,
            WorkoutSession.date <= to_date,
        )
        .order_by(WorkoutSession.date)
    )
    sessions = result.scalars().all()

    # Group by date
    sessions_by_date: dict[date, list[WorkoutSession]] = defaultdict(list)
    for session in sessions:
        sessions_by_date[session.date].append(session)

    volume_data = []
    current = from_date

    while current <= to_date:
        day_sessions = sessions_by_date.get(current, [])

        if day_sessions:
            total_volume = 0.0
            by_muscle: dict[str, float] = defaultdict(float)
            by_exercise: dict[str, float] = defaultdict(float)

            for session in day_sessions:
                for workout_set in session.sets:
                    if not workout_set.completed:
                        continue

                    volume = workout_set.weight * workout_set.reps
                    total_volume += volume

                    # Group by exercise
                    by_exercise[workout_set.exercise_id] += volume

                    # Group by muscle
                    if workout_set.exercise and workout_set.exercise.muscle_groups:
                        for muscle in workout_set.exercise.muscle_groups:
                            by_muscle[muscle] += volume

            volume_data.append(TrainingVolumeData(
                date=current,
                total_volume=total_volume,
                volume_by_muscle_group=dict(by_muscle),
                volume_by_exercise=dict(by_exercise),
            ))

        current += timedelta(days=1)

    return volume_data


