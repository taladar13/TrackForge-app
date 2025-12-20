"""Nutrition domain Pydantic schemas."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Food Items
class FoodItemResponse(BaseModel):
    """Food item response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    brand: str | None = None
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float | None = None
    unit: str


# Diet Plans
class DietMealItemCreate(BaseModel):
    """Create diet meal item request."""

    food_id: str
    planned_quantity: float = Field(gt=0)


class DietMealCreate(BaseModel):
    """Create diet meal request."""

    name: str = Field(max_length=100)
    time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")  # HH:MM
    items: list[DietMealItemCreate] = []


class DietPlanCreate(BaseModel):
    """Create diet plan request."""

    name: str = Field(max_length=255)
    days_of_week: list[int] = Field(min_length=1, max_length=7)  # 0-6
    meals: list[DietMealCreate] = []


class DietPlanUpdate(BaseModel):
    """Update diet plan request."""

    name: str | None = Field(None, max_length=255)
    days_of_week: list[int] | None = None
    meals: list[DietMealCreate] | None = None
    is_current: bool | None = None


class DietMealItemResponse(BaseModel):
    """Diet meal item response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    food_id: str
    food: FoodItemResponse
    planned_quantity: float


class DietMealResponse(BaseModel):
    """Diet meal response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    time: str | None = None
    sort_order: int
    items: list[DietMealItemResponse] = []


class DietPlanResponse(BaseModel):
    """Diet plan response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    days_of_week: list[int]
    is_current: bool
    meals: list[DietMealResponse] = []
    created_at: datetime
    updated_at: datetime


class DietPlanListResponse(BaseModel):
    """Diet plan list item (without meals)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    days_of_week: list[int]
    is_current: bool
    created_at: datetime
    updated_at: datetime


# Food Logs
class FoodLogCreate(BaseModel):
    """Create food log request."""

    food_id: str
    date: date
    quantity: float = Field(gt=0)
    meal_id: str | None = None
    is_ad_hoc: bool = False


class FoodLogUpdate(BaseModel):
    """Update food log request."""

    quantity: float | None = Field(None, gt=0)
    is_eaten: bool | None = None  # For toggling planned items


class FoodLogResponse(BaseModel):
    """Food log response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    food_id: str
    food: FoodItemResponse
    date: date
    meal_id: str | None = None
    quantity: float
    is_ad_hoc: bool
    created_at: datetime


# Diet Day View
class MacroTotals(BaseModel):
    """Macro nutrient totals."""

    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class DietItemView(BaseModel):
    """Diet item in day view."""

    id: str
    food_id: str
    food: FoodItemResponse
    planned_quantity: float
    actual_quantity: float | None = None
    is_eaten: bool = False
    meal_id: str


class DietMealView(BaseModel):
    """Diet meal in day view."""

    id: str
    name: str
    time: str | None = None
    items: list[DietItemView] = []


class DietDayResponse(BaseModel):
    """Diet day view response."""

    date: date
    plan_id: str | None = None
    meals: list[DietMealView] = []
    ad_hoc_items: list[FoodLogResponse] = []
    totals: dict[str, MacroTotals]  # { "planned": ..., "actual": ... }
    adherence: int  # 0-100


