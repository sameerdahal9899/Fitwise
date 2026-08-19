from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import TimeStampedModel
from .services.calculations import (
    GENDER_CHOICES,
    GOAL_CHOICES,
    ACTIVITY_MULTIPLIERS,
    MAX_AGE,
    MAX_HEIGHT_CM,
    MAX_WEIGHT_KG,
    MIN_AGE,
    MIN_HEIGHT_CM,
    MIN_WEIGHT_KG,
)

GENDER_MODEL_CHOICES = [(g, g.capitalize()) for g in GENDER_CHOICES]
GOAL_MODEL_CHOICES = [
    ("lose", "Lose weight"),
    ("maintain", "Maintain weight"),
    ("gain", "Gain weight"),
]
ACTIVITY_MODEL_CHOICES = [(key, key.replace("_", " ").capitalize()) for key in ACTIVITY_MULTIPLIERS]


class FitnessProfile(TimeStampedModel):
    """
    One per user. Deliberately does NOT store weight — current weight is
    always the most recent WeightEntry, so there is exactly one place
    weight lives and it can never drift out of sync with progress history.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fitness_profile"
    )
    age = models.PositiveSmallIntegerField(validators=[MinValueValidator(MIN_AGE), MaxValueValidator(MAX_AGE)])
    gender = models.CharField(max_length=10, choices=GENDER_MODEL_CHOICES)
    height_cm = models.FloatField(
        validators=[MinValueValidator(MIN_HEIGHT_CM), MaxValueValidator(MAX_HEIGHT_CM)]
    )
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_MODEL_CHOICES)
    goal = models.CharField(max_length=10, choices=GOAL_MODEL_CHOICES)
    target_weight_kg = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(MIN_WEIGHT_KG), MaxValueValidator(MAX_WEIGHT_KG)],
    )

    def __str__(self):
        return f"FitnessProfile<{self.user.email}>"

    @property
    def latest_weight_entry(self):
        return self.user.weight_entries.order_by("-recorded_at", "-created_at").first()


class WeightEntry(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="weight_entries"
    )
    weight_kg = models.FloatField(validators=[MinValueValidator(MIN_WEIGHT_KG), MaxValueValidator(MAX_WEIGHT_KG)])
    recorded_at = models.DateField(help_text="The date this weight was measured (not necessarily today).")
    note = models.CharField(max_length=280, blank=True)

    class Meta:
        ordering = ["-recorded_at", "-created_at"]
        indexes = [models.Index(fields=["user", "-recorded_at"])]

    def __str__(self):
        return f"{self.user.email}: {self.weight_kg}kg on {self.recorded_at}"
