"""
Celery application instance for WealthSpot async task processing.
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery = Celery(
    "wealthspot",
    broker=settings.celery_broker_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Periodic task schedule
celery.conf.beat_schedule = {
    "cleanup-expired-otps": {
        "task": "app.tasks.cleanup_expired_otps",
        "schedule": crontab(minute="*/15"),
    },
    "cleanup-old-audit-logs": {
        "task": "app.tasks.cleanup_old_audit_logs",
        "schedule": crontab(hour=3, minute=0),  # Daily at 3:00 AM UTC
    },
    "refresh-analytics-views": {
        "task": "app.tasks.refresh_analytics_views",
        "schedule": crontab(minute="*/30"),  # Every 30 minutes
    },
    "transition-opportunity-statuses": {
        "task": "app.tasks.transition_opportunity_statuses",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
}
