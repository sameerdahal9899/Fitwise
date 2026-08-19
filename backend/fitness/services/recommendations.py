"""
FitWise Recommendation Engine
==============================

A deterministic, rule-based engine. There is NO machine learning and NO
call to any external/AI service anywhere in this module — every
recommendation is the output of an explicit, readable condition written by
a human and traceable back to this file.

How it works
------------
`RECOMMENDATION_RULES` is an ordered list of `Rule` objects. Each rule has:
  - a `condition(ctx)` function that inspects a `RecommendationContext`
    and returns True/False
  - a `build(ctx)` function that returns a `Recommendation`

`generate_recommendations(ctx)` walks the list *in order* and collects every
rule whose condition matches. Because the list order and each condition are
fixed, the same profile always produces the same output list in the same
order — this is what "deterministic" means here, and it's covered by
tests/test_recommendations.py.

Adding a new rule later is a matter of appending a new `Rule(...)` to the
list — nothing else in the engine needs to change. That is the extensibility
the project spec asks for.

None of this is medical advice. Every recommendation is general fitness
guidance; several rules explicitly tell the user to consult a healthcare
professional when the situation calls for individualized medical judgement
(e.g. being underweight, being over 50 and increasing training load, or
rapid unintended weight change).
"""

from dataclasses import dataclass
from typing import Callable, Optional


@dataclass(frozen=True)
class RecommendationContext:
    """Every input a recommendation rule is allowed to look at."""
    bmi: float
    bmi_category: str          # underweight | normal | overweight | obese
    age: int
    gender: str                # male | female | other
    weight_kg: float
    activity_level: str        # sedentary | light | moderate | active | very_active
    goal: str                  # lose | maintain | gain
    tdee: float
    bmr: float
    calorie_target: int
    safety_floor_applied: bool
    # Optional trend data, only present once a user has 2+ weight entries.
    weight_trend_kg_per_week: Optional[float] = None  # positive = gaining, negative = losing
    entries_count: int = 0


@dataclass(frozen=True)
class Recommendation:
    category: str      # nutrition | calorie | activity | weight_management | hydration | general | progress | safety
    title: str
    message: str
    priority: int       # lower = more important; used only for stable ordering, never randomized


@dataclass(frozen=True)
class Rule:
    key: str  # stable identifier, useful for tests and future analytics
    condition: Callable[[RecommendationContext], bool]
    build: Callable[[RecommendationContext], Recommendation]


# ---------------------------------------------------------------------------
# Individual rules
# ---------------------------------------------------------------------------

def _rule_underweight_goal_lose(ctx: RecommendationContext) -> bool:
    return ctx.bmi_category == "underweight" and ctx.goal == "lose"


def _build_underweight_goal_lose(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="safety",
        title="Check this goal with a professional",
        message=(
            "Your BMI is currently in the underweight range, and your goal is set to "
            "lose weight. Before continuing, we'd strongly encourage a conversation "
            "with a doctor or registered dietitian — further weight loss from an "
            "underweight starting point can carry real health risks."
        ),
        priority=0,
    )


def _rule_underweight_goal_gain(ctx: RecommendationContext) -> bool:
    return ctx.bmi_category == "underweight" and ctx.goal == "gain"


def _build_underweight_goal_gain(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="nutrition",
        title="Controlled calorie surplus",
        message=(
            f"With a BMI in the underweight range, a steady surplus of roughly "
            f"{ctx.calorie_target - ctx.tdee:.0f} kcal/day above maintenance, paired "
            f"with resistance training, is a sensible way to rebuild weight as lean "
            f"mass rather than only fat. Favor protein-dense, calorie-dense whole foods."
        ),
        priority=1,
    )


def _rule_overweight_or_obese_sedentary_lose(ctx: RecommendationContext) -> bool:
    return ctx.bmi_category in ("overweight", "obese") and ctx.goal == "lose" and ctx.activity_level == "sedentary"


def _build_overweight_or_obese_sedentary_lose(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="activity",
        title="Build activity gradually",
        message=(
            "Your current activity level is sedentary. Rather than combining a large "
            "jump in exercise with a calorie deficit at the same time, start with "
            "short daily walks (10-15 minutes) and build up over a few weeks. "
            "Pairing a modest, sustainable calorie deficit with gradually increasing "
            "movement tends to stick far better than an aggressive plan on both fronts."
        ),
        priority=1,
    )


