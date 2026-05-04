"""WealthSpot Communication Platform (WSCP).

Public surface:

    from app.comm import publish, email, sms, whatsapp

`publish` is the canonical event-driven entrypoint. The `email` / `sms` /
`whatsapp` namespaces are escape hatches for ad-hoc one-off sends.
"""

from app.comm.api import email, publish, sms, whatsapp

__all__ = ["publish", "email", "sms", "whatsapp"]
