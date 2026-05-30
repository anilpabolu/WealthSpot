import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("services/api"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.consent_log import ConsentLog
from app.models.user import User

async def main():
    engine = create_async_engine("postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5433/wealthspot")
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"User ID: {u.id}, Email: {u.email}")
            
        result = await session.execute(select(ConsentLog))
        logs = result.scalars().all()
        print(f"Total Logs: {len(logs)}")

asyncio.run(main())
