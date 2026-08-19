from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "is_mine", "content", "is_read", "read_at", "created_at"]
        read_only_fields = ["id", "conversation", "sender", "is_mine", "is_read", "read_at", "created_at"]

    def get_is_mine(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.sender_id == request.user.id)

    def validate_content(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Message cannot be empty.")
        return stripped


class ConversationSerializer(serializers.ModelSerializer):
    other_participant_name = serializers.SerializerMethodField()
    other_participant_id = serializers.SerializerMethodField()
    connection_status = serializers.CharField(source="connection.status", read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "connection", "connection_status",
            "other_participant_id", "other_participant_name",
            "last_message", "unread_count", "created_at",
        ]
        read_only_fields = fields

    def _other_participant(self, obj):
        request = self.context.get("request")
        me = request.user if request else None
        return obj.connection.coach if me == obj.connection.user else obj.connection.user

    def get_other_participant_id(self, obj) -> int:
        return self._other_participant(obj).id

    def get_other_participant_name(self, obj) -> str:
        other = self._other_participant(obj)
        coach_profile = getattr(other, "coach_profile", None)
        return coach_profile.display_name if coach_profile else other.full_name

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return None
        return {"content": last.content, "created_at": last.created_at, "sender": last.sender_id}

    def get_unread_count(self, obj) -> int:
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
