"""
Business logic for the coach lifecycle. Kept separate from views.py and
admin.py so the same operations behave identically whether triggered from
the REST API or from a Django admin action — the spec explicitly asks for
business logic to live in services, not views.
"""
from django.db import transaction
from django.utils import timezone

from .models import CoachConnection, CoachDataPermission, CoachProfile


@transaction.atomic
def approve_coach_application(application, reviewed_by) -> CoachProfile:
    """Creates/refreshes the CoachProfile from the application and flips is_coach on."""
    profile, _ = CoachProfile.objects.update_or_create(
        user=application.user,
        defaults=dict(
            display_name=application.display_name,
            bio=application.bio,
            specialization=application.specialization,
            experience_years=application.experience_years,
            certifications=application.certifications,
            coaching_approach=application.coaching_approach,
            profile_photo=application.profile_photo,
            is_active=True,
        ),
    )
    application.status = "approved"
    application.reviewed_at = timezone.now()
    application.reviewed_by = reviewed_by
    application.rejection_reason = ""
    application.save(update_fields=["status", "reviewed_at", "reviewed_by", "rejection_reason", "updated_at"])

    user = application.user
    user.is_coach = True
    user.save(update_fields=["is_coach"])
    return profile


@transaction.atomic
def reject_coach_application(application, reviewed_by, reason: str = "") -> None:
    application.status = "rejected"
    application.reviewed_at = timezone.now()
    application.reviewed_by = reviewed_by
    if reason:
        application.rejection_reason = reason
    application.save(update_fields=["status", "reviewed_at", "reviewed_by", "rejection_reason", "updated_at"])


@transaction.atomic
def accept_connection(connection: CoachConnection):
    """Accepting a request activates it, seeds a private-by-default permission row, and opens a conversation."""
    from chat.models import Conversation  # local import avoids an app-load-order cycle

    connection.status = "accepted"
    connection.responded_at = timezone.now()
    connection.save(update_fields=["status", "responded_at", "updated_at"])

    CoachDataPermission.objects.get_or_create(connection=connection)
    Conversation.objects.get_or_create(connection=connection)
    return connection


@transaction.atomic
def reject_connection(connection: CoachConnection):
    connection.status = "rejected"
    connection.responded_at = timezone.now()
    connection.save(update_fields=["status", "responded_at", "updated_at"])
    return connection


@transaction.atomic
def disconnect_connection(connection: CoachConnection, disconnected_by):
    connection.status = "disconnected"
    connection.disconnected_at = timezone.now()
    connection.disconnected_by = disconnected_by
    connection.save(update_fields=["status", "disconnected_at", "disconnected_by", "updated_at"])
    return connection
