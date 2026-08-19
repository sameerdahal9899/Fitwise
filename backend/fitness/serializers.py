from datetime import date

from django.db import transaction
from rest_framework import serializers

from .models import FitnessProfile, WeightEntry
from .services.calculations import MAX_WEIGHT_KG, MIN_WEIGHT_KG


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = ["id", "weight_kg", "recorded_at", "note", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_recorded_at(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Weight entries cannot be dated in the future.")
        return value


class FitnessProfileSerializer(serializers.ModelSerializer):
    """Read representation — includes the user's current weight for convenience."""

    current_weight_kg = serializers.SerializerMethodField()

    class Meta:
        model = FitnessProfile
        fields = [
            "age", "gender", "height_cm", "activity_level", "goal",
            "target_weight_kg", "current_weight_kg", "created_at", "updated_at",
        ]

    def get_current_weight_kg(self, obj) -> float | None:
        entry = obj.latest_weight_entry
        return entry.weight_kg if entry else None


class CreateFitnessProfileSerializer(serializers.ModelSerializer):
    """
    Used only for the initial profile creation. Requires a starting
    weight_kg, which becomes the very first WeightEntry — this guarantees a
    profile can never exist without at least one weight data point, so
    calculations always have something to work from.
    """

    weight_kg = serializers.FloatField(min_value=MIN_WEIGHT_KG, max_value=MAX_WEIGHT_KG, write_only=True)

    class Meta:
        model = FitnessProfile
        fields = ["age", "gender", "height_cm", "activity_level", "goal", "target_weight_kg", "weight_kg"]

    @transaction.atomic
    def create(self, validated_data):
        weight_kg = validated_data.pop("weight_kg")
        user = self.context["request"].user
        profile = FitnessProfile.objects.create(user=user, **validated_data)
        WeightEntry.objects.create(
            user=user,
            weight_kg=weight_kg,
            recorded_at=date.today(),
            note="Starting weight (from profile setup)",
        )
        return profile


class UpdateFitnessProfileSerializer(serializers.ModelSerializer):
    """
    Used for editing an existing profile. Weight is intentionally excluded —
    weight changes always go through /api/progress/entries/ so there is one
    unambiguous history of the user's weight over time.
    """

    class Meta:
        model = FitnessProfile
        fields = ["age", "gender", "height_cm", "activity_level", "goal", "target_weight_kg"]
