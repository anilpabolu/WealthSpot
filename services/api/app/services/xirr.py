"""
XIRR (Extended Internal Rate of Return) calculation service.
Computes annualised returns from a series of dated cashflows.
"""

from datetime import datetime
from decimal import Decimal


def calculate_xirr(
    cashflows: list[tuple[datetime, float | Decimal]],
    guess: float = 0.1,
    max_iterations: int = 100,
    tolerance: float = 1e-7,
) -> float | None:
    """
    Calculate Extended IRR from dated cashflows using Newton's method.

    Args:
        cashflows: List of (date, amount) tuples. Negative = outflow, positive = inflow.
        guess: Initial rate guess.
        max_iterations: Max Newton-Raphson iterations.
        tolerance: Convergence tolerance.

    Returns:
        Annualised rate as a float (e.g., 0.12 for 12%), or None if it fails to converge.
    """
    if not cashflows or len(cashflows) < 2:
        return None

    dates = [cf[0] for cf in cashflows]
    amounts = [float(cf[1]) for cf in cashflows]

    # Must have at least one positive and one negative cashflow
    has_positive = any(a > 0 for a in amounts)
    has_negative = any(a < 0 for a in amounts)
    if not (has_positive and has_negative):
        return None

    min_date = min(dates)
    years = [(d - min_date).days / 365.25 for d in dates]

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
            return round(new_rate * 100, 2)  # Return as percentage

        rate = new_rate

    return None  # Did not converge
