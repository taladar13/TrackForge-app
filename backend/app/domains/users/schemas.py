"""Users domain Pydantic schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UnitPreferences(BaseModel):
    """User's preferred units for measurements."""

    weight: Literal["kg", "lb"] = "kg"
    height: Literal["cm", "ft"] = "cm"
    energy: Literal["kcal", "kJ"] = "kcal"


class ProfileResponse(BaseModel):
    """Profile information response."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    age: int | None = None
    sex: Literal["male", "female", "other"] | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None
    goal: Literal["lose", "maintain", "gain"] | None = None
    units: UnitPreferences | None = None


class ProfileUpdate(BaseModel):
    """Profile update request."""

    age: int | None = Field(None, ge=13, le=120)
    sex: Literal["male", "female", "other"] | None = None
    height_cm: float | None = Field(None, gt=0, le=300)
    weight_kg: float | None = Field(None, gt=0, le=500)
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None
    goal: Literal["lose", "maintain", "gain"] | None = None
    units: UnitPreferences | None = None


class UserWithProfile(BaseModel):
    """User with profile information."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    created_at: datetime
    profile: ProfileResponse | None = None


