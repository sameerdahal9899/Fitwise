"""
FitWise Calculation Engine
===========================

This module is the SINGLE SOURCE OF TRUTH for every fitness metric FitWise
produces. It is intentionally kept free of any Django import so that it can
be unit tested in complete isolation and reused anywhere (management
commands, background jobs, tests) without booting the web framework.

Design rules (do not violate these when extending the engine):

1. Deterministic — the same inputs must always produce the same outputs.
   No randomness, no wall-clock dependence, no hidden state.
2. Explainable — every number below traces back to a named, published
   formula. No black boxes.
3. Safety-bounded — the engine will never emit a calorie target below a
   medically conservative floor, regardless of what the inputs ask for.
4. Backend is authoritative — the frontend never recomputes these values;
   it only displays what this module returns.

Formulas used
-------------
BMI (Body Mass Index):
    BMI = weight_kg / height_m^2

BMR (Basal Metabolic Rate) — Mifflin-St Jeor Equation:
    Male:   BMR = 10*weight_kg + 6.25*height_cm - 5*age + 5
    Female: BMR = 10*weight_kg + 6.25*height_cm - 5*age - 161

    Mifflin-St Jeor was derived from male/female data only. For users who
    select "other" for gender we do not silently coerce them into one
    bucket; instead we average the male and female constant offsets
    ((+5) and (-161) -> -78). This is a documented, deterministic
    approximation, not a medical judgement, and the dashboard always
    labels it as such.

TDEE (Total Daily Energy Expenditure):
    TDEE = BMR * activity_multiplier

Daily calorie target:
    lose:     TDEE - min(FIXED_ADJUSTMENT_KCAL, TDEE * MAX_DEFICIT_RATIO)
    maintain: TDEE
    gain:     TDEE + min(FIXED_ADJUSTMENT_KCAL, TDEE * MAX_SURPLUS_RATIO)
    ...then clamped to never fall below MIN_SAFE_CALORIES_KCAL.

Reference profile (male, 25, 175cm, 70kg, moderate activity, goal=lose)
is verified in tests/test_calculations.py against the figures in the
project spec: BMI 22.9, BMR 1673.75, TDEE 2594, target ~2094 kcal/day.
"""

from dataclasses import dataclass, asdict
from typing import Optional


# ---------------------------------------------------------------------------
# Constants — the single source of truth for valid ranges & multipliers.
# Serializers (input validation) and the engine (computation) both import
# these so the two layers can never silently drift apart.
# ---------------------------------------------------------------------------

GENDER_CHOICES = ("male", "female", "other")
GOAL_CHOICES = ("lose", "maintain", "gain")

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,      # little or no exercise, desk job
    "light": 1.375,        # light exercise 1-3 days/week
    "moderate": 1.55,      # moderate exercise 3-5 days/week
    "active": 1.725,       # hard exercise 6-7 days/week
    "very_active": 1.9,    # very hard exercise, physical job, 2x/day training
}

ACTIVITY_LEVEL_LABELS = {
    "sedentary": "Sedentary",
    "light": "Lightly active",
    "moderate": "Moderately active",
    "active": "Active",
    "very_active": "Very active",
}

# Sane human ranges. Anything outside these is rejected before it ever
# reaches the calculation engine (see fitness/serializers.py).
MIN_AGE, MAX_AGE = 13, 100
MIN_HEIGHT_CM, MAX_HEIGHT_CM = 100, 250
MIN_WEIGHT_KG, MAX_WEIGHT_KG = 30, 300

# Safety limits for calorie targets. These are deliberately conservative
# general-population defaults, not individualized medical thresholds.
MIN_SAFE_CALORIES_KCAL = 1200
FIXED_ADJUSTMENT_KCAL = 500       # standard ~0.45kg/week pace
MAX_DEFICIT_RATIO = 0.25          # deficit never exceeds 25% of TDEE
MAX_SURPLUS_RATIO = 0.20          # surplus never exceeds 20% of TDEE

# BMI category thresholds (WHO standard adult classification).
BMI_UNDERWEIGHT_MAX = 18.5
BMI_NORMAL_MAX = 25.0
BMI_OVERWEIGHT_MAX = 30.0


