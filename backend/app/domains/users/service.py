"""Users domain business logic."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError
from app.domains.auth.models import User
from app.domains.users.models import Profile
from app.domains.users.schemas import ProfileResponse, ProfileUpdate, UserWithProfile


async def get_user_with_profile(db: AsyncSession, user_id: str) -> UserWithProfile:
    """Get user with their profile."""
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User not found")

    return UserWithProfile.model_validate(user)


async def update_profile(
    db: AsyncSession,
    user_id: str,
    updates: ProfileUpdate,
) -> ProfileResponse:
    """Update user profile."""
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        # Create profile if it doesn't exist
        profile = Profile(user_id=user_id)
        db.add(profile)

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "units" and value is not None:
            # Convert Pydantic model to dict for JSONB
            setattr(profile, field, value if isinstance(value, dict) else value.model_dump())
        else:
            setattr(profile, field, value)

    await db.flush()
    await db.refresh(profile)

    return ProfileResponse.model_validate(profile)


async def delete_user(db: AsyncSession, user_id: str) -> None:
    """
    Hard delete user and all associated data.
    
    SQLAlchemy cascade will handle related records.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User not found")

    await db.delete(user)


