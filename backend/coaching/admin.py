from django.contrib import admin, messages

from .models import CoachApplication, CoachConnection, CoachDataPermission, CoachProfile
from .services import approve_coach_application, reject_coach_application


@admin.action(description="Approve selected applications (creates/activates coach profile)")
def approve_applications(modeladmin, request, queryset):
    reviewable = queryset.exclude(status="approved")
    count = 0
    for application in reviewable:
        approve_coach_application(application, reviewed_by=request.user)
        count += 1
    modeladmin.message_user(request, f"Approved {count} application(s).", level=messages.SUCCESS)


@admin.action(description="Reject selected applications")
def reject_applications(modeladmin, request, queryset):
    reviewable = queryset.exclude(status="rejected")
    count = 0
    for application in reviewable:
        reject_coach_application(application, reviewed_by=request.user, reason=application.rejection_reason)
        count += 1
    modeladmin.message_user(
        request,
        f"Rejected {count} application(s). Tip: set 'Rejection reason' on a row before running this "
        f"action if you want the applicant to see why.",
        level=messages.SUCCESS,
    )


@admin.register(CoachApplication)
class CoachApplicationAdmin(admin.ModelAdmin):
    list_display = ["user", "display_name", "specialization", "experience_years", "status", "submitted_at"]
    list_filter = ["status", "specialization"]
    search_fields = ["user__email", "display_name", "full_name"]
    readonly_fields = ["submitted_at", "reviewed_at", "reviewed_by"]
    autocomplete_fields = ["user"]
    actions = [approve_applications, reject_applications]
    fieldsets = (
        ("Applicant", {"fields": ("user", "full_name", "display_name", "profile_photo")}),
        ("Application details", {"fields": ("bio", "specialization", "experience_years", "certifications", "coaching_approach")}),
        ("Review", {"fields": ("status", "rejection_reason", "reviewed_at", "reviewed_by", "submitted_at")}),
    )


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "display_name", "specialization", "is_active", "created_at"]
    list_filter = ["is_active", "specialization"]
    search_fields = ["user__email", "display_name"]
    autocomplete_fields = ["user"]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Keep is_coach in sync if an admin suspends/reactivates from here.
        user = obj.user
        should_be_coach = obj.is_active
        if user.is_coach != should_be_coach:
            user.is_coach = should_be_coach
            user.save(update_fields=["is_coach"])


@admin.register(CoachConnection)
class CoachConnectionAdmin(admin.ModelAdmin):
    list_display = ["user", "coach", "status", "created_at", "responded_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "coach__email"]
    autocomplete_fields = ["user", "coach"]
    readonly_fields = ["created_at", "responded_at", "disconnected_at"]


@admin.register(CoachDataPermission)
class CoachDataPermissionAdmin(admin.ModelAdmin):
    list_display = ["connection", "share_basic_profile", "share_weight", "share_bmi", "share_progress_information"]
    search_fields = ["connection__user__email", "connection__coach__email"]
