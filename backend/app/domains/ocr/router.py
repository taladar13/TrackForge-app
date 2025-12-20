"""OCR domain API routes."""

from fastapi import APIRouter, Depends, File, Response, UploadFile

from app.core.deps import CurrentUserId, DbSession
from app.core.rate_limit import rate_limit
from app.domains.ocr import service
from app.domains.ocr.schemas import OcrJobResponse

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post(
    "/menu",
    response_model=OcrJobResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=3600))],  # 10/hour
)
async def process_menu(
    db: DbSession,
    user_id: CurrentUserId,
    file: UploadFile = File(...),
) -> OcrJobResponse:
    """
    Upload menu image for OCR processing.
    
    Returns parsed menu items that can be converted to a diet plan.
    Rate limited to 10 requests per hour.
    """
    image_data = await file.read()
    return await service.process_menu_ocr(db, user_id, image_data, file.filename or "image.jpg")


@router.post(
    "/workout",
    response_model=OcrJobResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=3600))],  # 10/hour
)
async def process_workout(
    db: DbSession,
    user_id: CurrentUserId,
    file: UploadFile = File(...),
) -> OcrJobResponse:
    """
    Upload workout image for OCR processing.
    
    Returns parsed exercises that can be converted to a workout program.
    Rate limited to 10 requests per hour.
    """
    image_data = await file.read()
    return await service.process_workout_ocr(db, user_id, image_data, file.filename or "image.jpg")


@router.get("/jobs/{job_id}", response_model=OcrJobResponse)
async def get_job(
    job_id: str,
    db: DbSession,
    user_id: CurrentUserId,
) -> OcrJobResponse:
    """Get OCR job status and result."""
    return await service.get_ocr_job(db, user_id, job_id)
