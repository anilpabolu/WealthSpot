import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect(
        host='ep-mute-term-aoch1ce0.c-2.ap-southeast-1.aws.neon.tech',
        port=5432, database='neondb', user='neondb_owner', password='npg_zkZ0mBY8PTJj', ssl='require'
    )
    cols = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY column_name")
    print('users columns:', [r['column_name'] for r in cols])
    await conn.close()

asyncio.run(check())
