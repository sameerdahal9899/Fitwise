from django.urls import path

from .views import ConversationListView, ConversationMessagesView, UnreadCountView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/messages/", ConversationMessagesView.as_view(), name="conversation-messages"),
    path("unread-count/", UnreadCountView.as_view(), name="messages-unread-count"),
]
