"""
Upload validation: magic-byte sniffing + Content-Type cross-check.

This is a lightweight defence against Content-Type spoofing on the upload
endpoints. It does NOT replace antivirus scanning — pair with ClamAV (or
S3-trigger Lambda) for production.

Magic numbers come from common file format specs. We only validate the
prefix of the file; this is bypassable by sophisticated attackers but stops
the trivial "rename evil.exe to logo.png" case.
"""

from __future__ import annotations

# Magic-byte prefixes per MIME type. Keep entries short (≤16 bytes).
_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),  # also need "WEBP" at offset 8 (checked below)
    "video/mp4": (b"\x00\x00\x00\x18ftyp", b"\x00\x00\x00\x20ftyp"),
    "video/quicktime": (b"\x00\x00\x00\x14ftyp", b"\x00\x00\x00\x20ftyp"),
    "video/webm": (b"\x1a\x45\xdf\xa3",),
    "application/pdf": (b"%PDF-",),
    "application/zip": (b"PK\x03\x04", b"PK\x05\x06"),
    # OOXML (.docx/.xlsx) and legacy CFB (.doc/.xls) handled below.
}


def detect_signature(content: bytes) -> str | None:
    """Return the canonical MIME for the file's magic bytes, or None."""
    if not content:
        return None
    head = content[:16]

    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if head.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "image/webp"
    if head.startswith(b"%PDF-"):
        return "application/pdf"
    # OOXML (zip-based: docx, xlsx, pptx) — caller must dispatch on MIME hint.
    if head.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")):
        return "application/zip"
    # Legacy MS CFB (doc / xls / ppt)
    if head.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        return "application/x-cfb"
    if head[4:8] == b"ftyp":
        return "video/mp4"
    if head.startswith(b"\x1a\x45\xdf\xa3"):
        return "video/webm"
    return None


# MIMEs that can legitimately resolve to a generic container — accept either.
_CONTAINER_ALIASES: dict[str, set[str]] = {
    "application/zip": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
    "application/x-cfb": {
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
    },
}


def validate_upload(content: bytes, claimed_mime: str) -> tuple[bool, str | None]:
    """Validate that file bytes match the claimed Content-Type.

    Returns (ok, reason). On failure, reason is a human-readable error suitable
    for surfacing to the client (without leaking internals).
    """
    detected = detect_signature(content)
    if detected is None:
        return False, "Unrecognised file format"
    if detected == claimed_mime:
        return True, None
    if claimed_mime in _CONTAINER_ALIASES.get(detected, set()):
        return True, None
    return False, "File contents do not match declared type"
