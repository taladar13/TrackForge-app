"""Security utilities: password hashing and JWT tokens."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.errors import UnauthorizedError

# Password hashing with Argon2 primary, bcrypt fallback
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__time_cost=3,        # iterations
    argon2__memory_cost=65536,  # 64 MiB
    argon2__parallelism=4,      # threads
    argon2__type="id",          # Argon2id (hybrid, recommended)
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    additional_claims: dict[str, Any] | None = None,
) -> tuple[str, str, datetime]:
    """
    Create a JWT access token.
    
    Returns:
        Tuple of (token, jti, expires_at)
    """
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    jti = str(uuid4())
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "nbf": now,
        "jti": jti,
        "type": "access",
        "iss": settings.token_issuer,
        "aud": settings.token_audience, 
    }
    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(to_encode, settings.access_token_secret_key, algorithm=settings.algorithm)
    return encoded_jwt, jti, expire


def create_refresh_token(
    subject: str,
    family_id: str | None = None,
    expires_delta: timedelta | None = None,
) -> tuple[str, str, str, datetime]:
    """
    Create a JWT refresh token.
    
    Returns:
        Tuple of (token, jti, family_id, expires_at)
    """
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.refresh_token_expire_days)

    jti = str(uuid4())
    family = family_id or str(uuid4())

    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "nbf": now,
        "jti": jti,
        "family": family,
        "type": "refresh",
        "iss": settings.token_issuer,
        "aud": settings.token_audience,
    }

    encoded_jwt = jwt.encode(to_encode, settings.refresh_token_secret_key, algorithm=settings.algorithm)
    return encoded_jwt, jti, family, expire


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.
    
    Raises:
        UnauthorizedError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
        settings.secret_key,algorithms=[settings.algorithm],
        issuer=settings.token_issuer, 
        audience=settings.token_audience,)
        return payload
    except JWTError as e:
        raise UnauthorizedError("Invalid or expired token") from e


def get_token_subject(token: str) -> str:
    """Extract subject (user_id) from token."""
    payload = decode_token(token)
    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Invalid token: missing subject")
    return subject


def get_token_jti(token: str) -> str:
    """Extract JTI from token."""
    payload = decode_token(token)
    jti = payload.get("jti")
    if not jti:
        raise UnauthorizedError("Invalid token: missing jti")
    return jti

