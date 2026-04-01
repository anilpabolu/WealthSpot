"""
S3-compatible storage service (works with AWS S3 and MinIO).
"""

import uuid
from typing import Any, BinaryIO, cast

import anyio
import boto3  # type: ignore[import-untyped]
from botocore.config import Config as BotoConfig  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()


def _get_s3_client() -> Any:
    extra: dict[str, Any] = {}
    if settings.s3_endpoint_url:
        extra["endpoint_url"] = settings.s3_endpoint_url

    return cast(Any, boto3).client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        config=BotoConfig(signature_version="s3v4"),
        **extra,
    )


def get_public_url(key: str) -> str:
    """Return the public URL for a stored object."""
    if settings.s3_public_url:
        return f"{settings.s3_public_url.rstrip('/')}/{key}"
    return f"https://{settings.aws_s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


async def upload_file(
    file: BinaryIO,
    key: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a file and return its S3 key. Runs blocking boto3 call in a thread."""
    s3: Any = _get_s3_client()
    await anyio.to_thread.run_sync(
        lambda: s3.upload_fileobj(
            file,
            settings.aws_s3_bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )
    )
    return key


async def upload_opportunity_media(
    file: BinaryIO,
    filename: str,
    opportunity_id: str,
    media_type: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload opportunity image/video. Returns the S3 key."""
    safe_name = filename.replace(" ", "_")
    key = f"opportunities/{opportunity_id}/{media_type}/{uuid.uuid4().hex}_{safe_name}"
    return await upload_file(file, key, content_type)


async def upload_document(
    file: BinaryIO,
    filename: str,
    user_id: str,
    doc_type: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a KYC/builder document to S3 and return the key."""
    key = f"kyc/{user_id}/{doc_type}/{uuid.uuid4().hex}_{filename}"
    return await upload_file(file, key, content_type)


async def upload_template(
    file: BinaryIO,
    filename: str,
    user_id: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload an opportunity template spreadsheet."""
    key = f"templates/{user_id}/{uuid.uuid4().hex}_{filename}"
    return await upload_file(file, key, content_type)


def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned download URL for a document."""
    s3: Any = _get_s3_client()
    params: dict[str, Any] = {"Bucket": settings.aws_s3_bucket, "Key": key}
    extra: dict[str, Any] = {}
    if settings.s3_endpoint_url:
        extra["ExpiresIn"] = expires_in
    return s3.generate_presigned_url(
        "get_object",
        Params=params,
        ExpiresIn=expires_in,
    )
