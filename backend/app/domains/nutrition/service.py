"""Nutrition domain business logic."""

from datetime import date, datetime, UTC

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.domains.nutrition.models import (
    DietMeal,
    DietMealItem,
    DietPlan,
    FoodItem,
    FoodLog,
)
from app.domains.nutrition.schemas import (
    DietDayResponse,
    DietItemView,
    DietMealView,
    DietPlanCreate,
    DietPlanListResponse,
    DietPlanResponse,
    DietPlanUpdate,
    FoodItemResponse,
    FoodLogCreate,
    FoodLogResponse,
    FoodLogUpdate,
    MacroTotals,
)


def calculate_adherence(actual: MacroTotals, planned: MacroTotals) -> int:
    """Calculate diet adherence as percentage (0-100)."""
    if planned.calories == 0:
        return 100  # No plan = 100% adherence

    deviations = []
    if planned.calories > 0:
        deviations.append(abs((actual.calories - planned.calories) / planned.calories))
    if planned.protein > 0:
        deviations.append(abs((actual.protein - planned.protein) / planned.protein))
    if planned.carbs > 0:
        deviations.append(abs((actual.carbs - planned.carbs) / planned.carbs))
    if planned.fat > 0:
        deviations.append(abs((actual.fat - planned.fat) / planned.fat))

    if not deviations:
        return 100

    avg_deviation = sum(deviations) / len(deviations)
    adherence = max(0, min(100, round((1 - avg_deviation) * 100)))
    return adherence


# Diet Plans
async def list_diet_plans(db: AsyncSession, user_id: str) -> list[DietPlanListResponse]:
    """List all diet plans for a user."""
    result = await db.execute(
        select(DietPlan)
        .where(DietPlan.user_id == user_id, DietPlan.deleted_at.is_(None))
        .order_by(DietPlan.created_at.desc())
    )
    plans = result.scalars().all()
    return [DietPlanListResponse.model_validate(p) for p in plans]


