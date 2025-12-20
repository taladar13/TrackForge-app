"""Unit tests for calculation functions."""

import pytest

from app.domains.nutrition.service import calculate_adherence
from app.domains.nutrition.schemas import MacroTotals
from app.domains.workouts.service import calculate_session_totals
from app.domains.progress.service import get_adherence_status


class TestDietAdherence:
    """Test diet adherence calculations."""

    def test_perfect_adherence(self):
        """Test 100% adherence when actual equals planned."""
        planned = MacroTotals(calories=2000, protein=150, carbs=200, fat=70)
        actual = MacroTotals(calories=2000, protein=150, carbs=200, fat=70)
        
        adherence = calculate_adherence(actual, planned)
        assert adherence == 100

    def test_zero_planned_returns_100(self):
        """Test zero planned calories returns 100% adherence."""
        planned = MacroTotals(calories=0, protein=0, carbs=0, fat=0)
        actual = MacroTotals(calories=500, protein=50, carbs=50, fat=20)
        
        adherence = calculate_adherence(actual, planned)
        assert adherence == 100

    def test_50_percent_deviation(self):
        """Test ~50% adherence with 50% deviation."""
        planned = MacroTotals(calories=2000, protein=100, carbs=200, fat=80)
        actual = MacroTotals(calories=1000, protein=50, carbs=100, fat=40)  # 50% of planned
        
        adherence = calculate_adherence(actual, planned)
        assert adherence == 50

    def test_adherence_clamped_to_0_100(self):
        """Test adherence is clamped between 0 and 100."""
        planned = MacroTotals(calories=2000, protein=100, carbs=200, fat=80)
        actual = MacroTotals(calories=0, protein=0, carbs=0, fat=0)  # 100% deviation
        
        adherence = calculate_adherence(actual, planned)
        assert 0 <= adherence <= 100

    def test_overeating_reduces_adherence(self):
        """Test eating more than planned reduces adherence."""
        planned = MacroTotals(calories=2000, protein=150, carbs=200, fat=70)
        actual = MacroTotals(calories=2500, protein=180, carbs=250, fat=90)  # ~25% over
        
        adherence = calculate_adherence(actual, planned)
        assert adherence < 100
        assert adherence > 50  # Should still be reasonable


class TestAdherenceStatus:
    """Test adherence status color coding."""

    def test_green_status(self):
        """Test green status for high adherence."""
        assert get_adherence_status(95) == "green"
        assert get_adherence_status(90) == "green"
        assert get_adherence_status(100) == "green"

    def test_yellow_status(self):
        """Test yellow status for medium adherence."""
        assert get_adherence_status(85) == "yellow"
        assert get_adherence_status(75) == "yellow"
        assert get_adherence_status(70) == "yellow"

    def test_red_status(self):
        """Test red status for low adherence."""
        assert get_adherence_status(69) == "red"
        assert get_adherence_status(50) == "red"
        assert get_adherence_status(0) == "red"


class TestSessionTotals:
    """Test workout session total calculations."""

    def test_empty_sets(self):
        """Test totals with no sets."""
        from unittest.mock import MagicMock
        
        totals = calculate_session_totals([], None, None)
        
        assert totals.total_sets == 0
        assert totals.total_volume == 0
        assert totals.duration is None

    def test_volume_calculation(self):
        """Test volume is weight * reps for completed sets."""
        from unittest.mock import MagicMock
        
        sets = [
            MagicMock(weight=100, reps=10, completed=True),
            MagicMock(weight=100, reps=8, completed=True),
            MagicMock(weight=100, reps=6, completed=False),  # Not completed
        ]
        
        totals = calculate_session_totals(sets, None, None)
        
        assert totals.total_sets == 2
        assert totals.total_volume == 1800  # 100*10 + 100*8

    def test_duration_calculation(self):
        """Test duration is calculated from start/end times."""
        from datetime import datetime, UTC
        from unittest.mock import MagicMock
        
        start = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)
        end = datetime(2024, 1, 1, 11, 15, 0, tzinfo=UTC)
        
        totals = calculate_session_totals([], start, end)
        
        assert totals.duration == 75  # 75 minutes


