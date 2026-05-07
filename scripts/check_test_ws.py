import asyncio
import ssl
import os

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlalchemy.pool import NullPool

raw = os.environ["DATABASE_URL"].replace("?ssl=require", "").replace("&ssl=require", "")
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE
engine = create_async_engine(raw, poolclass=NullPool, connect_args={"ssl": ssl_ctx})


async def check():
    async with engine.begin() as conn:
        r = await conn.execute(text(
            "SELECT table_schema, table_name FROM information_schema.tables "
            "WHERE table_name = 'users' ORDER BY table_schema"
        ))
        print("Tables named 'users':")
        for row in r:
            print(" ", row)

        # check if test_ws schema exists
        r2 = await conn.execute(text(
            "SELECT schema_name FROM information_schema.schemata "
            "WHERE schema_name IN ('test_ws', 'comm', 'public') ORDER BY schema_name"
        ))
        print("Schemas:")
        for row in r2:
            print(" ", row)

        # check test_ws tables
        r3 = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'test_ws' ORDER BY table_name"
        ))
        print("test_ws tables:")
        for row in r3:
            print(" ", row)


asyncio.run(check())
