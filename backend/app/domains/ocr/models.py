"""OCR domain models."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid4())


class OcrJob(Base):
    """OCR processing job."""

    __tablename__ = "ocr_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # menu, workout
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, completed, failed
    input_path = Column(String(500), nullable=True)  # path to uploaded image
    result = Column(JSONB, nullable=True)  # parsed output
    error = Column(Text, nullable=True)  # error message if failed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    completed_at = Column(DateTime(timezone=True), nullable=True)


