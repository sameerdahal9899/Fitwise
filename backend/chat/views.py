from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import StandardResultsSetPagination

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListView(generics.ListAPIView):
    """
    GET /api/messages/conversations/ — only conversations attached to a
    currently ACCEPTED connection are visible. Disconnecting removes the
    conversation from both inboxes (the connection, and the ability to
    message, are strictly linked — see coaching/views.py:ConnectionDisconnectView).
    """

    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Conversation.objects.filter(
                Q(connection__user=user) | Q(connection__coach=user),
                connection__status="accepted",
            )
            .select_related("connection", "connection__user", "connection__coach", "connection__coach__coach_profile")
            .order_by("-updated_at")
        )


def _get_accessible_conversation(request, pk):
    """Shared guard: must be a participant AND the connection must currently be accepted."""
    conversation = get_object_or_404(
        Conversation.objects.select_related("connection"), pk=pk
    )
    connection = conversation.connection
    if request.user not in (connection.user, connection.coach):
        return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if connection.status != "accepted":
        return None, Response(
            {"detail": "This conversation is not available — the connection is no longer active."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return conversation, None


class ConversationMessagesView(APIView):
    """GET (history, marks incoming messages read) / POST (send) /api/messages/conversations/<id>/messages/"""

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, pk):
        conversation, error_response = _get_accessible_conversation(request, pk)
        if error_response:
            return error_response

        Message.objects.filter(conversation=conversation, is_read=False).exclude(sender=request.user).update(
            is_read=True, read_at=timezone.now()
        )

        queryset = conversation.messages.select_related("sender").order_by("created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MessageSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, pk):
        conversation, error_response = _get_accessible_conversation(request, pk)
        if error_response:
            return error_response

        serializer = MessageSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        message = serializer.save(conversation=conversation, sender=request.user)
        conversation.save(update_fields=["updated_at"])  # bumps conversation to top of inbox
        return Response(MessageSerializer(message, context={"request": request}).data, status=status.HTTP_201_CREATED)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = (
            Message.objects.filter(
                Q(conversation__connection__user=request.user) | Q(conversation__connection__coach=request.user),
                conversation__connection__status="accepted",
                is_read=False,
            )
            .exclude(sender=request.user)
            .count()
        )
        return Response({"unread_count": count})