class FitnessInputError(ValueError):
    """Raised when inputs are out of the physiologically valid range."""


@dataclass(frozen=True)
class CalculationResult:
    bmi: float
    bmi_category: str
    bmr: float
    tdee: float
    calorie_target: int
    activity_multiplier: float
    goal_adjustment_kcal: float  # signed: negative for deficit, positive for surplus
    safety_floor_applied: bool

    def to_dict(self) -> dict:
        return asdict(self)


def _validate_inputs(weight_kg: float, height_cm: float, age: int, gender: str, activity_level: str, goal: str) -> None:
    if not (MIN_WEIGHT_KG <= weight_kg <= MAX_WEIGHT_KG):
        raise FitnessInputError(f"weight_kg must be between {MIN_WEIGHT_KG} and {MAX_WEIGHT_KG}")
    if not (MIN_HEIGHT_CM <= height_cm <= MAX_HEIGHT_CM):
        raise FitnessInputError(f"height_cm must be between {MIN_HEIGHT_CM} and {MAX_HEIGHT_CM}")
    if not (MIN_AGE <= age <= MAX_AGE):
        raise FitnessInputError(f"age must be between {MIN_AGE} and {MAX_AGE}")
    if gender not in GENDER_CHOICES:
        raise FitnessInputError(f"gender must be one of {GENDER_CHOICES}")
    if activity_level not in ACTIVITY_MULTIPLIERS:
        raise FitnessInputError(f"activity_level must be one of {tuple(ACTIVITY_MULTIPLIERS)}")
    if goal not in GOAL_CHOICES:
        raise FitnessInputError(f"goal must be one of {GOAL_CHOICES}")


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """BMI = weight_kg / height_m^2"""
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)


def bmi_category(bmi: float) -> str:
    if bmi < BMI_UNDERWEIGHT_MAX:
        return "underweight"
    if bmi < BMI_NORMAL_MAX:
        return "normal"
    if bmi < BMI_OVERWEIGHT_MAX:
        return "overweight"
    return "obese"


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor Equation."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender == "male":
        return base + 5
    if gender == "female":
        return base - 161
    # "other": documented average of the male (+5) and female (-161) offsets.
    return base + ((5 + -161) / 2)


def calculate_tdee(bmr: float, activity_level: str) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[activity_level]


def calculate_calorie_target(tdee: float, goal: str) -> tuple[int, float, bool]:
    """
    Returns (target_kcal, signed_adjustment_kcal, safety_floor_applied).
    """
    if goal == "lose":
        adjustment = -min(FIXED_ADJUSTMENT_KCAL, tdee * MAX_DEFICIT_RATIO)
    elif goal == "gain":
        adjustment = min(FIXED_ADJUSTMENT_KCAL, tdee * MAX_SURPLUS_RATIO)
    else:
        adjustment = 0.0

    raw_target = tdee + adjustment
    floor_applied = raw_target < MIN_SAFE_CALORIES_KCAL
    target = max(raw_target, MIN_SAFE_CALORIES_KCAL)
    return round(target), adjustment, floor_applied


def calculate_all(
    *,
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
    goal: str,
) -> CalculationResult:
    """
    Single entry point the rest of the application should call. Runs full
    input validation, then produces every derived metric in one pass so
    BMI/BMR/TDEE/target can never be computed from inconsistent inputs.
    """
    _validate_inputs(weight_kg, height_cm, age, gender, activity_level, goal)

    bmi = calculate_bmi(weight_kg, height_cm)
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    target, adjustment, floor_applied = calculate_calorie_target(tdee, goal)

    return CalculationResult(
        bmi=round(bmi, 1),
        bmi_category=bmi_category(bmi),
        bmr=round(bmr, 2),
        tdee=round(tdee, 2),
        calorie_target=target,
        activity_multiplier=ACTIVITY_MULTIPLIERS[activity_level],
        goal_adjustment_kcal=round(adjustment, 1),
        safety_floor_applied=floor_applied,
    )
