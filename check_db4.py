import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("services/api"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.consent_log import ConsentLog

async def main():
    engine = create_async_engine("postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5433/wealthspot")
    async with AsyncSession(engine) as session:
        result = await session.execute(select(ConsentLog))
        logs = result.scalars().all()
        for log in logs[-10:]:
            print(f"User: {log.user_id}, Context: {log.context}, Reg: {log.regulatory_accepted}, Created: {log.created_at}")

asyncio.run(main())
