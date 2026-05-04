"""Provider strategy pattern — ABCs + concrete adapters (SMTP, Twilio, Stubs)."""

from __future__ import annotations

import logging
import smtplib
import ssl
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from email.headerregistry import Address
from email.message import EmailMessage
from typing import Any

from app.comm.exceptions import ProviderConfigError, ProviderSendError

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Envelopes
# ---------------------------------------------------------------------------


@dataclass
class EmailEnvelope:
    to: str
    subject: str
    html: str | None = None
    text: str | None = None
    from_name: str = "WealthSpot"
    from_addr: str = "no-reply@wealthspot.in"
    reply_to: str | None = None
    correlation_id: str | None = None


@dataclass
class SmsEnvelope:
    to: str  # E.164 phone
    body: str
    sender_id: str = "WLTHSP"
    dlt_header_id: str | None = None
    dlt_template_id: str | None = None
    correlation_id: str | None = None


@dataclass
class WhatsAppEnvelope:
    to: str  # E.164 phone
    template_name: str
    language_code: str = "en"
    components: list[dict[str, Any]] = field(default_factory=list)
    correlation_id: str | None = None


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------


@dataclass
class SendResult:
    success: bool
    provider_message_id: str | None = None
    error: str | None = None
    cost_paise: int | None = None


# ---------------------------------------------------------------------------
# ABCs
# ---------------------------------------------------------------------------


class EmailProvider(ABC):
    @abstractmethod
    async def send(self, envelope: EmailEnvelope) -> SendResult: ...


class SmsProvider(ABC):
    @abstractmethod
    async def send(self, envelope: SmsEnvelope) -> SendResult: ...


class WhatsAppProvider(ABC):
    @abstractmethod
    async def send(self, envelope: WhatsAppEnvelope) -> SendResult: ...


# ---------------------------------------------------------------------------
# Stub providers (dev / tests)
# ---------------------------------------------------------------------------


class StubEmailProvider(EmailProvider):
    async def send(self, envelope: EmailEnvelope) -> SendResult:
        log.info(
            "[STUB EMAIL] to=%s subject=%s corr=%s",
            envelope.to,
            envelope.subject,
            envelope.correlation_id,
        )
        return SendResult(success=True, provider_message_id="stub-email-ok")


class StubSmsProvider(SmsProvider):
    async def send(self, envelope: SmsEnvelope) -> SendResult:
        log.info(
            "[STUB SMS] to=%s body=%s corr=%s",
            envelope.to,
            envelope.body[:40],
            envelope.correlation_id,
        )
        return SendResult(success=True, provider_message_id="stub-sms-ok")


class StubWhatsAppProvider(WhatsAppProvider):
    async def send(self, envelope: WhatsAppEnvelope) -> SendResult:
        log.info(
            "[STUB WA] to=%s tmpl=%s corr=%s",
            envelope.to,
            envelope.template_name,
            envelope.correlation_id,
        )
        return SendResult(success=True, provider_message_id="stub-wa-ok")


# ---------------------------------------------------------------------------
# SMTP provider
# ---------------------------------------------------------------------------


class SmtpProvider(EmailProvider):
    def __init__(self, config: dict[str, Any]) -> None:
        self._host: str = config.get("host", "localhost")
        self._port: int = int(config.get("port", 587))
        self._username: str | None = config.get("username")
        self._password: str | None = config.get("password")
        self._use_tls: bool = bool(config.get("use_tls", True))
        self._from_addr: str = config.get("from_addr", "no-reply@wealthspot.in")
        self._from_name: str = config.get("from_name", "WealthSpot")

    async def send(self, envelope: EmailEnvelope) -> SendResult:
        msg = EmailMessage()
        msg["Subject"] = envelope.subject
        msg["From"] = str(Address(display_name=envelope.from_name, addr_spec=self._from_addr))
        msg["To"] = envelope.to
        if envelope.reply_to:
            msg["Reply-To"] = envelope.reply_to

        if envelope.html:
            msg.set_content(envelope.text or "", subtype="plain")
            msg.add_alternative(envelope.html, subtype="html")
        else:
            msg.set_content(envelope.text or "")

        try:
            ctx = ssl.create_default_context() if self._use_tls else None
            with smtplib.SMTP(self._host, self._port, timeout=15) as smtp:
                if self._use_tls:
                    smtp.starttls(context=ctx)
                if self._username and self._password:
                    smtp.login(self._username, self._password)
                smtp.send_message(msg)
            return SendResult(success=True)
        except smtplib.SMTPException as exc:
            raise ProviderSendError(f"SMTP error: {exc}") from exc


# ---------------------------------------------------------------------------
# Twilio SMS provider
# ---------------------------------------------------------------------------


class TwilioSmsProvider(SmsProvider):
    def __init__(self, config: dict[str, Any]) -> None:
        self._account_sid: str = config.get("account_sid", "")
        self._auth_token: str = config.get("auth_token", "")
        self._from_number: str = config.get("from_number", "")
        if not self._account_sid or not self._auth_token:
            raise ProviderConfigError("Twilio account_sid and auth_token required")

    async def send(self, envelope: SmsEnvelope) -> SendResult:
        try:
            from twilio.rest import Client  # type: ignore[import-not-found]

            client = Client(self._account_sid, self._auth_token)
            message = await asyncio_run_in_executor(
                lambda: client.messages.create(
                    body=envelope.body,
                    from_=self._from_number,
                    to=envelope.to,
                )
            )
            return SendResult(success=True, provider_message_id=message.sid)
        except Exception as exc:
            raise ProviderSendError(f"Twilio error: {exc}") from exc


async def asyncio_run_in_executor(fn):
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fn)


# ---------------------------------------------------------------------------
# Factory functions
# ---------------------------------------------------------------------------

_SMTP_KINDS = {"smtp"}
_STUB_KINDS = {"stub"}
_TWILIO_KINDS = {"twilio"}


def build_email_provider(kind: str, config: dict[str, Any]) -> EmailProvider:
    if kind in _SMTP_KINDS:
        return SmtpProvider(config)
    if kind in _STUB_KINDS:
        return StubEmailProvider()
    log.warning("Unknown email provider kind %r — using stub", kind)
    return StubEmailProvider()


def build_sms_provider(kind: str, config: dict[str, Any]) -> SmsProvider:
    if kind in _TWILIO_KINDS:
        return TwilioSmsProvider(config)
    if kind in _STUB_KINDS:
        return StubSmsProvider()
    log.warning("Unknown SMS provider kind %r — using stub", kind)
    return StubSmsProvider()


def build_whatsapp_provider(kind: str, config: dict[str, Any]) -> WhatsAppProvider:
    if kind in _STUB_KINDS:
        return StubWhatsAppProvider()
    log.warning("Unknown WhatsApp provider kind %r — using stub", kind)
    return StubWhatsAppProvider()
