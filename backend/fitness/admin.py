from django.contrib import admin

from .models import FitnessProfile, WeightEntry


@admin.register(FitnessProfile)
class FitnessProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "age", "gender", "height_cm", "activity_level", "goal", "updated_at"]
    list_filter = ["gender", "activity_level", "goal"]
    search_fields = ["user__email"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["user"]


@admin.register(WeightEntry)
class WeightEntryAdmin(admin.ModelAdmin):
    list_display = ["user", "weight_kg", "recorded_at", "created_at"]
    list_filter = ["recorded_at"]
    search_fields = ["user__email"]
    ordering = ["-recorded_at"]
    autocomplete_fields = ["user"]
