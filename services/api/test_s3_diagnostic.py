#!/usr/bin/env python3
"""
S3 Diagnostic Tool - Test connectivity and identify upload issues
"""

import asyncio
import io
import os
import sys


def print_section(title: str):
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print(f"{'=' * 80}")


def print_status(label: str, status: str, detail: str = ""):
    emoji = "✅" if status == "OK" else "⚠️" if status == "WARN" else "❌"
    print(f"{emoji} {label:40} {status:15} {detail}")


async def test_s3_connectivity():
    from app.core.config import get_settings
    from app.services.s3 import _get_kyc_s3_client, _get_s3_client

    settings = get_settings()

    print_section("1. ENVIRONMENT VARIABLES CHECK")

    # Media S3 Config
    print("\n📦 MEDIA S3 (Cloudflare R2 / MinIO):")
    print_status(
        "AWS_ACCESS_KEY_ID",
        "OK" if settings.aws_access_key_id else "MISSING",
        f"Length: {len(settings.aws_access_key_id) if settings.aws_access_key_id else 0}",
    )
    print_status(
        "AWS_SECRET_ACCESS_KEY",
        "OK" if settings.aws_secret_access_key else "MISSING",
        f"Length: {len(settings.aws_secret_access_key) if settings.aws_secret_access_key else 0}",
    )
    print_status(
        "AWS_S3_BUCKET",
        "OK" if settings.aws_s3_bucket else "MISSING",
        f"Value: {settings.aws_s3_bucket or 'NONE'}",
    )
    print_status(
        "S3_ENDPOINT_URL",
        "OK" if settings.s3_endpoint_url else "DEFAULT",
        f"Value: {settings.s3_endpoint_url or 'AWS DEFAULT'}",
    )
    print_status(
        "S3_PUBLIC_URL",
        "OK" if settings.s3_public_url else "MISSING",
        f"Value: {settings.s3_public_url or 'NONE'}",
    )
    print_status("AWS_REGION", "OK", f"Value: {settings.aws_region}")

    # KYC S3 Config
    print("\n🔐 KYC S3 (Azure Blob Storage):")
    print_status(
        "KYC_AWS_ACCESS_KEY_ID",
        "OK" if settings.kyc_aws_access_key_id else "NOT SET",
        f"Length: {len(settings.kyc_aws_access_key_id) if settings.kyc_aws_access_key_id else 0}",
    )
    print_status(
        "KYC_AWS_SECRET_ACCESS_KEY",
        "OK" if settings.kyc_aws_secret_access_key else "NOT SET",
        f"Length: {len(settings.kyc_aws_secret_access_key) if settings.kyc_aws_secret_access_key else 0}",
    )
    print_status(
        "KYC_AWS_S3_BUCKET",
        "OK" if settings.kyc_aws_s3_bucket else "DEFAULT",
        f"Value: {settings.kyc_aws_s3_bucket or 'DEFAULT'}",
    )
    print_status(
        "KYC_S3_ENDPOINT_URL",
        "OK" if settings.kyc_s3_endpoint_url else "NOT SET",
        f"Value: {settings.kyc_s3_endpoint_url or 'NONE'}",
    )

    print_section("2. S3 CLIENT INITIALIZATION")

    try:
        media_client = _get_s3_client()
        print_status("Media S3 Client", "OK", "Initialized successfully")
    except Exception as e:
        print_status("Media S3 Client", "ERROR", str(e)[:60])
        return

    try:
        kyc_client = _get_kyc_s3_client()
        print_status("KYC S3 Client", "OK", "Initialized successfully")
    except Exception as e:
        print_status("KYC S3 Client", "ERROR", str(e)[:60])

    print_section("3. BOTO3 CLIENT CONNECTIVITY TEST")

    # Test media bucket connectivity
    try:
        response = media_client.head_bucket(Bucket=settings.aws_s3_bucket)
        print_status(
            "Media Bucket Access", "OK", f"HTTP {response['ResponseMetadata']['HTTPStatusCode']}"
        )
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg:
            print_status("Media Bucket Access", "ERROR", "Bucket not found (404)")
        elif "403" in error_msg:
            print_status("Media Bucket Access", "ERROR", "Access denied (403) - Check credentials")
        elif "NoSuchBucket" in error_msg:
            print_status("Media Bucket Access", "ERROR", "Bucket does not exist")
        else:
            print_status("Media Bucket Access", "ERROR", error_msg[:60])

    # Test KYC bucket connectivity
    if settings.kyc_aws_s3_bucket and settings.kyc_s3_endpoint_url:
        try:
            response = kyc_client.head_bucket(Bucket=settings.kyc_aws_s3_bucket)
            print_status(
                "KYC Bucket Access", "OK", f"HTTP {response['ResponseMetadata']['HTTPStatusCode']}"
            )
        except Exception as e:
            error_msg = str(e)
            print_status("KYC Bucket Access", "ERROR", error_msg[:60])

    print_section("4. UPLOAD SIMULATION TEST")

    # Test media upload
    try:
        test_key = f"_test_connectivity_{os.urandom(8).hex()}.txt"
        test_content = b"Test content for S3 connectivity"
        test_file = io.BytesIO(test_content)

        media_client.upload_fileobj(
            test_file, settings.aws_s3_bucket, test_key, ExtraArgs={"ContentType": "text/plain"}
        )
        print_status("Media Upload", "OK", f"Successfully uploaded test file: {test_key}")

        # Clean up
        try:
            media_client.delete_object(Bucket=settings.aws_s3_bucket, Key=test_key)
        except Exception:
            pass

    except Exception as e:
        error_msg = str(e)
        print_status("Media Upload", "ERROR", error_msg[:60])

    print_section("5. DJANGO CORS & API CONFIGURATION")

    print_status("CORS_ORIGINS", "OK", settings.cors_origins[:60])
    print_status("APP_ENV", "OK", settings.app_env)
    print_status("DEBUG", "OK", str(settings.debug))

    print_section("6. SECURITY & PERMISSIONS")

    # Check if credentials look valid
    if settings.aws_access_key_id and len(settings.aws_access_key_id) > 10:
        print_status("Media Access Key Format", "OK", "Looks valid")
    else:
        print_status("Media Access Key Format", "ERROR", "Too short or invalid")

    if settings.aws_secret_access_key and len(settings.aws_secret_access_key) > 20:
        print_status("Media Secret Key Format", "OK", "Looks valid")
    else:
        print_status("Media Secret Key Format", "ERROR", "Too short or invalid")

    print_section("SUMMARY")
    print("\n💡 Tips:")
    print("  1. Ensure S3_ENDPOINT_URL is set correctly for Cloudflare R2")
    print("  2. Verify AWS credentials have S3 object read/write permissions")
    print("  3. Check S3_PUBLIC_URL matches your CDN or public domain")
    print("  4. Ensure bucket policy allows the access key ID to upload")
    print("  5. Test with curl: curl -X POST https://api.wealthspot.in/health")
    print("\n✨ If all checks pass, S3 connectivity is working!")


if __name__ == "__main__":
    try:
        asyncio.run(test_s3_connectivity())
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