def _rule_overweight_or_obese_active_lose(ctx: RecommendationContext) -> bool:
    return ctx.bmi_category in ("overweight", "obese") and ctx.goal == "lose" and ctx.activity_level != "sedentary"


def _build_overweight_or_obese_active_lose(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="nutrition",
        title="Focus on nutrition quality",
        message=(
            "You're already active, so the highest-leverage change for your goal is "
            "usually nutrition consistency rather than adding more exercise: prioritize "
            "protein at each meal, minimize ultra-processed and high-sugar foods, and "
            "keep your deficit moderate so it's sustainable week to week."
        ),
        priority=2,
    )


def _rule_normal_bmi_goal_lose(ctx: RecommendationContext) -> bool:
    return ctx.bmi_category == "normal" and ctx.goal == "lose"


def _build_normal_bmi_goal_lose(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="weight_management",
        title="You're already in the typical range",
        message=(
            "Your BMI already falls in the typical range for your height. If your goal "
            "is body composition or performance rather than the number on the scale, "
            "consider tracking measurements or strength progress alongside weight. "
            "Keep any deficit modest — large, prolonged deficits from a normal starting "
            "weight are more likely to affect energy and muscle mass."
        ),
        priority=2,
    )


def _rule_goal_maintain(ctx: RecommendationContext) -> bool:
    return ctx.goal == "maintain"


def _build_goal_maintain(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="weight_management",
        title="Consistency over precision",
        message=(
            f"Your maintenance target is about {ctx.calorie_target} kcal/day. Small "
            f"day-to-day swings are normal and not worth chasing exactly — instead, "
            f"watch your weekly average weight. If it drifts more than about 1-2kg "
            f"over a few weeks, that's the signal to adjust intake, not any single day."
        ),
        priority=2,
    )


def _rule_sedentary_activity_general(ctx: RecommendationContext) -> bool:
    return ctx.activity_level == "sedentary"


def _build_sedentary_activity_general(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="activity",
        title="Aim for regular movement",
        message=(
            "General guidance for adults is at least 150 minutes per week of "
            "moderate-intensity activity (e.g. brisk walking), spread across most "
            "days. Any increase from your current baseline is a meaningful step, and "
            "it doesn't need to happen all at once."
        ),
        priority=3,
    )


def _rule_age_50_plus(ctx: RecommendationContext) -> bool:
    return ctx.age >= 50


def _build_age_50_plus(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="activity",
        title="Prioritize strength and mobility",
        message=(
            "From your 50s onward, preserving muscle mass and bone density becomes "
            "increasingly important. Consider adding 2 sessions per week of resistance "
            "training if you aren't already, and check in with a doctor before making "
            "significant changes to training intensity or calorie intake."
        ),
        priority=3,
    )


def _rule_hydration_always(ctx: RecommendationContext) -> bool:
    return True  # always included


def _build_hydration_always(ctx: RecommendationContext) -> Recommendation:
    liters = round(ctx.weight_kg * 0.033, 1)
    return Recommendation(
        category="hydration",
        title="Daily hydration guideline",
        message=(
            f"A commonly cited general guideline is about {liters}L of water per day "
            f"for your body weight, more if you're training hard or it's hot. Thirst, "
            f"urine color, and how you feel are more useful day-to-day signals than "
            f"hitting an exact number."
        ),
        priority=4,
    )


def _rule_trend_losing_too_fast(ctx: RecommendationContext) -> bool:
    return (
        ctx.weight_trend_kg_per_week is not None
        and ctx.weight_trend_kg_per_week <= -1.0
    )


def _build_trend_losing_too_fast(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="progress",
        title="Your rate of loss looks fast",
        message=(
            f"Your recent weight trend is about {abs(ctx.weight_trend_kg_per_week):.1f}kg/week, "
            f"which is faster than the generally recommended 0.5-1kg/week. Rapid loss "
            f"is more likely to include muscle along with fat. Consider easing your "
            f"deficit, and mention this pace to a doctor if it continues."
        ),
        priority=1,
    )


def _rule_trend_lose_goal_but_gaining(ctx: RecommendationContext) -> bool:
    return (
        ctx.goal == "lose"
        and ctx.weight_trend_kg_per_week is not None
        and ctx.weight_trend_kg_per_week > 0.15
    )


