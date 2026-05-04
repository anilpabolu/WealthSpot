"""Domain exceptions for the WealthSpot Communication Platform."""

from __future__ import annotations


class CommError(Exception):
    """Base class for all WSCP exceptions."""


class EventNotRegistered(CommError):
    """Raised when `publish()` is called for an event_name not in comm.events."""


class PayloadValidationError(CommError):
    """Raised when payload fails JSON Schema validation for its event."""


class DltTemplateMismatch(CommError):
    """SMS content does not match any registered DLT template pattern."""


class OtpRateLimited(CommError):
    """OTP request rate limit exceeded (per-phone or per-IP)."""


class OtpInvalid(CommError):
    """OTP is incorrect, expired, or max attempts exceeded."""


class TemplateNotFound(CommError):
    """No active template version found for the binding."""


class TemplateRenderError(CommError):
    """Jinja2 / MJML render failed."""


class ProviderSendError(CommError):
    """Provider returned a non-retryable error."""


class ProviderConfigError(CommError):
    """Provider credentials are missing or malformed."""


class SuppressionHit(CommError):
    """Recipient is in the suppression list — send must not proceed."""
