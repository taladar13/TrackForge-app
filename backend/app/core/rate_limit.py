"""Redis-based rate limiting."""

from datetime import datetime
from typing import Callable

from fastapi import Request, Response
from redis.asyncio import Redis

from app.core.config import settings
from app.core.errors import RateLimitError

# Redis client - initialized on app startup
redis_client: Redis | None = None


async def init_redis() -> None:
    """Initialize Redis connection."""
    global redis_client
    redis_client = Redis.from_url(str(settings.redis_url), decode_responses=True)


async def close_redis() -> None:
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int,
) -> tuple[bool, int, int]:
    """
    Check if rate limit is exceeded using sliding window.
    
    Returns:
        Tuple of (is_allowed, remaining, reset_seconds)
    """
    if not redis_client:
        # If Redis is not available, allow the request
        return True, max_requests, window_seconds

    now = datetime.now().timestamp()
    window_start = now - window_seconds

    # Use Redis pipeline for atomic operations
    async with redis_client.pipeline() as pipe:
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        # Count current entries
        pipe.zcard(key)
        # Add current request
        pipe.zadd(key, {str(now): now})
        # Set expiry on the key
        pipe.expire(key, window_seconds)

        results = await pipe.execute()
        current_count = results[1]

    remaining = max(0, max_requests - current_count - 1)
    is_allowed = current_count < max_requests

    return is_allowed, remaining, window_seconds


def rate_limit(
    max_requests: int | None = None,
    window_seconds: int | None = None,
    key_func: Callable[[Request], str] | None = None,
):
    """
    Rate limiting dependency factory.
    
    Args:
        max_requests: Maximum requests allowed in window (default from settings)
        window_seconds: Window size in seconds (default from settings)
        key_func: Function to generate rate limit key from request
    """
    _max_requests = max_requests or settings.rate_limit_requests
    _window_seconds = window_seconds or settings.rate_limit_window_seconds

    async def rate_limit_dependency(request: Request, response: Response) -> None:
        # Generate key based on IP or custom function
        if key_func:
            key = key_func(request)
        else:
            # Use client IP as default key
            client_ip = request.client.host if request.client else "unknown"
            key = f"rate_limit:{request.url.path}:{client_ip}"

        is_allowed, remaining, reset = await check_rate_limit(key, _max_requests, _window_seconds)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(_max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset)

        if not is_allowed:
            raise RateLimitError()

    return rate_limit_dependency

