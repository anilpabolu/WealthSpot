import asyncio
import ssl
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def main(url, is_prod):
    kwargs = {}
    if is_prod:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        kwargs["connect_args"] = {"ssl": ssl_ctx}

    clean_url = url.replace("?ssl=require", "")
    engine = create_async_engine(clean_url, **kwargs)

    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT email, role FROM users WHERE role = 'super_admin'")
            )
            rows = result.fetchall()
            for r in rows:
                print(f" - {r[0]} ({r[1]})")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    url = sys.argv[1]
    is_prod = sys.argv[2] == "true"
    asyncio.run(main(url, is_prod))
