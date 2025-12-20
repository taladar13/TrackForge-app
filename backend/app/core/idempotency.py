"""Idempotency key handling for offline-safe writes."""

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import Column, DateTime, String, Text, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base


class IdempotencyKey(Base):
    """Store idempotency keys and their responses."""

    __tablename__ = "idempotency_keys"

    key = Column(String(255), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    response_status = Column(String(10), nullable=False)
    response_body = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


IDEMPOTENCY_KEY_TTL = timedelta(hours=24)


def generate_idempotency_hash(user_id: str, key: str) -> str:
    """Generate a hash from user_id and idempotency key."""
    combined = f"{user_id}:{key}"
    return hashlib.sha256(combined.encode()).hexdigest()


async def get_idempotency_response(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
) -> tuple[int, dict[str, Any]] | None:
    """
    Check if we have a cached response for this idempotency key.
    
    Returns:
        Tuple of (status_code, response_body) if found, None otherwise
    """
    key_hash = generate_idempotency_hash(user_id, idempotency_key)
    
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == key_hash)
    )
    record = result.scalar_one_or_none()

    if not record:
        return None

    # Check if expired
    if record.created_at:
        age = datetime.now(UTC) - record.created_at.replace(tzinfo=UTC)
        if age > IDEMPOTENCY_KEY_TTL:
            # Key expired, delete it
            await db.delete(record)
            await db.flush()
            return None

    return int(record.response_status), record.response_body or {}


async def store_idempotency_response(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
    status_code: int,
    response_body: dict[str, Any],
) -> None:
    """Store a response for an idempotency key."""
    key_hash = generate_idempotency_hash(user_id, idempotency_key)

    record = IdempotencyKey(
        key=key_hash,
        user_id=user_id,
        response_status=str(status_code),
        response_body=response_body,
    )

    db.add(record)
    await db.flush()


async def cleanup_expired_idempotency_keys(db: AsyncSession) -> int:
    """Remove expired idempotency keys. Returns count of deleted keys."""
    cutoff = datetime.now(UTC) - IDEMPOTENCY_KEY_TTL
    
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.created_at < cutoff)
    )
    expired = result.scalars().all()
    
    for record in expired:
        await db.delete(record)
    
    await db.flush()
    return len(expired)

