from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import TimeStampedModel

APPLICATION_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
]

CONNECTION_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("accepted", "Accepted"),
    ("rejected", "Rejected"),
    ("disconnected", "Disconnected"),
]


class CoachApplication(TimeStampedModel):
    """
    A user's application to become a coach. One per user — if rejected, the
    same record can be edited and resubmitted (status flips back to
    'pending'), so there's a single source of truth for "where is this
    person's application right now" rather than an unbounded history.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coach_application"
    )
    full_name = models.CharField(max_length=150)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(max_length=2000)
    specialization = models.CharField(max_length=150, help_text="e.g. Strength training, Weight management, Nutrition")
    experience_years = models.PositiveSmallIntegerField(validators=[MaxValueValidator(80)])
    certifications = models.TextField(max_length=2000, blank=True)
    coaching_approach = models.TextField(max_length=2000, blank=True)
    profile_photo = models.ImageField(upload_to="coach_applications/", null=True, blank=True)

    status = models.CharField(max_length=10, choices=APPLICATION_STATUS_CHOICES, default="pending")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reviewed_coach_applications",
    )
    rejection_reason = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"CoachApplication<{self.user.email}: {self.status}>"


class CoachProfile(TimeStampedModel):
    """Created the moment an admin approves a CoachApplication. Public-facing."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coach_profile"
    )
    display_name = models.CharField(max_length=100)
    bio = models.TextField(max_length=2000)
    specialization = models.CharField(max_length=150)
    experience_years = models.PositiveSmallIntegerField(validators=[MaxValueValidator(80)])
    certifications = models.TextField(max_length=2000, blank=True)
    coaching_approach = models.TextField(max_length=2000, blank=True)
    profile_photo = models.ImageField(upload_to="coach_profiles/", null=True, blank=True)

    is_active = models.BooleanField(
        default=True,
        help_text="Admin can suspend a coach by unchecking this. Suspended coaches disappear from the directory.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"CoachProfile<{self.user.email}>"

    @property
    def is_publicly_listed(self) -> bool:
        return self.is_active and self.user.is_coach


class CoachConnection(TimeStampedModel):
    """A request from a normal user to a coach, and its lifecycle."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coach_connections_sent"
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coach_connections_received"
    )
    status = models.CharField(max_length=15, choices=CONNECTION_STATUS_CHOICES, default="pending")
    message = models.CharField(max_length=500, blank=True, help_text="Optional note sent with the request.")
    responded_at = models.DateTimeField(null=True, blank=True)
    disconnected_at = models.DateTimeField(null=True, blank=True)
    disconnected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="+",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["coach", "status"]),
        ]

    def __str__(self):
        return f"CoachConnection<{self.user.email} -> {self.coach.email}: {self.status}>"


# The exact category list from the project spec. Order here defines display
# order everywhere in the app (serializers, frontend, tests).
PERMISSION_FIELDS = [
    "share_basic_profile",
    "share_height",
    "share_weight",
    "share_weight_history",
    "share_bmi",
    "share_activity_level",
    "share_fitness_goal",
    "share_calorie_target",
    "share_fitness_calculations",
    "share_progress_information",
]

PERMISSION_LABELS = {
    "share_basic_profile": "Basic profile (name, age, gender)",
    "share_height": "Height",
    "share_weight": "Current weight",
    "share_weight_history": "Weight history",
    "share_bmi": "BMI",
    "share_activity_level": "Activity level",
    "share_fitness_goal": "Fitness goal",
    "share_calorie_target": "Calorie target",
    "share_fitness_calculations": "Fitness calculations (BMR / TDEE)",
    "share_progress_information": "Progress trend & summary",
}


class CoachDataPermission(TimeStampedModel):
    """
    Exactly one row per CoachConnection. Every flag defaults to False —
    private by default, as the spec requires. The backend is the only thing
    that ever checks these (see coaching/views.py ClientDataView); the
    frontend just renders whatever the backend decides to send.
    """

    connection = models.OneToOneField(CoachConnection, on_delete=models.CASCADE, related_name="permissions")

    share_basic_profile = models.BooleanField(default=False)
    share_height = models.BooleanField(default=False)
    share_weight = models.BooleanField(default=False)
    share_weight_history = models.BooleanField(default=False)
    share_bmi = models.BooleanField(default=False)
    share_activity_level = models.BooleanField(default=False)
    share_fitness_goal = models.BooleanField(default=False)
    share_calorie_target = models.BooleanField(default=False)
    share_fitness_calculations = models.BooleanField(default=False)
    share_progress_information = models.BooleanField(default=False)

    def __str__(self):
        return f"CoachDataPermission<connection={self.connection_id}>"

    def granted_fields(self) -> list[str]:
        return [f for f in PERMISSION_FIELDS if getattr(self, f)]
