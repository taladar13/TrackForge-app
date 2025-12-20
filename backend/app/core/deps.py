"""FastAPI dependencies."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import UnauthorizedError
from app.core.security import decode_token

# Type alias for database session dependency
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """
    Extract and validate the current user ID from the Authorization header.
    
    Raises:
        UnauthorizedError: If token is missing or invalid
    """
    if not authorization:
        raise UnauthorizedError("Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise UnauthorizedError("Invalid authorization header format")

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        payload = decode_token(token)
    except Exception as e:
        raise UnauthorizedError("Invalid or expired token") from e

    # Check token type
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token: missing subject")

    # Store user_id in request state for later use
    request.state.user_id = user_id
    request.state.token_jti = payload.get("jti")
    
    # Get expiration as datetime
    exp = payload.get("exp")
    if exp:
        request.state.token_expires_at = datetime.fromtimestamp(exp, UTC)
    else:
        request.state.token_expires_at = None

    return user_id


# Type alias for current user dependency
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


def get_idempotency_key(
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> str | None:
    """Extract idempotency key from header."""
    return idempotency_key


IdempotencyKeyHeader = Annotated[str | None, Depends(get_idempotency_key)]

