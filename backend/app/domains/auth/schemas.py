"""Auth domain Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Registration request schema."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = None


class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Token refresh request schema."""

    refresh_token: str


class AuthTokens(BaseModel):
    """JWT token pair."""

    access_token: str
    refresh_token: str


class UserResponse(BaseModel):
    """User information response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    """Authentication response with user and tokens."""

    user: UserResponse
    tokens: AuthTokens


