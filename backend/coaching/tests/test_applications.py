from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from coaching.models import CoachApplication, CoachProfile
from coaching.services import approve_coach_application, reject_coach_application

APPLICATION_PAYLOAD = {
    "full_name": "Jamie Rivera",
    "display_name": "Coach Jamie",
    "bio": "Ten years helping people build sustainable strength habits.",
    "specialization": "Strength training",
    "experience_years": 10,
    "certifications": "NASM-CPT",
    "coaching_approach": "Progressive overload with a focus on consistency.",
}


class CoachApplicationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="applicant@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)

    def test_apply_creates_pending_application(self):
        response = self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")

    def test_cannot_apply_twice_while_pending(self):
        self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        second = self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)

    def test_can_resubmit_after_rejection(self):
        self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        application = CoachApplication.objects.get(user=self.user)
        reject_coach_application(application, reviewed_by=None, reason="Needs more detail")

        response = self.client.post(reverse("coach-apply"), {**APPLICATION_PAYLOAD, "bio": "Updated, more detailed bio."})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["rejection_reason"], "")

    def test_applicant_is_not_a_coach_until_approved(self):
        self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_coach)
        self.assertFalse(CoachProfile.objects.filter(user=self.user).exists())


class ApprovalWorkflowTests(APITestCase):
    """Exercises coaching/services.py directly, the same code path the Django admin actions use."""

    def setUp(self):
        self.user = User.objects.create_user(email="soon-coach@example.com", password="correct-horse-battery-staple")
        self.admin = User.objects.create_superuser(email="admin@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.user)
        self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        self.application = CoachApplication.objects.get(user=self.user)

    def test_approval_sets_is_coach_and_creates_profile(self):
        approve_coach_application(self.application, reviewed_by=self.admin)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_coach)
        profile = CoachProfile.objects.get(user=self.user)
        self.assertEqual(profile.display_name, "Coach Jamie")
        self.assertTrue(profile.is_active)

    def test_rejection_does_not_set_is_coach(self):
        reject_coach_application(self.application, reviewed_by=self.admin, reason="Not enough experience yet")
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_coach)
        self.assertFalse(CoachProfile.objects.filter(user=self.user).exists())
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, "rejected")
        self.assertEqual(self.application.rejection_reason, "Not enough experience yet")


class CoachDirectoryVisibilityTests(APITestCase):
    """Rejected/unverified coaches must not appear in the public directory."""

    def setUp(self):
        self.viewer = User.objects.create_user(email="viewer@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(self.viewer)

    def _apply_as(self, email):
        applicant = User.objects.create_user(email=email, password="correct-horse-battery-staple")
        self.client.force_authenticate(applicant)
        self.client.post(reverse("coach-apply"), APPLICATION_PAYLOAD)
        application = CoachApplication.objects.get(user=applicant)
        self.client.force_authenticate(self.viewer)
        return applicant, application

    def test_pending_applicant_not_in_directory(self):
        self._apply_as("pending@example.com")
        response = self.client.get(reverse("coach-directory"))
        emails = [c["email"] for c in response.data["results"]]
        self.assertNotIn("pending@example.com", emails)

    def test_rejected_applicant_not_in_directory(self):
        applicant, application = self._apply_as("rejected@example.com")
        reject_coach_application(application, reviewed_by=None)
        response = self.client.get(reverse("coach-directory"))
        emails = [c["email"] for c in response.data["results"]]
        self.assertNotIn("rejected@example.com", emails)

    def test_approved_coach_appears_in_directory(self):
        applicant, application = self._apply_as("approved@example.com")
        approve_coach_application(application, reviewed_by=None)
        response = self.client.get(reverse("coach-directory"))
        emails = [c["email"] for c in response.data["results"]]
        self.assertIn("approved@example.com", emails)

    def test_suspended_coach_disappears_from_directory(self):
        applicant, application = self._apply_as("suspended@example.com")
        approve_coach_application(application, reviewed_by=None)
        profile = CoachProfile.objects.get(user=applicant)
        profile.is_active = False
        profile.save()

        response = self.client.get(reverse("coach-directory"))
        emails = [c["email"] for c in response.data["results"]]
        self.assertNotIn("suspended@example.com", emails)

    def test_directory_search_by_specialization(self):
        applicant, application = self._apply_as("specialist@example.com")
        approve_coach_application(application, reviewed_by=None)

        response = self.client.get(reverse("coach-directory"), {"specialization": "Strength"})
        emails = [c["email"] for c in response.data["results"]]
        self.assertIn("specialist@example.com", emails)

        response = self.client.get(reverse("coach-directory"), {"specialization": "Yoga"})
        emails = [c["email"] for c in response.data["results"]]
        self.assertNotIn("specialist@example.com", emails)
