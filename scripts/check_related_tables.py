"""Check all tables in DB vs expected, especially looking for missing columns in tables
that are eagerly loaded by the opportunities query (joined/selectin relationships)."""
import asyncio, asyncpg

TABLES_TO_CHECK = [
    'companies', 'users', 'approval_requests', 'opportunity_media',
    'opportunity_investments', 'builder_questions', 'opportunity_comm_mappings',
    'builder_updates', 'opportunity_documents'
]

async def check():
    conn = await asyncpg.connect(
        host='ep-mute-term-aoch1ce0.c-2.ap-southeast-1.aws.neon.tech',
        port=5432, database='neondb', user='neondb_owner', password='npg_zkZ0mBY8PTJj', ssl='require'
    )
    for table in TABLES_TO_CHECK:
        cols = await conn.fetch(
            "SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY column_name",
            table
        )
        if not cols:
            print(f'TABLE MISSING: {table}')
        else:
            print(f'{table}: {len(cols)} columns')
    await conn.close()

asyncio.run(check())
