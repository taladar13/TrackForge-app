"""Auth domain business logic."""

import hashlib
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.domains.auth.models import RefreshToken, RevokedAccessToken, User
from app.domains.auth.schemas import AuthResponse, AuthTokens, UserResponse
from app.domains.users.models import Profile


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    name: str | None = None,
) -> AuthResponse:
    """Register a new user."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email.lower()))
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered")

    # Create user
    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()

    # Create empty profile
    profile = Profile(user_id=user.id)
    db.add(profile)

    # Generate tokens
    access_token, access_jti, access_exp = create_access_token(user.id)
    refresh_token, refresh_jti, family_id, refresh_exp = create_refresh_token(user.id)

    # Store refresh token
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        family_id=family_id,
        expires_at=refresh_exp,
    )
    db.add(token_record)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=AuthTokens(access_token=access_token, refresh_token=refresh_token),
    )


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> AuthResponse:
    """Authenticate user and return tokens."""
    # Find user
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    # Generate tokens
    access_token, access_jti, access_exp = create_access_token(user.id)
    refresh_token, refresh_jti, family_id, refresh_exp = create_refresh_token(user.id)

    # Store refresh token
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        family_id=family_id,
        expires_at=refresh_exp,
    )
    db.add(token_record)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=AuthTokens(access_token=access_token, refresh_token=refresh_token),
    )


async def refresh_tokens(
    db: AsyncSession,
    refresh_token: str,
) -> AuthTokens:
    """
    Refresh access token using refresh token.
    
    Implements token rotation with reuse detection.
    """
    try:
        payload = decode_token(refresh_token)
    except Exception as e:
        raise UnauthorizedError("Invalid refresh token") from e

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    family_id = payload.get("family")

    if not user_id or not family_id:
        raise UnauthorizedError("Invalid refresh token")

    # Find the refresh token record
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        # Token not found - possible reuse attack
        # Revoke all tokens in this family
        await revoke_token_family(db, family_id)
        raise UnauthorizedError("Invalid refresh token - possible reuse detected")

    if token_record.is_revoked:
        # Token already used - definite reuse attack
        # Revoke all tokens in this family
        await revoke_token_family(db, family_id)
        raise UnauthorizedError("Refresh token reuse detected")

    if token_record.is_expired:
        raise UnauthorizedError("Refresh token expired")

    # Verify user is still active
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedError("User not found or disabled")

    # Revoke old token
    token_record.revoked_at = datetime.now(UTC)

    # Generate new tokens (same family)
    new_access_token, new_access_jti, new_access_exp = create_access_token(user_id)
    new_refresh_token, new_refresh_jti, _, new_refresh_exp = create_refresh_token(
        user_id, family_id=family_id
    )

    # Store new refresh token
    new_token_record = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(new_refresh_token),
        family_id=family_id,
        expires_at=new_refresh_exp,
    )
    db.add(new_token_record)

    return AuthTokens(access_token=new_access_token, refresh_token=new_refresh_token)


async def logout_user(
    db: AsyncSession,
    user_id: str,
    access_jti: str | None = None,
    refresh_token: str | None = None,
    expires_at: datetime | None = None,
) -> None:
    """Logout user by revoking tokens."""
    # Revoke access token if JTI provided
    if access_jti:
        # Check if already revoked
        result = await db.execute(
            select(RevokedAccessToken).where(RevokedAccessToken.jti == access_jti)
        )
        if not result.scalar_one_or_none():
            # If expires_at not provided, default to 15 minutes from now
            if not expires_at:
                expires_at = datetime.now(UTC) + timedelta(minutes=15)

            # Add to revoked list (with expiry for cleanup)
            revoked = RevokedAccessToken(
                jti=access_jti,
                expires_at=expires_at,
            )
            db.add(revoked)

    # Revoke refresh token if provided
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            family_id = payload.get("family")
            if family_id:
                await revoke_token_family(db, family_id)
        except Exception:
            pass  # Token already invalid


async def revoke_token_family(db: AsyncSession, family_id: str) -> None:
    """Revoke all refresh tokens in a family."""
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.family_id == family_id,
            RefreshToken.revoked_at.is_(None),
        )
    )
    tokens = result.scalars().all()

    now = datetime.now(UTC)
    for token in tokens:
        token.revoked_at = now


async def is_access_token_revoked(db: AsyncSession, jti: str) -> bool:
    """Check if an access token has been revoked."""
    result = await db.execute(
        select(RevokedAccessToken).where(RevokedAccessToken.jti == jti)
    )
    return result.scalar_one_or_none() is not None


async def cleanup_expired_revoked_tokens(db: AsyncSession) -> int:
    """Remove expired entries from revoked_access_tokens."""
    from sqlalchemy import delete
    
    now = datetime.now(UTC)
    result = await db.execute(
        delete(RevokedAccessToken).where(RevokedAccessToken.expires_at < now)
    )
    return result.rowcount


async def cleanup_expired_refresh_tokens(db: AsyncSession) -> int:
    """Remove expired refresh tokens (7+ days old)."""
    from sqlalchemy import delete
    
    now = datetime.now(UTC)
    result = await db.execute(
        delete(RefreshToken).where(RefreshToken.expires_at < now)
    )
    return result.rowcount

