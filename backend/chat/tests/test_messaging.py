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


def make_coach(email="msg-coach@example.com"):
    coach = User.objects.create_user(email=email, password="correct-horse-battery-staple")
    application = CoachApplication.objects.create(user=coach, **APPLICATION_PAYLOAD)
    approve_coach_application(application, reviewed_by=None)
    coach.refresh_from_db()
    return coach


class MessagingFlowTests(APITestCase):
    def setUp(self):
        self.coach = make_coach()
        self.user = User.objects.create_user(email="msg-user@example.com", password="correct-horse-battery-staple")
        self.connection = CoachConnection.objects.create(user=self.user, coach=self.coach)
        self.client.force_authenticate(self.coach)
        self.client.post(reverse("connection-accept", args=[self.connection.id]))

        from chat.models import Conversation
        self.conversation = Conversation.objects.get(connection=self.connection)

    def test_connected_user_can_send_and_coach_receives(self):
        self.client.force_authenticate(self.user)
        send = self.client.post(
            reverse("conversation-messages", args=[self.conversation.id]),
            {"content": "Hi coach, excited to get started!"},
        )
        self.assertEqual(send.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.coach)
        history = self.client.get(reverse("conversation-messages", args=[self.conversation.id]))
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history.data["results"]), 1)
        self.assertEqual(history.data["results"][0]["content"], "Hi coach, excited to get started!")

    def test_coach_reply_marks_original_message_read(self):
        self.client.force_authenticate(self.user)
        self.client.post(reverse("conversation-messages", args=[self.conversation.id]), {"content": "Hello!"})

        self.client.force_authenticate(self.coach)
        self.client.get(reverse("conversation-messages", args=[self.conversation.id]))  # marks as read

        self.client.force_authenticate(self.user)
        unread = self.client.get(reverse("messages-unread-count"))
        self.assertEqual(unread.data["unread_count"], 0)

    def test_empty_message_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("conversation-messages", args=[self.conversation.id]), {"content": "   "})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stranger_cannot_read_conversation(self):
        stranger = User.objects.create_user(email="stranger-msg@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(stranger)
        response = self.client.get(reverse("conversation-messages", args=[self.conversation.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_stranger_cannot_send_message(self):
        stranger = User.objects.create_user(email="stranger-msg2@example.com", password="correct-horse-battery-staple")
        self.client.force_authenticate(stranger)
        response = self.client.post(reverse("conversation-messages", args=[self.conversation.id]), {"content": "Hi"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_only_connected_pairs_can_message_unconnected_coach_blocked(self):
        other_coach = make_coach(email="other-msg-coach@example.com")
        other_connection = CoachConnection.objects.create(user=self.user, coach=other_coach)
        # never accepted -> still pending, no conversation exists yet
        from chat.models import Conversation
        self.assertFalse(Conversation.objects.filter(connection=other_connection).exists())

    def test_disconnecting_blocks_further_messaging_for_both_sides(self):
        self.client.force_authenticate(self.user)
        self.client.post(reverse("connection-disconnect", args=[self.connection.id]))

        self.client.force_authenticate(self.user)
        user_attempt = self.client.post(reverse("conversation-messages", args=[self.conversation.id]), {"content": "Still there?"})
        self.assertEqual(user_attempt.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.coach)
        coach_attempt = self.client.get(reverse("conversation-messages", args=[self.conversation.id]))
        self.assertEqual(coach_attempt.status_code, status.HTTP_403_FORBIDDEN)

    def test_disconnected_conversation_disappears_from_list(self):
        self.client.force_authenticate(self.user)
        before = self.client.get(reverse("conversation-list"))
        self.assertEqual(len(before.data["results"]), 1)

        self.client.post(reverse("connection-disconnect", args=[self.connection.id]))
        after = self.client.get(reverse("conversation-list"))
        self.assertEqual(len(after.data["results"]), 0)

    def test_message_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("conversation-messages", args=[self.conversation.id]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
