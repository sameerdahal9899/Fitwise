from rest_framework.permissions import BasePermission


class IsConnectionParticipant(BasePermission):
    """Request user must be either the `user` or the `coach` side of the connection."""

    def has_object_permission(self, request, view, obj):
        return request.user in (obj.user, obj.coach)


class IsConnectionCoach(BasePermission):
    """Request user must specifically be the coach side of the connection."""

    message = "Only the coach on this connection can perform this action."

    def has_object_permission(self, request, view, obj):
        return request.user == obj.coach


class IsConnectionUser(BasePermission):
    """Request user must specifically be the normal-user side of the connection (the data owner)."""

    message = "Only the client who owns this connection can perform this action."

    def has_object_permission(self, request, view, obj):
        return request.user == obj.user
