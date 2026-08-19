from django.db import transaction
from rest_framework import serializers

from .models import (
    PERMISSION_FIELDS,
    PERMISSION_LABELS,
    CoachApplication,
    CoachConnection,
    CoachDataPermission,
    CoachProfile,
)


class CoachApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachApplication
        fields = [
            "id", "full_name", "display_name", "bio", "specialization",
            "experience_years", "certifications", "coaching_approach", "profile_photo",
            "status", "submitted_at", "reviewed_at", "rejection_reason",
        ]
        read_only_fields = ["id", "status", "submitted_at", "reviewed_at", "rejection_reason"]

    def validate_profile_photo(self, value):
        if value and value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Profile photo must be 2MB or smaller.")
        return value


class CoachProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = CoachProfile
        fields = [
            "id", "email", "display_name", "bio", "specialization",
            "experience_years", "certifications", "coaching_approach",
            "profile_photo", "created_at",
        ]
        read_only_fields = fields


class UpdateCoachProfileSerializer(serializers.ModelSerializer):
    """A coach editing their own public profile after approval."""

    class Meta:
        model = CoachProfile
        fields = ["display_name", "bio", "specialization", "experience_years", "certifications", "coaching_approach", "profile_photo"]


class CoachConnectionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    coach_email = serializers.EmailField(source="coach.email", read_only=True)
    coach_display_name = serializers.SerializerMethodField()

    class Meta:
        model = CoachConnection
        fields = [
            "id", "user", "coach", "user_email", "user_name", "coach_email", "coach_display_name",
            "status", "message", "created_at", "responded_at", "disconnected_at",
        ]
        read_only_fields = [
            "id", "user", "status", "created_at", "responded_at", "disconnected_at",
            "user_email", "user_name", "coach_email", "coach_display_name",
        ]

    def get_coach_display_name(self, obj) -> str | None:
        profile = getattr(obj.coach, "coach_profile", None)
        return profile.display_name if profile else obj.coach.full_name


class CreateConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachConnection
        fields = ["coach", "message"]

    def validate_coach(self, coach):
        if not (coach.is_coach and getattr(coach, "coach_profile", None) and coach.coach_profile.is_active):
            raise serializers.ValidationError("This user is not an active, approved coach.")
        request = self.context["request"]
        if coach == request.user:
            raise serializers.ValidationError("You cannot connect with yourself.")
        existing = CoachConnection.objects.filter(
            user=request.user, coach=coach, status__in=["pending", "accepted"]
        )
        if existing.exists():
            raise serializers.ValidationError("You already have an active or pending connection with this coach.")
        return coach

    def create(self, validated_data):
        return CoachConnection.objects.create(user=self.context["request"].user, **validated_data)


class CoachDataPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachDataPermission
        fields = ["connection"] + PERMISSION_FIELDS + ["updated_at"]
        read_only_fields = ["connection", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["labels"] = PERMISSION_LABELS
        return data
