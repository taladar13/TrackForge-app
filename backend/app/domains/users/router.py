"""Users domain API routes."""

from fastapi import APIRouter

from app.core.deps import CurrentUserId, DbSession
from app.domains.users import service
from app.domains.users.schemas import ProfileResponse, ProfileUpdate, UserWithProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserWithProfile)
async def get_me(
    db: DbSession,
    user_id: CurrentUserId,
) -> UserWithProfile:
    """Get current user with profile."""
    return await service.get_user_with_profile(db, user_id)


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdate,
    db: DbSession,
    user_id: CurrentUserId,
) -> ProfileResponse:
    """Update current user's profile."""
    return await service.update_profile(db, user_id, request)


@router.delete("/me")
async def delete_account(
    db: DbSession,
    user_id: CurrentUserId,
) -> dict[str, str]:
    """Delete current user account and all data."""
    await service.delete_user(db, user_id)
    return {"message": "Account deleted successfully"}
