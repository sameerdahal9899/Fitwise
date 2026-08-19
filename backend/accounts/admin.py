from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """
    Reuses Django's battle-tested UserAdmin (password hashing UI, permission
    widgets, etc.) instead of building a bespoke admin panel, per the
    project's "use Django admin where appropriate" principle.
    """

    ordering = ["-date_joined"]
    list_display = ["email", "first_name", "last_name", "is_coach", "is_staff", "is_active", "date_joined"]
    list_filter = ["is_coach", "is_staff", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    readonly_fields = ["date_joined", "updated_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        ("Role", {"fields": ("is_coach",)}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )
    filter_horizontal = ("groups", "user_permissions")
