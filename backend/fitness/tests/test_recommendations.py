import importlib.util
import os
import sys
import unittest

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_REC_PATH = os.path.join(_THIS_DIR, "..", "services", "recommendations.py")

spec = importlib.util.spec_from_file_location("recommendations", _REC_PATH)
recommendations = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recommendations)
sys.modules.setdefault("recommendations", recommendations)

Context = recommendations.RecommendationContext
generate = recommendations.generate_recommendations


def make_ctx(**overrides):
    defaults = dict(
        bmi=22.9, bmi_category="normal", age=25, gender="male", weight_kg=70,
        activity_level="moderate", goal="lose", tdee=2594.31, bmr=1673.75,
        calorie_target=2094, safety_floor_applied=False,
        weight_trend_kg_per_week=None, entries_count=0,
    )
    defaults.update(overrides)
    return Context(**defaults)


class SpecExampleRuleTests(unittest.TestCase):
    """The two worked examples given directly in the project spec."""

    def test_lose_overweight_sedentary_gives_gradual_activity_guidance(self):
        ctx = make_ctx(bmi_category="overweight", goal="lose", activity_level="sedentary")
        keys = {r.title for r in generate(ctx)}
        self.assertIn("Build activity gradually", keys)

    def test_gain_underweight_gives_surplus_and_strength_guidance(self):
        ctx = make_ctx(bmi_category="underweight", goal="gain")
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Controlled calorie surplus", titles)


class DeterminismTests(unittest.TestCase):
    def test_same_context_always_produces_identical_output(self):
        ctx = make_ctx()
        runs = [tuple((r.title, r.message) for r in generate(ctx)) for _ in range(10)]
        self.assertEqual(len(set(runs)), 1)

    def test_output_is_sorted_by_priority(self):
        ctx = make_ctx(bmi_category="obese", goal="lose", activity_level="sedentary", age=55)
        recs = generate(ctx)
        priorities = [r.priority for r in recs]
        self.assertEqual(priorities, sorted(priorities))


class SafetyRuleTests(unittest.TestCase):
    def test_underweight_plus_goal_lose_triggers_safety_warning(self):
        ctx = make_ctx(bmi_category="underweight", goal="lose")
        categories = {r.category for r in generate(ctx)}
        self.assertIn("safety", categories)

    def test_rapid_loss_trend_flagged(self):
        ctx = make_ctx(weight_trend_kg_per_week=-1.4, entries_count=5)
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Your rate of loss looks fast", titles)

    def test_moderate_loss_trend_not_flagged_as_too_fast(self):
        ctx = make_ctx(weight_trend_kg_per_week=-0.6, entries_count=5)
        titles = {r.title for r in generate(ctx)}
        self.assertNotIn("Your rate of loss looks fast", titles)

    def test_general_disclaimer_always_present(self):
        for bmi_cat in ("underweight", "normal", "overweight", "obese"):
            for goal in ("lose", "maintain", "gain"):
                ctx = make_ctx(bmi_category=bmi_cat, goal=goal)
                titles = {r.title for r in generate(ctx)}
                self.assertIn("General guidance, not medical advice", titles)

    def test_hydration_guidance_always_present_and_scales_with_weight(self):
        light = generate(make_ctx(weight_kg=50))
        heavy = generate(make_ctx(weight_kg=100))
        light_msg = next(r.message for r in light if r.category == "hydration")
        heavy_msg = next(r.message for r in heavy if r.category == "hydration")
        self.assertNotEqual(light_msg, heavy_msg)


class TrendRuleTests(unittest.TestCase):
    def test_insufficient_entries_prompts_logging(self):
        ctx = make_ctx(entries_count=1, weight_trend_kg_per_week=None)
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Log a weight entry to unlock trend insights", titles)

    def test_enough_entries_does_not_prompt_logging(self):
        ctx = make_ctx(entries_count=5, weight_trend_kg_per_week=-0.3)
        titles = {r.title for r in generate(ctx)}
        self.assertNotIn("Log a weight entry to unlock trend insights", titles)

    def test_goal_lose_but_trend_gaining_is_flagged(self):
        ctx = make_ctx(goal="lose", weight_trend_kg_per_week=0.4, entries_count=4)
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Trend is moving opposite your goal", titles)

    def test_goal_gain_but_trend_losing_is_flagged(self):
        ctx = make_ctx(goal="gain", weight_trend_kg_per_week=-0.4, entries_count=4)
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Trend is moving opposite your goal", titles)


class AgeRuleTests(unittest.TestCase):
    def test_under_50_does_not_get_age_rule(self):
        ctx = make_ctx(age=30)
        titles = {r.title for r in generate(ctx)}
        self.assertNotIn("Prioritize strength and mobility", titles)

    def test_50_plus_gets_age_rule(self):
        ctx = make_ctx(age=52)
        titles = {r.title for r in generate(ctx)}
        self.assertIn("Prioritize strength and mobility", titles)


if __name__ == "__main__":
    unittest.main(verbosity=2)
