"""Progress domain models."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, String, UniqueConstraint

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid4())


class BodyMetric(Base):
    """Body measurements tracked over time."""

    __tablename__ = "body_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    weight = Column(Float, nullable=True)  # in kg (canonical unit)
    body_fat = Column(Float, nullable=True)  # percentage
    muscle_mass = Column(Float, nullable=True)  # in kg
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # One measurement per user per day (upsert)
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_body_metric_user_date"),
    )


