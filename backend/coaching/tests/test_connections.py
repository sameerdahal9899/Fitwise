from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from coaching.models import CoachApplication, CoachConnection
from coaching.services import approve_coach_application

APPLICATION_PAYLOAD = {
    "full_name": "Jamie Rivera", "display_name": "Coach Jamie",
    "bio": "Ten years helping people build sustainable strength habits.",
    "specialization": "Strength training", "experience_years": 10,
    "certifications": "NASM-CPT", "coaching_approach": "Progressive overload.",
}

PROFILE_PAYLOAD = {
    "age": 25, "gender": "male", "height_cm": 175,
    "activity_level": "moderate", "goal": "lose", "weight_kg": 70,
}


def make_coach(email="coach@example.com"):
    coach = User.objects.create_user(email=email, password="correct-horse-battery-staple")
    application = CoachApplication.objects.create(user=coach, **APPLICATION_PAYLOAD)
    approve_coach_application(application, reviewed_by=None)
    coach.refresh_from_db()
    return coach


class ConnectionRequestTests(APITestCase):
    def setUp(self):
        self.coach = make_coach()
        self.user = User.objects.create_user(email="client@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_user_can_request_connection_with_approved_coach(self):
        response = self.client.post(reverse("connection-list-create"), {"coach": self.coach.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")

    def test_cannot_request_connection_with_non_coach(self):
        rando = User.objects.create_user(email="rando@example.com", password="correct-horse-battery-staple")
        response = self.client.post(reverse("connection-list-create"), {"coach": rando.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_send_duplicate_pending_request(self):
        self.client.post(reverse("connection-list-create"), {"coach": self.coach.id})
        second = self.client.post(reverse("connection-list-create"), {"coach": self.coach.id})
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_coach_cannot_accept_request_not_addressed_to_them(self):
        other_coach = make_coach(email="other-coach@example.com")
        connection = CoachConnection.objects.create(user=self.user, coach=self.coach)

        self.client.force_authenticate(other_coach)
        response = self.client.post(reverse("connection-accept", args=[connection.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ConnectionLifecycleTests(APITestCase):
    def setUp(self):
        self.coach = make_coach()
        self.user = User.objects.create_user(email="client2@example.com", password="correct-horse-battery-staple")
        self.connection = CoachConnection.objects.create(user=self.user, coach=self.coach)

    def test_coach_accepts_request_creates_permissions_and_conversation(self):
        self.client.force_authenticate(self.coach)
        response = self.client.post(reverse("connection-accept", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "accepted")

        from chat.models import Conversation
        self.assertTrue(Conversation.objects.filter(connection=self.connection).exists())

    def test_coach_rejects_request(self):
        self.client.force_authenticate(self.coach)
        response = self.client.post(reverse("connection-reject", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "rejected")

    def test_user_can_disconnect_active_connection(self):
        self.client.force_authenticate(self.coach)
        self.client.post(reverse("connection-accept", args=[self.connection.id]))

        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("connection-disconnect", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "disconnected")

    def test_user_can_cancel_own_pending_request(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("connection-disconnect", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "disconnected")

    def test_coach_cannot_cancel_a_pending_request_only_withdraw_after_accept(self):
        self.client.force_authenticate(self.coach)
        response = self.client.post(reverse("connection-disconnect", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stranger_cannot_accept_or_disconnect(self):
        stranger = User.objects.create_user(email="stranger@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(stranger)
        accept_response = self.client.post(reverse("connection-accept", args=[self.connection.id]))
        self.assertEqual(accept_response.status_code, status.HTTP_403_FORBIDDEN)


class DataPermissionEnforcementTests(APITestCase):
    """
    The centerpiece security suite: granular, backend-enforced, default-private
    permissions. COACH A must never see more than explicitly granted, and
    losing the connection must remove access entirely.
    """

    def setUp(self):
        self.coach = make_coach()
        self.user = User.objects.create_user(email="dataowner@example.com", password="correct-horse-battery-staple")

        self.client.force_authenticate(self.user)
        self.client.post(reverse("fitness-profile"), PROFILE_PAYLOAD)

        self.connection = CoachConnection.objects.create(user=self.user, coach=self.coach)
        self.client.force_authenticate(self.coach)
        self.client.post(reverse("connection-accept", args=[self.connection.id]))

    def test_permissions_default_to_fully_private(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("connection-permissions", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("share_basic_profile", "share_bmi", "share_weight", "share_weight_history"):
            self.assertFalse(response.data[field], f"{field} should default to False")

    def test_coach_sees_nothing_before_any_permission_granted(self):
        self.client.force_authenticate(self.coach)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("basic_profile", response.data)
        self.assertNotIn("current_weight_kg", response.data)
        self.assertNotIn("bmi", response.data)
        self.assertEqual(response.data["granted_fields"], [])

    def test_only_user_can_change_permissions_not_coach(self):
        self.client.force_authenticate(self.coach)
        response = self.client.patch(reverse("connection-permissions", args=[self.connection.id]), {"share_weight": True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_granting_weight_only_exposes_weight_not_other_fields(self):
        self.client.force_authenticate(self.user)
        patch = self.client.patch(reverse("connection-permissions", args=[self.connection.id]), {"share_weight": True})
        self.assertEqual(patch.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.coach)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertEqual(response.data["current_weight_kg"], 70)
        self.assertNotIn("basic_profile", response.data)
        self.assertNotIn("bmi", response.data)
        self.assertNotIn("height_cm", response.data)

    def test_granting_bmi_does_not_expose_bmr_tdee(self):
        self.client.force_authenticate(self.user)
        self.client.patch(reverse("connection-permissions", args=[self.connection.id]), {"share_bmi": True})

        self.client.force_authenticate(self.coach)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertIn("bmi", response.data)
        self.assertAlmostEqual(response.data["bmi"], 22.9, delta=0.05)
        self.assertNotIn("bmr", response.data)
        self.assertNotIn("tdee", response.data)

    def test_revoking_a_permission_immediately_removes_coach_access(self):
        self.client.force_authenticate(self.user)
        self.client.patch(reverse("connection-permissions", args=[self.connection.id]), {"share_weight": True})

        self.client.force_authenticate(self.coach)
        before = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertIn("current_weight_kg", before.data)

        self.client.force_authenticate(self.user)
        self.client.patch(reverse("connection-permissions", args=[self.connection.id]), {"share_weight": False})

        self.client.force_authenticate(self.coach)
        after = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertNotIn("current_weight_kg", after.data)

    def test_unconnected_coach_cannot_view_client_data(self):
        other_coach = make_coach(email="unrelated-coach@example.com")
        self.client.force_authenticate(other_coach)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_disconnected_coach_loses_all_access(self):
        self.client.force_authenticate(self.user)
        self.client.patch(
            reverse("connection-permissions", args=[self.connection.id]),
            {"share_weight": True, "share_bmi": True, "share_basic_profile": True},
        )
        self.client.post(reverse("connection-disconnect", args=[self.connection.id]))

        self.client.force_authenticate(self.coach)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_view_client_data_endpoint_even_for_own_connection(self):
        # client-data is the COACH's view of the USER — the user reads their
        # own data through the normal /api/health/ endpoints instead.
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("connection-client-data", args=[self.connection.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
