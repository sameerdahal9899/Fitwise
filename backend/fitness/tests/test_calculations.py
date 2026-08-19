"""
Unit tests for the calculation engine.

These tests import the engine module directly by file path so they can run
with the plain `unittest` runner and require no Django installation. The
same file also runs correctly under Django's test runner once the project
is installed (see backend/README section "Running tests").
"""
import importlib.util
import os
import sys
import unittest

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CALC_PATH = os.path.join(_THIS_DIR, "..", "services", "calculations.py")

spec = importlib.util.spec_from_file_location("calculations", _CALC_PATH)
calculations = importlib.util.module_from_spec(spec)
spec.loader.exec_module(calculations)
sys.modules.setdefault("calculations", calculations)


class ReferenceProfileTests(unittest.TestCase):
    """
    Verifies the exact reference profile from the project spec:
    Male, 25, 175cm, 70kg, moderate activity, goal=lose.
    Expected: BMI 22.9, BMR 1673.75, TDEE 2594, target ~2094 kcal/day.
    """

    def setUp(self):
        self.result = calculations.calculate_all(
            weight_kg=70,
            height_cm=175,
            age=25,
            gender="male",
            activity_level="moderate",
            goal="lose",
        )

    def test_bmi_matches_spec(self):
        self.assertAlmostEqual(self.result.bmi, 22.9, delta=0.05)

    def test_bmi_category_is_normal(self):
        self.assertEqual(self.result.bmi_category, "normal")

    def test_bmr_matches_spec_exactly(self):
        self.assertAlmostEqual(self.result.bmr, 1673.75, delta=0.01)

    def test_tdee_matches_spec(self):
        self.assertAlmostEqual(self.result.tdee, 2594, delta=1)

    def test_calorie_target_matches_spec(self):
        self.assertAlmostEqual(self.result.calorie_target, 2094, delta=1)

    def test_safety_floor_not_applied_for_reference_profile(self):
        self.assertFalse(self.result.safety_floor_applied)


class BMICategoryTests(unittest.TestCase):
    def test_underweight(self):
        self.assertEqual(calculations.bmi_category(17.9), "underweight")

    def test_boundary_18_5_is_normal(self):
        self.assertEqual(calculations.bmi_category(18.5), "normal")

    def test_normal(self):
        self.assertEqual(calculations.bmi_category(22.0), "normal")

    def test_boundary_25_is_overweight(self):
        self.assertEqual(calculations.bmi_category(25.0), "overweight")

    def test_overweight(self):
        self.assertEqual(calculations.bmi_category(27.0), "overweight")

    def test_boundary_30_is_obese(self):
        self.assertEqual(calculations.bmi_category(30.0), "obese")

    def test_obese(self):
        self.assertEqual(calculations.bmi_category(33.0), "obese")


class BMRGenderTests(unittest.TestCase):
    def test_male_formula(self):
        bmr = calculations.calculate_bmr(70, 175, 25, "male")
        self.assertAlmostEqual(bmr, 1673.75, delta=0.01)

    def test_female_formula(self):
        bmr = calculations.calculate_bmr(60, 165, 30, "female")
        expected = 10 * 60 + 6.25 * 165 - 5 * 30 - 161
        self.assertAlmostEqual(bmr, expected, delta=0.01)

    def test_other_is_average_of_male_and_female_offsets(self):
        weight, height, age = 70, 175, 25
        male = calculations.calculate_bmr(weight, height, age, "male")
        female = calculations.calculate_bmr(weight, height, age, "female")
        other = calculations.calculate_bmr(weight, height, age, "other")
        self.assertAlmostEqual(other, (male + female) / 2, delta=0.01)


class CalorieTargetSafetyTests(unittest.TestCase):
    def test_maintain_goal_equals_tdee(self):
        target, adjustment, floor_applied = calculations.calculate_calorie_target(2000, "maintain")
        self.assertEqual(target, 2000)
        self.assertEqual(adjustment, 0.0)
        self.assertFalse(floor_applied)

    def test_lose_goal_applies_fixed_deficit_when_tdee_is_large(self):
        target, adjustment, floor_applied = calculations.calculate_calorie_target(3000, "lose")
        # 25% of 3000 = 750, so the fixed 500 deficit applies (min(500, 750)=500)
        self.assertEqual(target, 2500)
        self.assertEqual(adjustment, -500)
        self.assertFalse(floor_applied)

    def test_lose_goal_applies_ratio_cap_when_tdee_is_small(self):
        # 25% of 1400 = 350, smaller than the fixed 500, so the ratio wins.
        # Raw target would be 1400 - 350 = 1050, which is below the 1200
        # safety floor, so the returned target must be clamped to 1200.
        target, adjustment, floor_applied = calculations.calculate_calorie_target(1400, "lose")
        self.assertEqual(adjustment, -350)
        self.assertTrue(floor_applied)
        self.assertEqual(target, calculations.MIN_SAFE_CALORIES_KCAL)

    def test_never_recommends_below_safety_floor(self):
        target, _, floor_applied = calculations.calculate_calorie_target(1250, "lose")
        self.assertEqual(target, calculations.MIN_SAFE_CALORIES_KCAL)
        self.assertTrue(floor_applied)

    def test_gain_goal_applies_surplus(self):
        target, adjustment, floor_applied = calculations.calculate_calorie_target(2500, "gain")
        # 20% of 2500 = 500, ties the fixed 500 -> surplus is 500
        self.assertEqual(adjustment, 500)
        self.assertEqual(target, 3000)
        self.assertFalse(floor_applied)


class InputValidationTests(unittest.TestCase):
    def test_rejects_out_of_range_age(self):
        with self.assertRaises(calculations.FitnessInputError):
            calculations.calculate_all(
                weight_kg=70, height_cm=175, age=200,
                gender="male", activity_level="moderate", goal="lose",
            )

    def test_rejects_out_of_range_weight(self):
        with self.assertRaises(calculations.FitnessInputError):
            calculations.calculate_all(
                weight_kg=-5, height_cm=175, age=25,
                gender="male", activity_level="moderate", goal="lose",
            )

    def test_rejects_invalid_gender(self):
        with self.assertRaises(calculations.FitnessInputError):
            calculations.calculate_all(
                weight_kg=70, height_cm=175, age=25,
                gender="alien", activity_level="moderate", goal="lose",
            )

    def test_rejects_invalid_activity_level(self):
        with self.assertRaises(calculations.FitnessInputError):
            calculations.calculate_all(
                weight_kg=70, height_cm=175, age=25,
                gender="male", activity_level="superhuman", goal="lose",
            )


class DeterminismTests(unittest.TestCase):
    def test_same_input_always_produces_same_output(self):
        kwargs = dict(weight_kg=82.5, height_cm=180, age=41, gender="female",
                      activity_level="active", goal="gain")
        results = [calculations.calculate_all(**kwargs) for _ in range(25)]
        self.assertEqual(len(set(results)), 1, "engine is not deterministic!")


if __name__ == "__main__":
    unittest.main(verbosity=2)
