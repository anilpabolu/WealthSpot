import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect(
        host='ep-mute-term-aoch1ce0.c-2.ap-southeast-1.aws.neon.tech',
        port=5432, database='neondb', user='neondb_owner', password='npg_zkZ0mBY8PTJj', ssl='require'
    )
    tbls = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    print([r['table_name'] for r in tbls])
    await conn.close()

asyncio.run(check())
