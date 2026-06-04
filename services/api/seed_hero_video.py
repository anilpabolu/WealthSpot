import asyncio
import io

# Allow importing from 'app'
import os
import sys
import uuid
from datetime import UTC, datetime

from dotenv import load_dotenv

load_dotenv(".env.local")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import async_session_factory
from app.models.app_video import AppVideo
from app.services.s3 import get_public_url, upload_file


async def main():
    try:
        file_path = r"C:\Users\anilk\Downloads\Crowd_Street_1920x960_01-v1-.mp4"
        with open(file_path, "rb") as f:
            content = f.read()

        file_obj = io.BytesIO(content)
        content_type = "video/mp4"

        safe_name = "Crowd_Street_1920x960_01-v1-.mp4"
        key = f"app-videos/home/hero_video/{uuid.uuid4().hex}_{safe_name}"

        print(f"Uploading {len(content)} bytes to S3...")
        await upload_file(file_obj, key, content_type)
        url = get_public_url(key)
        print(f"Upload complete. URL: {url}")

        # Upsert the AppVideo record
        async with async_session_factory() as db:
            from sqlalchemy import and_, select

            stmt = select(AppVideo).where(
                and_(AppVideo.page == "home", AppVideo.section_tag == "hero_video")
            )
            result = await db.execute(stmt)
            video = result.scalar_one_or_none()

            if video:
                print("Updating existing AppVideo record...")
                video.video_url = url
                video.s3_key = key
                video.content_type = content_type
                video.size_bytes = len(content)
                video.updated_at = datetime.now(UTC)
            else:
                print("Creating new AppVideo record...")
                video = AppVideo(
                    page="home",
                    section_tag="hero_video",
                    title="Landing Page Hero Video",
                    video_url=url,
                    s3_key=key,
                    content_type=content_type,
                    size_bytes=len(content),
                    is_active=True,
                    sort_order=0,
                )
                db.add(video)

            await db.commit()
            print("Successfully updated database.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
