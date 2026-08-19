from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class RegistrationTests(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        url = reverse("auth-register")
        payload = {
            "email": "new.user@example.com",
            "password": "correct-horse-battery-staple",
            "password_confirm": "correct-horse-battery-staple",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="new.user@example.com")
        self.assertNotEqual(user.password, payload["password"])
        self.assertTrue(user.check_password(payload["password"]))

    def test_register_rejects_mismatched_passwords(self):
        url = reverse("auth-register")
        payload = {
            "email": "mismatch@example.com",
            "password": "correct-horse-battery-staple",
            "password_confirm": "different-password",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="mismatch@example.com").exists())

    def test_register_rejects_duplicate_email_case_insensitively(self):
        User.objects.create_user(email="taken@example.com", password="whatever-1234")
        url = reverse("auth-register")
        payload = {
            "email": "TAKEN@example.com",
            "password": "correct-horse-battery-staple",
            "password_confirm": "correct-horse-battery-staple",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_weak_password(self):
        url = reverse("auth-register")
        payload = {
            "email": "weak@example.com",
            "password": "12345678",
            "password_confirm": "12345678",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.password = "correct-horse-battery-staple"
        self.user = User.objects.create_user(email="login@example.com", password=self.password)

    def test_login_returns_access_and_refresh_tokens(self):
        url = reverse("auth-login")
        response = self.client.post(url, {"email": "login@example.com", "password": self.password})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "login@example.com")

    def test_login_rejects_wrong_password(self):
        url = reverse("auth-login")
        response = self.client.post(url, {"email": "login@example.com", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_rejects_unknown_email(self):
        url = reverse("auth-login")
        response = self.client.post(url, {"email": "nobody@example.com", "password": "whatever"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProtectedRouteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="protected@example.com", password="correct-horse-battery-staple")

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user_when_authenticated(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "protected@example.com")
        self.assertFalse(response.data["is_coach"])
        self.assertFalse(response.data["has_fitness_profile"])


class LogoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="logout@example.com", password="correct-horse-battery-staple")

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(
            reverse("auth-login"), {"email": "logout@example.com", "password": "correct-horse-battery-staple"}
        )
        refresh = login.data["refresh"]
        access = login.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        logout_response = self.client.post(reverse("auth-logout"), {"refresh": refresh})
        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_response = self.client.post(reverse("auth-refresh"), {"refresh": refresh})
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="pwchange@example.com", password="original-password-123")
        self.client.force_authenticate(self.user)

    def test_change_password_requires_correct_current_password(self):
        response = self.client.post(
            reverse("account-change-password"),
            {"old_password": "wrong-password", "new_password": "brand-new-password-123"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_succeeds_and_updates_hash(self):
        response = self.client.post(
            reverse("account-change-password"),
            {"old_password": "original-password-123", "new_password": "brand-new-password-123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brand-new-password-123"))
