import importlib.util
import os
import sys
import unittest
from datetime import date, timedelta

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROGRESS_PATH = os.path.join(_THIS_DIR, "..", "services", "progress.py")

spec = importlib.util.spec_from_file_location("progress", _PROGRESS_PATH)
progress = importlib.util.module_from_spec(spec)
spec.loader.exec_module(progress)
sys.modules.setdefault("progress", progress)

WeightPoint = progress.WeightPoint


class TrendTests(unittest.TestCase):
    def test_none_with_fewer_than_two_points(self):
        self.assertIsNone(progress.compute_weight_trend([]))
        self.assertIsNone(progress.compute_weight_trend([WeightPoint(date.today(), 70)]))

    def test_none_when_points_are_too_close_together(self):
        today = date.today()
        points = [WeightPoint(today - timedelta(days=1), 70), WeightPoint(today, 69.9)]
        self.assertIsNone(progress.compute_weight_trend(points))

    def test_losing_trend_is_negative(self):
        today = date.today()
        points = [
            WeightPoint(today - timedelta(days=14), 80.0),
            WeightPoint(today, 79.0),
        ]
        trend = progress.compute_weight_trend(points)
        self.assertIsNotNone(trend)
        self.assertLess(trend, 0)
        # 1kg lost over 2 weeks = -0.5kg/week
        self.assertAlmostEqual(trend, -0.5, delta=0.01)

    def test_gaining_trend_is_positive(self):
        today = date.today()
        points = [
            WeightPoint(today - timedelta(days=7), 60.0),
            WeightPoint(today, 61.0),
        ]
        trend = progress.compute_weight_trend(points)
        self.assertGreater(trend, 0)

    def test_ignores_points_outside_lookback_window(self):
        today = date.today()
        points = [
            WeightPoint(today - timedelta(days=200), 100.0),  # ancient outlier
            WeightPoint(today - timedelta(days=14), 80.0),
            WeightPoint(today, 79.0),
        ]
        trend = progress.compute_weight_trend(points, lookback_days=30)
        self.assertAlmostEqual(trend, -0.5, delta=0.01)


class SummaryTests(unittest.TestCase):
    def test_empty_summary(self):
        summary = progress.summarize_progress([])
        self.assertEqual(summary["entries_count"], 0)
        self.assertIsNone(summary["current_weight_kg"])

    def test_summary_with_two_entries(self):
        today = date.today()
        points = [WeightPoint(today - timedelta(days=7), 82.0), WeightPoint(today, 80.5)]
        summary = progress.summarize_progress(points)
        self.assertEqual(summary["current_weight_kg"], 80.5)
        self.assertEqual(summary["previous_weight_kg"], 82.0)
        self.assertAlmostEqual(summary["change_kg"], -1.5, delta=0.01)
        self.assertEqual(summary["entries_count"], 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
