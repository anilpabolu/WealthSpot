"""
Celery application instance for WealthSpot async task processing.
"""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery = Celery(
    "wealthspot",
    broker=settings.celery_broker_url,
    backend=settings.redis_url,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
