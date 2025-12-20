"""FastAPI application factory."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import setup_exception_handlers
from app.core.rate_limit import close_redis, init_redis
from app.core.tasks import start_background_tasks


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler for startup/shutdown."""
    # Startup
    await init_redis()
    bg_task = start_background_tasks()
    
    yield
    
    # Shutdown
    bg_task.cancel()
    try:
        await bg_task
    except asyncio.CancelledError:
        pass
    await close_redis()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url=f"{settings.api_v1_prefix}/docs",
        redoc_url=f"{settings.api_v1_prefix}/redoc",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    setup_exception_handlers(app)

    # Health check endpoint (outside versioned API)
    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "healthy", "version": settings.app_version}

    # Import and include routers
    from app.domains.auth.router import router as auth_router
    from app.domains.users.router import router as users_router
    from app.domains.nutrition.router import router as nutrition_router
    from app.domains.workouts.router import router as workouts_router
    from app.domains.progress.router import router as progress_router
    from app.domains.ocr.router import router as ocr_router

    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix)
    app.include_router(nutrition_router, prefix=settings.api_v1_prefix)
    app.include_router(workouts_router, prefix=settings.api_v1_prefix)
    app.include_router(progress_router, prefix=settings.api_v1_prefix)
    app.include_router(ocr_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()