def _build_trend_lose_goal_but_gaining(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="progress",
        title="Trend is moving opposite your goal",
        message=(
            "Your recent entries show weight trending up while your goal is set to "
            "lose. This is common and not a failure — it's usually worth a closer look "
            "at portion sizes, logging consistency, or whether your current target "
            "still matches your activity level."
        ),
        priority=2,
    )


def _rule_trend_gain_goal_but_losing(ctx: RecommendationContext) -> bool:
    return (
        ctx.goal == "gain"
        and ctx.weight_trend_kg_per_week is not None
        and ctx.weight_trend_kg_per_week < -0.15
    )


def _build_trend_gain_goal_but_losing(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="progress",
        title="Trend is moving opposite your goal",
        message=(
            "Your recent entries show weight trending down while your goal is set to "
            "gain. Consider increasing intake slightly, and double-check meal "
            "consistency day to day — surpluses are easy to underestimate."
        ),
        priority=2,
    )


def _rule_progress_insufficient_data(ctx: RecommendationContext) -> bool:
    return ctx.entries_count < 2


def _build_progress_insufficient_data(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="progress",
        title="Log a weight entry to unlock trend insights",
        message=(
            "Once you've logged at least two weight entries, FitWise can show you a "
            "trend and tailor guidance to whether you're moving toward your goal."
        ),
        priority=4,
    )


def _rule_general_disclaimer(ctx: RecommendationContext) -> bool:
    return True  # always included, always last in priority (highest number = shown last)


def _build_general_disclaimer(ctx: RecommendationContext) -> Recommendation:
    return Recommendation(
        category="general",
        title="General guidance, not medical advice",
        message=(
            "These recommendations are general fitness guidance generated from your "
            "profile using published formulas and public health guidelines. They are "
            "not a medical diagnosis or treatment plan. For personal medical concerns, "
            "including any existing condition, medication, pregnancy, or eating "
            "disorder history, please consult a qualified healthcare professional."
        ),
        priority=5,
    )


# Order matters for readability only — final display order is controlled by
# `priority` on the built Recommendation, with list order as a stable
# tiebreaker (Python's sort is stable), which keeps output fully deterministic.
RECOMMENDATION_RULES: list[Rule] = [
    Rule("underweight_goal_lose", _rule_underweight_goal_lose, _build_underweight_goal_lose),
    Rule("underweight_goal_gain", _rule_underweight_goal_gain, _build_underweight_goal_gain),
    Rule("overweight_obese_sedentary_lose", _rule_overweight_or_obese_sedentary_lose, _build_overweight_or_obese_sedentary_lose),
    Rule("overweight_obese_active_lose", _rule_overweight_or_obese_active_lose, _build_overweight_or_obese_active_lose),
    Rule("normal_bmi_goal_lose", _rule_normal_bmi_goal_lose, _build_normal_bmi_goal_lose),
    Rule("goal_maintain", _rule_goal_maintain, _build_goal_maintain),
    Rule("sedentary_activity_general", _rule_sedentary_activity_general, _build_sedentary_activity_general),
    Rule("age_50_plus", _rule_age_50_plus, _build_age_50_plus),
    Rule("trend_losing_too_fast", _rule_trend_losing_too_fast, _build_trend_losing_too_fast),
    Rule("trend_lose_goal_but_gaining", _rule_trend_lose_goal_but_gaining, _build_trend_lose_goal_but_gaining),
    Rule("trend_gain_goal_but_losing", _rule_trend_gain_goal_but_losing, _build_trend_gain_goal_but_losing),
    Rule("progress_insufficient_data", _rule_progress_insufficient_data, _build_progress_insufficient_data),
    Rule("hydration_always", _rule_hydration_always, _build_hydration_always),
    Rule("general_disclaimer", _rule_general_disclaimer, _build_general_disclaimer),
]


def generate_recommendations(ctx: RecommendationContext) -> list[Recommendation]:
    """
    Deterministically evaluate every rule against `ctx` and return the
    matching recommendations, sorted by priority (ascending) with the
    rule-definition order as a stable tiebreaker.
    """
    matched = [rule.build(ctx) for rule in RECOMMENDATION_RULES if rule.condition(ctx)]
    matched.sort(key=lambda rec: rec.priority)
    return matched
