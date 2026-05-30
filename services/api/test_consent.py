import asyncio

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.consent_log import ConsentLog


async def main():
    async with async_session_factory() as db:
        result = await db.execute(select(ConsentLog))
        logs = result.scalars().all()
        for log in logs:
            print(
                f"Log ID: {log.id}, User: {log.user_id}, Context: {log.context}, Version: {log.consent_version}, Reg: {log.regulatory_accepted}, Priv: {log.privacy_accepted}"
            )


asyncio.run(main())
