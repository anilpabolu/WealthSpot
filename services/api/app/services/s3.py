"""
S3 document upload service.
"""

import uuid
from typing import Any, BinaryIO, cast

import boto3  # type: ignore[import-untyped]
from botocore.config import Config as BotoConfig  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()


def _get_s3_client() -> Any:
    return cast(Any, boto3).client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        config=BotoConfig(signature_version="s3v4"),
    )


async def upload_document(
    file: BinaryIO,
    filename: str,
    user_id: str,
    doc_type: str,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Upload a document to S3 and return the key.
    Key format: kyc/{user_id}/{doc_type}/{uuid}_{filename}
    """
    s3: Any = _get_s3_client()
    key = f"kyc/{user_id}/{doc_type}/{uuid.uuid4().hex}_{filename}"

    s3.upload_fileobj(
        file,
        settings.aws_s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )

    return key


def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned download URL for a document."""
    s3: Any = _get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.aws_s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
