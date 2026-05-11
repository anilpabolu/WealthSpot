"""JSONLogic-based audience-rule evaluation for WSCP bindings.

Each `comm.bindings.audience_rule` column stores a JSONLogic expression.
At orchestration time the rule is evaluated against a context dict that
combines the outbox event payload with the resolved recipient user's
attributes. If the rule evaluates truthy the recipient is included.

True (the literal Python True value) is treated as "always send" and is
the default used when no audience filter is required.

Example rule:
    {"and": [
        {"==": [{"var": "user.role"}, "INVESTOR"]},
        {">": [{"var": "investment.amount_paise"}, 10000000]}
    ]}
"""

from __future__ import annotations

import logging
from typing import Any

try:
    import json_logic as _json_logic_module  # type: ignore[import-untyped]

    # json-logic 0.6.x uses `tests.keys()[0]` which fails in Python 3.
    # Detect the bug and patch by replacing the function body with a fixed version.
    _probe_ok = False
    try:
        _json_logic_module.jsonLogic({"==": [1, 1]}, {})
        _probe_ok = True
    except TypeError:
        pass

    if not _probe_ok:
        # Build a fixed version by re-exec-ing the source with keys() calls replaced.
        import sys as _sys
        import inspect as _inspect
        from functools import reduce as _reduce
        _src = _inspect.getsource(_json_logic_module.jsonLogic)
        _src_fixed = _src.replace("tests.keys()[0]", "next(iter(tests.keys()))")
        # Provide the globals that json_logic's jsonLogic function depends on.
        _ns: dict = {"sys": _sys, "reduce": _reduce}
        exec(compile(_src_fixed, "<json_logic_patched>", "exec"), _ns)  # noqa: S102
        jsonLogic = _ns["jsonLogic"]
        _json_logic_module.jsonLogic = jsonLogic  # patch module so recursive calls work
    else:
        jsonLogic = _json_logic_module.jsonLogic

except ImportError:
    jsonLogic = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


def matches(rule: Any, context: dict[str, Any]) -> bool:
    """Evaluate a JSONLogic `rule` against `context`.

    Returns True when the rule passes (recipient should receive the message).
    Returns False when the rule fails (recipient should be skipped).

    If `json-logic-py` is not installed falls back to True (always send),
    which keeps things working in stripped-down environments at the cost of
    audience filtering. A warning is logged.
    """
    if rule is True or rule == {} or rule is None:
        return True

    if jsonLogic is None:
        logger.warning(
            "json-logic-py not installed; audience rule evaluation skipped — "
            "install json-logic-py to enable audience filtering"
        )
        return True

    try:
        result = jsonLogic(rule, context)
        return bool(result)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "audience rule evaluation failed (rule=%r context_keys=%s): %s",
            rule,
            list(context.keys()),
            exc,
        )
        return False
