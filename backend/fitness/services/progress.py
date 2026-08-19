"""
Progress/trend helpers. Kept pure (plain dates + floats in, float|None out)
so they're trivial to unit test without touching the database.
"""
from dataclasses import dataclass
from datetime import date
from typing import Optional, Sequence


@dataclass(frozen=True)
class WeightPoint:
    recorded_at: date
    weight_kg: float


def compute_weight_trend(points: Sequence[WeightPoint], lookback_days: int = 30) -> Optional[float]:
    """
    Returns kg/week trend using the earliest point within `lookback_days` of
    the most recent point, and the most recent point itself. Returns None
    when there isn't enough data (fewer than 2 points, or the points are
    too close together in time to give a stable signal).
    """
    if len(points) < 2:
        return None

    ordered = sorted(points, key=lambda p: p.recorded_at)
    latest = ordered[-1]
    cutoff = latest.recorded_at.toordinal() - lookback_days
    window = [p for p in ordered if p.recorded_at.toordinal() >= cutoff]

    if len(window) < 2:
        return None

    baseline = window[0]
    days_apart = latest.recorded_at.toordinal() - baseline.recorded_at.toordinal()
    if days_apart < 3:
        # Too close together to be a meaningful weekly rate.
        return None

    weeks_apart = days_apart / 7
    return (latest.weight_kg - baseline.weight_kg) / weeks_apart


def summarize_progress(points: Sequence[WeightPoint]) -> dict:
    """Small summary used by the /api/progress/summary/ endpoint."""
    if not points:
        return {
            "current_weight_kg": None,
            "previous_weight_kg": None,
            "change_kg": None,
            "trend_kg_per_week": None,
            "entries_count": 0,
        }

    ordered = sorted(points, key=lambda p: (p.recorded_at, p.recorded_at), reverse=True)
    current = ordered[0]
    previous = ordered[1] if len(ordered) > 1 else None

    return {
        "current_weight_kg": current.weight_kg,
        "previous_weight_kg": previous.weight_kg if previous else None,
        "change_kg": round(current.weight_kg - previous.weight_kg, 2) if previous else None,
        "trend_kg_per_week": compute_weight_trend(points),
        "entries_count": len(points),
    }
