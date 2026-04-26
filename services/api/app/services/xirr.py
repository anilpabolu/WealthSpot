"""
XIRR (Extended Internal Rate of Return) calculation service.
Computes annualised returns from a series of dated cashflows.

Formula (conventional notation):
    ∑  Cₜ / (1 + r)^(tₜ/365.25)  =  0
    where Cₜ = cashflow at time t (negative = outflow, positive = inflow),
    tₜ = days from first cashflow, r = annualised rate being solved for.

Newton–Raphson iteration:
    r_{n+1} = r_n  −  f(r_n) / f'(r_n)
where
    f(r)  = ∑ Cₜ(1+r)^{-tₜ/365.25}
    f'(r) = ∑ −(tₜ/365.25) · Cₜ · (1+r)^{-(tₜ/365.25 + 1)}

When Newton–Raphson fails to converge (e.g., extremely high short-hold returns),
a simple annualised-return fallback is used:
    fallback = ((terminal_inflow / |total_outflows|) ^ (365.25 / hold_days) − 1) × 100
capped at 9 999.99 % to keep the UI readable.
"""

from datetime import datetime
from decimal import Decimal

# Starting guesses tried in sequence — wider spread catches high-IRR scenarios
_GUESSES = [0.1, 0.5, 2.0, 10.0, 50.0, 100.0]
_XIRR_CAP = 9_999.99


def _newton_raphson(
    amounts: list[float],
    years: list[float],
    guess: float,
    max_iterations: int,
    tolerance: float,
) -> float | None:
    """Single Newton–Raphson pass from a given starting guess."""
    rate = guess
    for _ in range(max_iterations):
        npv = 0.0
        dnpv = 0.0
        for amount, year in zip(amounts, years, strict=False):
            denom = (1.0 + rate) ** year
            if denom == 0:
                return None
            npv += amount / denom
            if year != 0:
                dnpv -= year * amount / ((1.0 + rate) ** (year + 1))
        if abs(dnpv) < 1e-12:
            return None
        new_rate = rate - npv / dnpv
        if abs(new_rate - rate) < tolerance:
            return new_rate
        rate = new_rate
    return None


def _simple_annualized_return(
    amounts: list[float],
    dates: list[datetime],
) -> float:
    """
    Simple annualised return fallback when Newton–Raphson diverges.

    Computes: ((terminal_inflow / |total_outflows|) ^ (365.25 / hold_days) − 1) × 100
    Capped at _XIRR_CAP.
    """
    inflow = sum(a for a in amounts if a > 0)
    outflow = abs(sum(a for a in amounts if a < 0))
    if outflow == 0 or inflow == 0:
        return 0.0
    min_date = min(dates)
    max_date = max(dates)
    hold_days = max((max_date - min_date).days, 1)
    try:
        rate = ((inflow / outflow) ** (365.25 / hold_days) - 1.0) * 100.0
    except (ZeroDivisionError, OverflowError):
        return 0.0
    return round(min(rate, _XIRR_CAP), 2)


def calculate_xirr(
    cashflows: list[tuple[datetime, float | Decimal]],
    max_iterations: int = 100,
    tolerance: float = 1e-7,
    guess: float | None = None,
) -> float | None:
    """
    Calculate Extended IRR from dated cashflows using Newton's method.

    Tries multiple starting guesses to handle high-return scenarios.
    Falls back to a simple annualised return if all guesses diverge.

    Args:
        cashflows: List of (date, amount) tuples. Negative = outflow, positive = inflow.
        max_iterations: Max Newton-Raphson iterations per guess.
        tolerance: Convergence tolerance.
        guess: Optional starting guess for Newton-Raphson (tried first before defaults).

    Returns:
        Annualised rate as a percentage float (e.g., 12.5 for 12.5 %),
        or None if cashflows are insufficient.
    """
    if not cashflows or len(cashflows) < 2:
        return None

    dates = [cf[0] for cf in cashflows]
    amounts = [float(cf[1]) for cf in cashflows]

    # Must have at least one positive and one negative cashflow
    if not any(a > 0 for a in amounts) or not any(a < 0 for a in amounts):
        return None

    min_date = min(dates)
    years = [(d - min_date).days / 365.25 for d in dates]

    # Build ordered list of guesses: caller-supplied first, then defaults
    guesses_to_try = ([guess] if guess is not None else []) + _GUESSES

    # Try each starting guess — return first convergent result
    for g in guesses_to_try:
        rate = _newton_raphson(amounts, years, g, max_iterations, tolerance)
        if rate is not None and -1.0 < rate < 1e6:
            result = round(rate * 100, 2)
            return min(result, _XIRR_CAP)

    # Fallback: simple annualised return when Newton–Raphson diverges
    return _simple_annualized_return(amounts, dates)
