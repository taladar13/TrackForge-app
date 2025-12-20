"""Nutrition domain models."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid4())


class FoodItem(Base):
    """Food item with nutritional information."""

    __tablename__ = "food_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(255), nullable=True)
    calories = Column(Float, nullable=False)  # per 100g
    protein = Column(Float, nullable=False)  # per 100g
    carbs = Column(Float, nullable=False)  # per 100g
    fat = Column(Float, nullable=False)  # per 100g
    fiber = Column(Float, nullable=True)  # per 100g
    unit = Column(String(20), nullable=False, default="g")  # g, ml, piece
    source = Column(String(50), nullable=True)  # internal, external API name
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class DietPlan(Base):
    """Diet plan with meals for specific days of the week."""

    __tablename__ = "diet_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    days_of_week = Column(ARRAY(Integer), nullable=False)  # 0=Sunday, 1=Monday, etc.
    is_current = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    meals = relationship("DietMeal", back_populates="plan", cascade="all, delete-orphan")


class DietMeal(Base):
    """Meal within a diet plan."""

    __tablename__ = "diet_meals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("diet_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Breakfast, Lunch, etc.
    time = Column(String(5), nullable=True)  # HH:MM format
    sort_order = Column(Integer, nullable=False, default=0)

    # Relationships
    plan = relationship("DietPlan", back_populates="meals")
    items = relationship("DietMealItem", back_populates="meal", cascade="all, delete-orphan")


class DietMealItem(Base):
    """Food item within a meal."""

    __tablename__ = "diet_meal_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    meal_id = Column(String(36), ForeignKey("diet_meals.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(String(36), ForeignKey("food_items.id"), nullable=False)
    planned_quantity = Column(Float, nullable=False)  # in food's unit

    # Relationships
    meal = relationship("DietMeal", back_populates="items")
    food = relationship("FoodItem")


class FoodLog(Base):
    """Logged food consumption."""

    __tablename__ = "food_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(String(36), ForeignKey("food_items.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    meal_id = Column(String(36), ForeignKey("diet_meals.id", ondelete="SET NULL"), nullable=True)  # null for ad-hoc
    quantity = Column(Float, nullable=False)
    is_ad_hoc = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Unique constraint for planned items (one log per meal item per day)
    __table_args__ = (
        UniqueConstraint("user_id", "date", "meal_id", "food_id", name="uq_food_log_planned"),
    )

    # Relationships
    food = relationship("FoodItem")


