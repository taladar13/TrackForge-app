"""Auth domain API routes."""

from fastapi import APIRouter, Depends, Request, Response

from app.core.deps import CurrentUserId, DbSession
from app.core.rate_limit import rate_limit
from app.domains.auth import service
from app.domains.auth.schemas import (
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60))],
)
async def register(
    request: RegisterRequest,
    db: DbSession,
) -> AuthResponse:
    """Register a new user account."""
    return await service.register_user(
        db=db,
        email=request.email,
        password=request.password,
        name=request.name,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)
async def login(
    request: LoginRequest,
    db: DbSession,
) -> AuthResponse:
    """Authenticate and get access tokens."""
    return await service.login_user(
        db=db,
        email=request.email,
        password=request.password,
    )


@router.post(
    "/refresh",
    response_model=AuthTokens,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)
async def refresh(
    request: RefreshRequest,
    db: DbSession,
) -> AuthTokens:
    """Refresh access token using refresh token."""
    return await service.refresh_tokens(
        db=db,
        refresh_token=request.refresh_token,
    )


@router.post("/logout")
async def logout(
    request: Request,
    db: DbSession,
    user_id: CurrentUserId,
) -> dict[str, str]:
    """Logout and revoke tokens."""
    # Get JTI and expiry from the current request's token
    access_jti = getattr(request.state, "token_jti", None)
    expires_at = getattr(request.state, "token_expires_at", None)

    await service.logout_user(
        db=db,
        user_id=user_id,
        access_jti=access_jti,
        expires_at=expires_at,
    )

    return {"message": "Successfully logged out"}
