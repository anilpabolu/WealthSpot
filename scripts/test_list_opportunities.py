"""Try to reproduce the list_opportunities error locally by importing the app and running the query."""
import asyncio
import sys
sys.path.insert(0, 'services/api')

import os
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://neondb_owner:npg_zkZ0mBY8PTJj@ep-mute-term-aoch1ce0.c-2.ap-southeast-1.aws.neon.tech/neondb?ssl=require'
os.environ['REDIS_URL'] = 'rediss://default:gQAAAAAAAcl3AAIgcDI5NzU1YmZlNjliYmE0NjliOTM2OGVlZGMyODFjZjE0Mw@thankful-oriole-117111.upstash.io:6379'
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['ENVIRONMENT'] = 'test'

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.opportunity import Opportunity, OpportunityStatus

DATABASE_URL = os.environ['DATABASE_URL']
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test():
    async with AsyncSessionLocal() as db:
        try:
            query = select(Opportunity)
            count_query = select(func.count(Opportunity.id))
            total = (await db.execute(count_query)).scalar() or 0
            print(f'Total count query OK: {total}')
            query = query.order_by(Opportunity.created_at.desc()).limit(5)
            result = await db.execute(query)
            opps = result.scalars().all()
            print(f'Got {len(opps)} opportunities')
            # Try to serialize
            from app.schemas.opportunity import OpportunityRead
            for opp in opps:
                try:
                    read = OpportunityRead.model_validate(opp)
                    print(f'  Serialized: {opp.title} OK')
                except Exception as e:
                    print(f'  Serialization FAILED for {opp.title}: {e}')
        except Exception as e:
            print(f'Query FAILED: {type(e).__name__}: {e}')
        finally:
            await db.close()

asyncio.run(test())
