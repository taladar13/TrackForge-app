"""Background tasks for application maintenance."""

import asyncio
import logging
from datetime import UTC, datetime

from app.core.database import get_db_context
from app.core.idempotency import cleanup_expired_idempotency_keys
from app.domains.auth.service import cleanup_expired_revoked_tokens

logger = logging.getLogger(__name__)


async def cleanup_task() -> None:
    """
    Background task that periodically cleans up expired data.
    """
    while True:
        try:
            logger.info("Starting background cleanup")
            async with get_db_context() as db:
                # Cleanup idempotency keys
                deleted_keys = await cleanup_expired_idempotency_keys(db)
                if deleted_keys > 0:
                    logger.info(f"Deleted {deleted_keys} expired idempotency keys")

                # Cleanup revoked tokens
                deleted_tokens = await cleanup_expired_revoked_tokens(db)
                if deleted_tokens > 0:
                    logger.info(f"Deleted {deleted_tokens} expired revoked tokens")

            logger.info("Background cleanup completed")
        except Exception as e:
            logger.error(f"Error in background cleanup task: {e}")

        # Run every hour
        await asyncio.sleep(3600)


def start_background_tasks() -> asyncio.Task:
    """Start all background maintenance tasks."""
    return asyncio.create_task(cleanup_task())
