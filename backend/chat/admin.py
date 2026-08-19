from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ["sender", "content", "is_read", "created_at"]
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "connection", "created_at"]
    search_fields = ["connection__user__email", "connection__coach__email"]
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["conversation", "sender", "is_read", "created_at"]
    list_filter = ["is_read"]
    search_fields = ["sender__email", "content"]
