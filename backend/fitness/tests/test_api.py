from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from fitness.models import FitnessProfile, WeightEntry

REFERENCE_PROFILE = {
    "age": 25,
    "gender": "male",
    "height_cm": 175,
    "activity_level": "moderate",
    "goal": "lose",
    "weight_kg": 70,
}


class ProfileCreationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="profile@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_get_profile_404_before_creation(self):
        response = self.client.get(reverse("fitness-profile"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_profile_also_seeds_first_weight_entry(self):
        response = self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["current_weight_kg"], 70)
        self.assertEqual(WeightEntry.objects.filter(user=self.user).count(), 1)

    def test_cannot_create_profile_twice(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        second = self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)

    def test_backend_rejects_invalid_values_even_if_frontend_would_not(self):
        bad_payload = {**REFERENCE_PROFILE, "age": 999}
        response = self.client.post(reverse("fitness-profile"), bad_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_profile_does_not_accept_weight_field(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        response = self.client.patch(reverse("fitness-profile"), {"goal": "maintain"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["goal"], "maintain")
        # weight is unaffected by profile edits — still 70 from the seed entry
        self.assertEqual(response.data["current_weight_kg"], 70)


class CalculationsEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="calc@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_calculations_match_reference_profile(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        response = self.client.get(reverse("fitness-calculations"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertAlmostEqual(response.data["bmi"], 22.9, delta=0.05)
        self.assertAlmostEqual(response.data["bmr"], 1673.75, delta=0.01)
        self.assertAlmostEqual(response.data["tdee"], 2594, delta=1)
        self.assertAlmostEqual(response.data["calorie_target"], 2094, delta=1)

    def test_calculations_update_after_new_weight_entry(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        first = self.client.get(reverse("fitness-calculations")).data

        self.client.post(reverse("progress-entries"), {"weight_kg": 68, "recorded_at": "2026-08-10"})
        second = self.client.get(reverse("fitness-calculations")).data

        self.assertNotEqual(first["bmi"], second["bmi"])

    def test_calculations_404_without_profile(self):
        response = self.client.get(reverse("fitness-calculations"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RecommendationsEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="rec@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_recommendations_include_general_disclaimer(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        response = self.client.get(reverse("fitness-recommendations"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {r["title"] for r in response.data["recommendations"]}
        self.assertIn("General guidance, not medical advice", titles)

    def test_recommendations_are_deterministic_across_calls(self):
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        first = self.client.get(reverse("fitness-recommendations")).data
        second = self.client.get(reverse("fitness-recommendations")).data
        self.assertEqual(first, second)


class WeightEntryPrivacyTests(APITestCase):
    """USER A must never access USER B's private data."""

    def setUp(self):
        self.user_a = User.objects.create_user(email="a@example.com", password="correct-horse-battery-staple")
        self.user_b = User.objects.create_user(email="b@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user_a)
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        self.entry_a = WeightEntry.objects.filter(user=self.user_a).first()

        self.client.force_authenticate(self.user_b)
        self.client.post(reverse("fitness-profile"), REFERENCE_PROFILE)
        self.entry_b = WeightEntry.objects.filter(user=self.user_b).first()

    def test_user_cannot_list_another_users_entries(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.get(reverse("progress-entries"))
        ids = {item["id"] for item in response.data["results"]}
        self.assertNotIn(self.entry_b.id, ids)
        self.assertIn(self.entry_a.id, ids)

    def test_user_cannot_retrieve_another_users_entry_by_id(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.get(reverse("progress-entry-detail", args=[self.entry_b.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_delete_another_users_entry(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.delete(reverse("progress-entry-detail", args=[self.entry_b.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(WeightEntry.objects.filter(id=self.entry_b.id).exists())

    def test_weight_entry_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("progress-entries"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WeightEntryValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="valid@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_rejects_future_dated_entry(self):
        response = self.client.post(reverse("progress-entries"), {"weight_kg": 70, "recorded_at": "2099-01-01"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_out_of_range_weight(self):
        response = self.client.post(reverse("progress-entries"), {"weight_kg": 900, "recorded_at": "2026-01-01"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_entry_removes_it(self):
        create = self.client.post(reverse("progress-entries"), {"weight_kg": 70, "recorded_at": "2026-01-01"})
        entry_id = create.data["id"]
        response = self.client.delete(reverse("progress-entry-detail", args=[entry_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WeightEntry.objects.filter(id=entry_id).exists())
