"""Application-level exception types and JSON response shape.

`APIError` carries an optional machine-readable `code` so the frontend can
switch on it for translated messages. The handler in main.py emits:
    {"detail": "<human message>", "code": "<machine code or null>"}
"""

from typing import Any

from fastapi import HTTPException


class APIError(HTTPException):
    """HTTPException with an optional machine-readable error code."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code

    def to_payload(self) -> dict[str, Any]:
        return {"detail": self.detail, "code": self.code}
