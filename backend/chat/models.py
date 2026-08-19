from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Conversation(TimeStampedModel):
    """
    Exactly one per CoachConnection, created automatically the moment a
    connection is accepted (see coaching/services.py:accept_connection).
    There is no standalone "start a conversation" endpoint — messaging is
    only ever a consequence of an active coaching connection.
    """

    connection = models.OneToOneField(
        "coaching.CoachConnection", on_delete=models.CASCADE, related_name="conversation"
    )

    def __str__(self):
        return f"Conversation<connection={self.connection_id}>"

    @property
    def participants(self):
        return (self.connection.user, self.connection.coach)


class Message(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField(max_length=4000)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]

    def __str__(self):
        return f"Message<{self.sender_id} @ {self.created_at}>"
