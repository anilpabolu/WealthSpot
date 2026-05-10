import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        host='ep-mute-term-aoch1ce0.c-2.ap-southeast-1.aws.neon.tech',
        port=5432, database='neondb',
        user='neondb_owner', password='npg_zkZ0mBY8PTJj',
        ssl='require'
    )
    try:
        result = await conn.fetch(
            'SELECT id, safe_vault_data, template_s3_key, template_data, investment_mode, amenity_cost_estimate FROM opportunities WHERE status != $1 ORDER BY created_at DESC LIMIT 5',
            'archived'
        )
        print('Query succeeded! Row count:', len(result))
    except Exception as e:
        print('Query failed:', type(e).__name__, str(e))
    finally:
        await conn.close()

asyncio.run(check())
