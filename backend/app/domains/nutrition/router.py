"""Nutrition domain API routes."""

from datetime import date

from fastapi import APIRouter, Query

from app.core.deps import CurrentUserId, DbSession
from app.domains.nutrition import service
from app.domains.nutrition.schemas import (
    DietDayResponse,
    DietPlanCreate,
    DietPlanListResponse,
    DietPlanResponse,
    DietPlanUpdate,
    FoodItemResponse,
    FoodLogCreate,
    FoodLogResponse,
    FoodLogUpdate,
)

router = APIRouter(tags=["nutrition"])


# Diet Plans
@router.get("/diet-plans", response_model=list[DietPlanListResponse])
async def list_diet_plans(
    db: DbSession,
    user_id: CurrentUserId,
) -> list[DietPlanListResponse]:
    """List all diet plans for the current user."""
    return await service.list_diet_plans(db, user_id)


@router.post("/diet-plans", response_model=DietPlanResponse)
async def create_diet_plan(
    request: DietPlanCreate,
    db: DbSession,
    user_id: CurrentUserId,
) -> DietPlanResponse:
    """Create a new diet plan."""
    return await service.create_diet_plan(db, user_id, request)


@router.get("/diet-plans/{plan_id}", response_model=DietPlanResponse)
async def get_diet_plan(
    plan_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> DietPlanResponse:
    """Get a specific diet plan."""
    return await service.get_diet_plan(db, user_id, plan_id)


@router.put("/diet-plans/{plan_id}", response_model=DietPlanResponse)
async def update_diet_plan(
    plan_id: str,
    request: DietPlanUpdate,
    db: DbSession,
    user_id: CurrentUserId,
) -> DietPlanResponse:
    """Update a diet plan."""
    return await service.update_diet_plan(db, user_id, plan_id, request)


@router.delete("/diet-plans/{plan_id}")
async def delete_diet_plan(
    plan_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> dict[str, str]:
    """Delete a diet plan (soft delete)."""
    await service.delete_diet_plan(db, user_id, plan_id)
    return {"message": "Diet plan deleted"}


# Diet Day View
@router.get("/days/{target_date}/diet", response_model=DietDayResponse)
async def get_diet_day(
    target_date: date,
    db: DbSession,
    user_id: CurrentUserId,
) -> DietDayResponse:
    """Get diet day view with plan, logs, and adherence."""
    return await service.get_diet_day(db, user_id, target_date)


# Food Logs
@router.post("/food-logs", response_model=FoodLogResponse)
async def create_food_log(
    request: FoodLogCreate,
    db: DbSession,
    user_id: CurrentUserId,
) -> FoodLogResponse:
    """Log food consumption."""
    return await service.create_food_log(db, user_id, request)


@router.get("/food-logs", response_model=list[FoodLogResponse])
async def list_food_logs(
    db: DbSession,
    user_id: CurrentUserId,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
) -> list[FoodLogResponse]:
    """List food logs in date range."""
    return await service.list_food_logs(db, user_id, from_date, to_date)


@router.patch("/food-logs/{log_id}", response_model=FoodLogResponse)
async def update_food_log(
    log_id: str,
    request: FoodLogUpdate,
    db: DbSession,
    user_id: CurrentUserId,
) -> FoodLogResponse:
    """Update a food log entry."""
    return await service.update_food_log(db, user_id, log_id, request)


@router.delete("/food-logs/{log_id}")
async def delete_food_log(
    log_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> dict[str, str]:
    """Delete a food log entry."""
    await service.delete_food_log(db, user_id, log_id)
    return {"message": "Food log deleted"}


# Food Items Search
@router.get("/food-items/search", response_model=list[FoodItemResponse])
async def search_food_items(
    db: DbSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
) -> list[FoodItemResponse]:
    """Search food items by name."""
    return await service.search_food_items(db, q, limit)