async def get_diet_plan(db: AsyncSession, user_id: str, plan_id: str) -> DietPlanResponse:
    """Get a diet plan with meals and items."""
    result = await db.execute(
        select(DietPlan)
        .options(
            selectinload(DietPlan.meals).selectinload(DietMeal.items).selectinload(DietMealItem.food)
        )
        .where(DietPlan.id == plan_id, DietPlan.user_id == user_id, DietPlan.deleted_at.is_(None))
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise NotFoundError("Diet plan not found")

    return DietPlanResponse.model_validate(plan)


async def create_diet_plan(
    db: AsyncSession,
    user_id: str,
    data: DietPlanCreate,
) -> DietPlanResponse:
    """Create a new diet plan."""
    # Validate days of week
    for day in data.days_of_week:
        if day < 0 or day > 6:
            raise ValidationError("Days of week must be 0-6")

    plan = DietPlan(
        user_id=user_id,
        name=data.name,
        days_of_week=data.days_of_week,
    )
    db.add(plan)
    await db.flush()

    # Create meals
    for i, meal_data in enumerate(data.meals):
        meal = DietMeal(
            plan_id=plan.id,
            name=meal_data.name,
            time=meal_data.time,
            sort_order=i,
        )
        db.add(meal)
        await db.flush()

        # Create meal items
        for item_data in meal_data.items:
            # Verify food exists
            food_result = await db.execute(
                select(FoodItem).where(FoodItem.id == item_data.food_id)
            )
            if not food_result.scalar_one_or_none():
                raise NotFoundError(f"Food item {item_data.food_id} not found")

            item = DietMealItem(
                meal_id=meal.id,
                food_id=item_data.food_id,
                planned_quantity=item_data.planned_quantity,
            )
            db.add(item)

    await db.flush()
    return await get_diet_plan(db, user_id, plan.id)


async def update_diet_plan(
    db: AsyncSession,
    user_id: str,
    plan_id: str,
    data: DietPlanUpdate,
) -> DietPlanResponse:
    """Update a diet plan."""
    result = await db.execute(
        select(DietPlan).where(
            DietPlan.id == plan_id,
            DietPlan.user_id == user_id,
            DietPlan.deleted_at.is_(None),
        )
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise NotFoundError("Diet plan not found")

    # Update simple fields
    if data.name is not None:
        plan.name = data.name
    if data.days_of_week is not None:
        plan.days_of_week = data.days_of_week
    if data.is_current is not None:
        # If setting as current, unset others
        if data.is_current:
            await db.execute(
                select(DietPlan)
                .where(DietPlan.user_id == user_id, DietPlan.is_current == True)
            )
            other_plans = (await db.execute(
                select(DietPlan).where(
                    DietPlan.user_id == user_id,
                    DietPlan.is_current == True,
                    DietPlan.id != plan_id,
                )
            )).scalars().all()
            for other in other_plans:
                other.is_current = False
        plan.is_current = data.is_current

    # Update meals if provided (replace all)
    if data.meals is not None:
        # Delete existing meals (cascade deletes items)
        for meal in plan.meals:
            await db.delete(meal)

        # Create new meals
        for i, meal_data in enumerate(data.meals):
            meal = DietMeal(
                plan_id=plan.id,
                name=meal_data.name,
                time=meal_data.time,
                sort_order=i,
            )
            db.add(meal)
            await db.flush()

            for item_data in meal_data.items:
                item = DietMealItem(
                    meal_id=meal.id,
                    food_id=item_data.food_id,
                    planned_quantity=item_data.planned_quantity,
                )
                db.add(item)

    await db.flush()
    return await get_diet_plan(db, user_id, plan_id)


async def delete_diet_plan(db: AsyncSession, user_id: str, plan_id: str) -> None:
    """Soft delete a diet plan."""
    result = await db.execute(
        select(DietPlan).where(
            DietPlan.id == plan_id,
            DietPlan.user_id == user_id,
            DietPlan.deleted_at.is_(None),
        )
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise NotFoundError("Diet plan not found")

    plan.deleted_at = datetime.now(UTC)


# Food Items
async def search_food_items(
    db: AsyncSession,
    query: str,
    limit: int = 20,
) -> list[FoodItemResponse]:
    """Search food items by name."""
    result = await db.execute(
        select(FoodItem)
        .where(FoodItem.name.ilike(f"%{query}%"))
        .limit(limit)
    )
    items = result.scalars().all()
    return [FoodItemResponse.model_validate(item) for item in items]


# Food Logs
async def create_food_log(
    db: AsyncSession,
    user_id: str,
    data: FoodLogCreate,
) -> FoodLogResponse:
    """Create a food log entry."""
    # Verify food exists
    food_result = await db.execute(select(FoodItem).where(FoodItem.id == data.food_id))
    food = food_result.scalar_one_or_none()
    if not food:
        raise NotFoundError("Food item not found")

    # For planned items, check if already logged (upsert)
    if data.meal_id and not data.is_ad_hoc:
        existing_result = await db.execute(
            select(FoodLog).where(
                FoodLog.user_id == user_id,
                FoodLog.date == data.date,
                FoodLog.meal_id == data.meal_id,
                FoodLog.food_id == data.food_id,
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            existing.quantity = data.quantity
            await db.flush()
            
            # Reload with food relationship
            result = await db.execute(
                select(FoodLog).options(selectinload(FoodLog.food)).where(FoodLog.id == existing.id)
            )
            existing = result.scalar_one()
            return FoodLogResponse.model_validate(existing)

    log = FoodLog(
        user_id=user_id,
        food_id=data.food_id,
        date=data.date,
        meal_id=data.meal_id,
        quantity=data.quantity,
        is_ad_hoc=data.is_ad_hoc,
    )
    db.add(log)
    await db.flush()

    # Reload with food relationship
    result = await db.execute(
        select(FoodLog).options(selectinload(FoodLog.food)).where(FoodLog.id == log.id)
    )
    log = result.scalar_one()
    return FoodLogResponse.model_validate(log)


async def update_food_log(
    db: AsyncSession,
    user_id: str,
    log_id: str,
    data: FoodLogUpdate,
) -> FoodLogResponse:
    """Update a food log entry."""
    result = await db.execute(
        select(FoodLog)
        .options(selectinload(FoodLog.food))
        .where(FoodLog.id == log_id, FoodLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()

    if not log:
        raise NotFoundError("Food log not found")

    if data.quantity is not None:
        log.quantity = data.quantity

    await db.flush()
    return FoodLogResponse.model_validate(log)


async def delete_food_log(db: AsyncSession, user_id: str, log_id: str) -> None:
    """Delete a food log entry."""
    result = await db.execute(
        select(FoodLog).where(FoodLog.id == log_id, FoodLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()

    if not log:
        raise NotFoundError("Food log not found")

    await db.delete(log)


async def list_food_logs(
    db: AsyncSession,
    user_id: str,
    from_date: date,
    to_date: date,
) -> list[FoodLogResponse]:
    """List food logs in date range."""
    result = await db.execute(
        select(FoodLog)
        .options(selectinload(FoodLog.food))
        .where(
            FoodLog.user_id == user_id,
            FoodLog.date >= from_date,
            FoodLog.date <= to_date,
        )
        .order_by(FoodLog.date, FoodLog.created_at)
    )
    logs = result.scalars().all()
    return [FoodLogResponse.model_validate(log) for log in logs]


# Diet Day View
async def get_diet_day(
    db: AsyncSession,
    user_id: str,
    target_date: date,
) -> DietDayResponse:
    """Get diet day view with plan, logs, and adherence."""
    day_of_week = target_date.weekday()  # 0=Monday in Python, need to convert
    # Convert to 0=Sunday format
    day_of_week = (day_of_week + 1) % 7

    # Find applicable plan for this day
    result = await db.execute(
        select(DietPlan)
        .options(
            selectinload(DietPlan.meals).selectinload(DietMeal.items).selectinload(DietMealItem.food)
        )
        .where(
            DietPlan.user_id == user_id,
            DietPlan.deleted_at.is_(None),
            DietPlan.days_of_week.contains([day_of_week]),
        )
        .order_by(DietPlan.is_current.desc(), DietPlan.updated_at.desc())
        .limit(1)
    )
    plan = result.scalar_one_or_none()

    # Get all food logs for this day
    logs_result = await db.execute(
        select(FoodLog)
        .options(selectinload(FoodLog.food))
        .where(FoodLog.user_id == user_id, FoodLog.date == target_date)
    )
    logs = {(log.meal_id, log.food_id): log for log in logs_result.scalars().all()}
    ad_hoc_logs = [log for log in logs.values() if log.is_ad_hoc]

    # Build meal views with eaten status
    meals: list[DietMealView] = []
    planned_totals = MacroTotals()
    actual_totals = MacroTotals()

    if plan:
        for meal in sorted(plan.meals, key=lambda m: m.sort_order):
            items: list[DietItemView] = []
            for item in meal.items:
                log = logs.get((meal.id, item.food_id))
                is_eaten = log is not None
                actual_qty = log.quantity if log else None

                items.append(DietItemView(
                    id=item.id,
                    food_id=item.food_id,
                    food=FoodItemResponse.model_validate(item.food),
                    planned_quantity=item.planned_quantity,
                    actual_quantity=actual_qty,
                    is_eaten=is_eaten,
                    meal_id=meal.id,
                ))

                # Calculate planned totals
                qty_factor = item.planned_quantity / 100  # nutrients are per 100g
                planned_totals.calories += item.food.calories * qty_factor
                planned_totals.protein += item.food.protein * qty_factor
                planned_totals.carbs += item.food.carbs * qty_factor
                planned_totals.fat += item.food.fat * qty_factor

                # Calculate actual totals
                if is_eaten and actual_qty:
                    actual_factor = actual_qty / 100
                    actual_totals.calories += item.food.calories * actual_factor
                    actual_totals.protein += item.food.protein * actual_factor
                    actual_totals.carbs += item.food.carbs * actual_factor
                    actual_totals.fat += item.food.fat * actual_factor

            meals.append(DietMealView(
                id=meal.id,
                name=meal.name,
                time=meal.time,
                items=items,
            ))

    # Add ad-hoc items to actual totals
    for log in ad_hoc_logs:
        factor = log.quantity / 100
        actual_totals.calories += log.food.calories * factor
        actual_totals.protein += log.food.protein * factor
        actual_totals.carbs += log.food.carbs * factor
        actual_totals.fat += log.food.fat * factor

    adherence = calculate_adherence(actual_totals, planned_totals)

    return DietDayResponse(
        date=target_date,
        plan_id=plan.id if plan else None,
        meals=meals,
        ad_hoc_items=[FoodLogResponse.model_validate(log) for log in ad_hoc_logs],
        totals={"planned": planned_totals, "actual": actual_totals},
        adherence=adherence,
    )

