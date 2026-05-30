import sys

import boto3
from botocore.config import Config

from app.core.config import get_settings


def test_s3():
    settings = get_settings()
    print("Testing S3 Connectivity...")
    print(f"Bucket: {settings.aws_s3_bucket}")
    print(f"Region: {settings.aws_region}")
    print(f"Endpoint: {settings.s3_endpoint_url}")

    extra = {}
    if settings.s3_endpoint_url:
        endpoint = settings.s3_endpoint_url.rstrip("/")
        if settings.aws_s3_bucket and endpoint.endswith(f"/{settings.aws_s3_bucket}"):
            endpoint = endpoint.rsplit(f"/{settings.aws_s3_bucket}", 1)[0]
        extra["endpoint_url"] = endpoint

    try:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
            config=Config(signature_version="s3v4"),
            **extra,
        )
        # Test 1: List objects
        print("Attempting to list objects in bucket...")
        response = s3.list_objects_v2(Bucket=settings.aws_s3_bucket, MaxKeys=5)
        print(f"Success! Found {response.get('KeyCount', 0)} objects.")

        # Test 2: Upload a dummy file
        print("Attempting to upload a dummy file...")
        s3.put_object(Bucket=settings.aws_s3_bucket, Key="test_connectivity.txt", Body=b"test")
        print("Upload successful!")

        # Test 3: Delete the dummy file
        print("Attempting to delete the dummy file...")
        s3.delete_object(Bucket=settings.aws_s3_bucket, Key="test_connectivity.txt")
        print("Deletion successful!")

        print("\nALL S3 TESTS PASSED!")
    except Exception as e:
        print("\nERROR IN S3 CONNECTIVITY!")
        print(f"{type(e).__name__}: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    test_s3()
