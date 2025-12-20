"""Custom exceptions and error handling."""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    message: str
    code: str | None = None
    errors: dict[str, list[str]] | None = None


class ApiError(Exception):
    """Base API exception."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str | None = None,
        errors: dict[str, list[str]] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.errors = errors
        super().__init__(message)


class NotFoundError(ApiError):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND")


class UnauthorizedError(ApiError):
    """Authentication required or failed."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED")


class ForbiddenError(ApiError):
    """Permission denied."""

    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN")


class ConflictError(ApiError):
    """Resource conflict (e.g., duplicate)."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status.HTTP_409_CONFLICT, "CONFLICT")


class ValidationError(ApiError):
    """Validation failed."""

    def __init__(self, message: str = "Validation failed", errors: dict[str, list[str]] | None = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", errors)


class RateLimitError(ApiError):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED")


def setup_exception_handlers(app: FastAPI) -> None:
    """Register exception handlers with the app."""

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                message=exc.message,
                code=exc.code,
                errors=exc.errors,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the actual error in production
        if not isinstance(exc, ApiError):
            # In production, don't expose internal errors
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=ErrorResponse(
                    message="An unexpected error occurred",
                    code="INTERNAL_ERROR",
                ).model_dump(exclude_none=True),
            )
        raise exc

