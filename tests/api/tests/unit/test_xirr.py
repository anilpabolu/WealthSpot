"""Unit tests for XIRR calculation service."""

from datetime import datetime
from decimal import Decimal

import pytest

from app.services.xirr import calculate_xirr


class TestCalculateXirr:
    """Tests for calculate_xirr()."""

    def test_simple_positive_return(self):
        """Investment doubles in one year → ~100% return."""
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), 2000),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert result == pytest.approx(100.0, abs=1.0)

    def test_zero_return(self):
        """Get back exactly what was invested → 0% return."""
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), 1000),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert result == pytest.approx(0.0, abs=0.5)

    def test_negative_return(self):
        """Get back less than invested → negative return."""
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), 500),
        ]
        result = calculate_xirr(cashflows, guess=-0.3)
        assert result is not None
        assert result < 0

    def test_multiple_cashflows(self):
        """Multiple inflows at different dates."""
        cashflows = [
            (datetime(2023, 1, 1), -10000),
            (datetime(2023, 7, 1), 3000),
            (datetime(2024, 1, 1), 4000),
            (datetime(2024, 7, 1), 5000),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert result > 0

    def test_decimal_amounts(self):
        """Works with Decimal inputs."""
        cashflows = [
            (datetime(2023, 1, 1), Decimal("-5000.50")),
            (datetime(2024, 1, 1), Decimal("6000.75")),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert isinstance(result, float)

    def test_empty_cashflows_returns_none(self):
        result = calculate_xirr([])
        assert result is None

    def test_single_cashflow_returns_none(self):
        result = calculate_xirr([(datetime(2023, 1, 1), -1000)])
        assert result is None

    def test_all_positive_returns_none(self):
        """No negative cashflow = no valid XIRR."""
        cashflows = [
            (datetime(2023, 1, 1), 1000),
            (datetime(2024, 1, 1), 2000),
        ]
        result = calculate_xirr(cashflows)
        assert result is None

    def test_all_negative_returns_none(self):
        """No positive cashflow = no valid XIRR."""
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), -2000),
        ]
        result = calculate_xirr(cashflows)
        assert result is None

    def test_result_is_percentage(self):
        """Result should be expressed as percentage (e.g. 12.5, not 0.125)."""
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), 1120),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert result == pytest.approx(12.0, abs=1.0)

    def test_custom_guess(self):
        cashflows = [
            (datetime(2023, 1, 1), -1000),
            (datetime(2024, 1, 1), 1500),
        ]
        result = calculate_xirr(cashflows, guess=0.5)
        assert result is not None
        assert result == pytest.approx(50.0, abs=1.0)

    def test_short_period(self):
        """Cashflow within a few months still works."""
        cashflows = [
            (datetime(2024, 1, 1), -10000),
            (datetime(2024, 4, 1), 10500),
        ]
        result = calculate_xirr(cashflows)
        assert result is not None
        assert result > 0
