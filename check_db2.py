import asyncio
import sys
import os

# Add services/api to PYTHONPATH dynamically
sys.path.insert(0, os.path.abspath("services/api"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.consent_log import ConsentLog
import uuid

async def main():
    engine = create_async_engine("postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5433/wealthspot")
    async with AsyncSession(engine) as session:
        CURRENT_VERSION = "v1.0"
        user_id = uuid.UUID("a0000000-0000-0000-0000-000000000099")
        stmt = (
            select(ConsentLog)
            .where(
                ConsentLog.user_id == user_id,
                ConsentLog.consent_version == CURRENT_VERSION,
                ConsentLog.context == "ONBOARDING",
                ConsentLog.regulatory_accepted.is_(True),
                ConsentLog.privacy_accepted.is_(True),
            )
            .order_by(ConsentLog.created_at.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        log = result.scalars().first()
        print(f"Log found: {log is not None}")

asyncio.run(main())
