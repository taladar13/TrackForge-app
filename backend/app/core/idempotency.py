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
    status = Column(String(20), nullable=False, default="processing")  # processing, completed, failed
    response_status = Column(String(10), nullable=True)
    response_body = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


IDEMPOTENCY_KEY_TTL = timedelta(hours=24)


def generate_idempotency_hash(user_id: str, key: str) -> str:
    """Generate a hash from user_id and idempotency key."""
    combined = f"{user_id}:{key}"
    return hashlib.sha256(combined.encode()).hexdigest()


async def get_idempotency_record(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
) -> IdempotencyKey | None:
    """
    Get idempotency record, handling expiration.
    """
    key_hash = generate_idempotency_hash(user_id, idempotency_key)
    
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == key_hash)
    )
    record = result.scalar_one_or_none()

    if record and record.created_at:
        age = datetime.now(UTC) - record.created_at.replace(tzinfo=UTC)
        if age > IDEMPOTENCY_KEY_TTL:
            await db.delete(record)
            await db.flush()
            return None

    return record


async def start_idempotency_request(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
) -> tuple[bool, int | None, dict[str, Any] | None]:
    """
    Try to start an idempotent request.
    
    Returns:
        Tuple of (should_proceed, status_code, response_body)
        If should_proceed is False, status_code and response_body are the cached response.
    """
    record = await get_idempotency_record(db, user_id, idempotency_key)
    
    if record:
        if record.status == "completed":
            return False, int(record.response_status or 200), record.response_body or {}
        if record.status == "processing":
            # Another request is already processing this key
            # In a real app, we might wait or return 409 Conflict
            # For now, let's treat it as "don't proceed"
            return False, 409, {"message": "Request already in progress"}
        
        # If failed, we might want to allow retrying
        if record.status == "failed":
            await db.delete(record)
            await db.flush()

    # Create new record in "processing" state
    key_hash = generate_idempotency_hash(user_id, idempotency_key)
    new_record = IdempotencyKey(
        key=key_hash,
        user_id=user_id,
        status="processing",
    )
    db.add(new_record)
    try:
        await db.flush()
    except Exception:
        # Likely a race condition where record was created between check and insert
        await db.rollback()
        # Re-fetch to see what happened
        record = await get_idempotency_record(db, user_id, idempotency_key)
        if record and record.status == "completed":
            return False, int(record.response_status or 200), record.response_body or {}
        return False, 409, {"message": "Request already in progress or failed"}

    return True, None, None


async def store_idempotency_response(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
    status_code: int,
    response_body: dict[str, Any],
) -> None:
    """Update idempotency record with success response."""
    key_hash = generate_idempotency_hash(user_id, idempotency_key)
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == key_hash)
    )
    record = result.scalar_one_or_none()
    
    if record:
        record.status = "completed"
        record.response_status = str(status_code)
        record.response_body = response_body
        await db.flush()


async def mark_idempotency_failed(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str,
) -> None:
    """Mark idempotency record as failed (allows retry)."""
    key_hash = generate_idempotency_hash(user_id, idempotency_key)
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == key_hash)
    )
    record = result.scalar_one_or_none()
    
    if record:
        record.status = "failed"
        await db.flush()


async def cleanup_expired_idempotency_keys(db: AsyncSession) -> int:
    """Remove expired idempotency keys using a single delete statement."""
    from sqlalchemy import delete
    
    cutoff = datetime.now(UTC) - IDEMPOTENCY_KEY_TTL
    
    result = await db.execute(
        delete(IdempotencyKey).where(IdempotencyKey.created_at < cutoff)
    )
    return result.rowcount

