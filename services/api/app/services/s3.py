"""
S3-compatible storage service.

Two separate backends:
  - Media client  → Cloudflare R2  (avatars, opportunity images/videos, templates)
  - KYC client    → Azure Blob     (PAN, Aadhaar, selfies — private, India-resident)
"""

import uuid
from typing import Any, BinaryIO, cast

import anyio
import anyio.to_thread
import boto3  # type: ignore[import-untyped]
from botocore.config import Config as BotoConfig  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()


def _get_s3_client() -> Any:
    """Media bucket client (Cloudflare R2 in production, MinIO in local dev)."""
    extra: dict[str, Any] = {}
    if settings.s3_endpoint_url:
        endpoint = settings.s3_endpoint_url.rstrip("/")
        # Prevent double-bucket in URL if user accidentally included it in the env var
        if settings.aws_s3_bucket and endpoint.endswith(f"/{settings.aws_s3_bucket}"):
            endpoint = endpoint.rsplit(f"/{settings.aws_s3_bucket}", 1)[0]
        extra["endpoint_url"] = endpoint

    return cast(Any, boto3).client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        config=BotoConfig(signature_version="s3v4"),
        **extra,
    )


def _get_kyc_s3_client() -> Any:
    """KYC document client (Azure Blob Storage S3-compatible endpoint in production)."""
    extra: dict[str, Any] = {}
    if settings.kyc_s3_endpoint_url:
        endpoint = settings.kyc_s3_endpoint_url.rstrip("/")
        if settings.kyc_aws_s3_bucket and endpoint.endswith(f"/{settings.kyc_aws_s3_bucket}"):
            endpoint = endpoint.rsplit(f"/{settings.kyc_aws_s3_bucket}", 1)[0]
        extra["endpoint_url"] = endpoint

    # Falls back to the media client config if KYC-specific credentials are not set
    # (allows local dev to use a single MinIO bucket without extra config).
    access_key = settings.kyc_aws_access_key_id or settings.aws_access_key_id
    secret_key = settings.kyc_aws_secret_access_key or settings.aws_secret_access_key
    endpoint = settings.kyc_s3_endpoint_url or settings.s3_endpoint_url
    if endpoint:
        extra["endpoint_url"] = endpoint

    return cast(Any, boto3).client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=settings.aws_region,
        config=BotoConfig(signature_version="s3v4"),
        **extra,
    )


def get_public_url(key: str) -> Any:
    """Return the public URL for a stored object."""
    if settings.s3_public_url:
        return f"{settings.s3_public_url.rstrip('/')}/{key}"
    return f"https://{settings.aws_s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def ensure_current_public_url(url: str | None) -> Any:
    """If the URL is an S3 media URL from an older environment, rewrite it to the current public URL."""
    if not url:
        return url
    import re

    match = re.search(r"(opportunities/|avatars/|companies/|templates/).*", url)
    if match:
        key = match.group(0)
        return get_public_url(key)
    return url


async def upload_file(
    file: BinaryIO,
    key: str,
    content_type: str = "application/octet-stream",
) -> Any:
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
) -> Any:
    """Upload opportunity image/video. Returns the S3 key."""
    safe_name = filename.replace(" ", "_")
    key = f"opportunities/{opportunity_id}/{media_type}/{uuid.uuid4().hex}_{safe_name}"
    return await upload_file(file, key, content_type)


async def upload_avatar(
    file: BinaryIO,
    filename: str,
    user_id: str,
    content_type: str = "image/jpeg",
) -> Any:
    """Upload a user profile photo to S3 and return the key."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    key = f"avatars/{user_id}/{uuid.uuid4().hex}.{ext}"
    return await upload_file(file, key, content_type)


async def upload_document(
    file: BinaryIO,
    filename: str,
    user_id: str,
    doc_type: str,
    content_type: str = "application/octet-stream",
) -> Any:
    """Upload a KYC document to Azure Blob Storage (private) and return the key."""
    key = f"kyc/{user_id}/{doc_type}/{uuid.uuid4().hex}_{filename}"
    s3: Any = _get_kyc_s3_client()
    bucket = settings.kyc_aws_s3_bucket
    await anyio.to_thread.run_sync(
        lambda: s3.upload_fileobj(
            file,
            bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )
    )
    return key


async def upload_template(
    file: BinaryIO,
    filename: str,
    user_id: str,
    content_type: str = "application/octet-stream",
) -> Any:
    """Upload an opportunity template spreadsheet."""
    key = f"templates/{user_id}/{uuid.uuid4().hex}_{filename}"
    return await upload_file(file, key, content_type)


def generate_presigned_url(key: str, expires_in: int = 3600) -> Any:
    """Generate a short-lived presigned download URL for a private KYC document."""
    s3: Any = _get_kyc_s3_client()
    params: dict[str, Any] = {"Bucket": settings.kyc_aws_s3_bucket, "Key": key}
    return s3.generate_presigned_url(
        "get_object",
        Params=params,
        ExpiresIn=expires_in,
    )


async def delete_file(key: str) -> None:
    """Delete a file from S3. Runs blocking boto3 call in a thread."""
    s3: Any = _get_s3_client()
    await anyio.to_thread.run_sync(lambda: s3.delete_object(Bucket=settings.aws_s3_bucket, Key=key))


async def check_s3_connectivity() -> dict[str, Any]:
    """Test media bucket connectivity. Returns a status dict safe to expose to admins."""
    endpoint = settings.s3_endpoint_url or "(AWS default — S3_ENDPOINT_URL not set)"
    bucket = settings.aws_s3_bucket
    try:
        s3: Any = _get_s3_client()
        await anyio.to_thread.run_sync(lambda: s3.head_bucket(Bucket=bucket))
        return {"ok": True, "endpoint": endpoint, "bucket": bucket, "error": None}
    except Exception as exc:
        return {"ok": False, "endpoint": endpoint, "bucket": bucket, "error": str(exc)}
