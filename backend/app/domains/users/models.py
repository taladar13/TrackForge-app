"""Users domain models."""

from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Profile(Base):
    """User profile with fitness-related settings."""

    __tablename__ = "profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(10), nullable=True)  # male, female, other
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    activity_level = Column(String(20), nullable=True)  # sedentary, light, moderate, active, very_active
    goal = Column(String(20), nullable=True)  # lose, maintain, gain
    units = Column(JSONB, nullable=True, default=dict)  # { weight: "kg"|"lb", height: "cm"|"ft", energy: "kcal"|"kJ" }
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    user = relationship("User", back_populates="profile")


