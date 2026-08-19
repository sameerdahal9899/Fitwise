from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from fitness.services.calculations import FitnessInputError, calculate_all
from fitness.services.progress import WeightPoint, summarize_progress

from .models import CoachConnection, CoachDataPermission, CoachProfile, PERMISSION_FIELDS
from .permissions import IsConnectionCoach, IsConnectionParticipant, IsConnectionUser
from .serializers import (
    CoachApplicationSerializer,
    CoachConnectionSerializer,
    CoachDataPermissionSerializer,
    CoachProfileSerializer,
    CreateConnectionSerializer,
    UpdateCoachProfileSerializer,
)
from .services import accept_connection, disconnect_connection, reject_connection


class CoachApplicationView(APIView):
    """GET (my application status) / POST (apply, or resubmit after rejection) /api/coaches/apply/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        application = getattr(request.user, "coach_application", None)
        if application is None:
            return Response({"detail": "No coach application on file."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CoachApplicationSerializer(application).data)

    def post(self, request):
        existing = getattr(request.user, "coach_application", None)

        if existing and existing.status in ("pending", "approved"):
            return Response(
                {"detail": f"You already have a {existing.status} application."},
                status=status.HTTP_409_CONFLICT,
            )

        if existing and existing.status == "rejected":
            serializer = CoachApplicationSerializer(existing, data=request.data)
            serializer.is_valid(raise_exception=True)
            application = serializer.save(status="pending", reviewed_at=None, rejection_reason="")
            return Response(CoachApplicationSerializer(application).data)

        serializer = CoachApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save(user=request.user)
        return Response(CoachApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class CoachDirectoryListView(generics.ListAPIView):
    """GET /api/coaches/directory/?search=&specialization= — approved, active coaches only."""

    serializer_class = CoachProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CoachProfile.objects.filter(is_active=True, user__is_coach=True).select_related("user")

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(display_name__icontains=search)
                | Q(specialization__icontains=search)
                | Q(bio__icontains=search)
            )

        specialization = self.request.query_params.get("specialization")
        if specialization:
            qs = qs.filter(specialization__icontains=specialization)

        return qs.order_by("-created_at")


class CoachDirectoryDetailView(generics.RetrieveAPIView):
    """GET /api/coaches/directory/<id>/ — a single approved coach's public profile."""

    serializer_class = CoachProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CoachProfile.objects.filter(is_active=True, user__is_coach=True)


class MyCoachProfileView(APIView):
    """GET/PATCH /api/coaches/profile/ — a coach editing their own public listing."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "coach_profile", None)
        if profile is None:
            return Response({"detail": "You do not have an approved coach profile."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CoachProfileSerializer(profile).data)

    def patch(self, request):
        profile = getattr(request.user, "coach_profile", None)
        if profile is None:
            return Response({"detail": "You do not have an approved coach profile."}, status=status.HTTP_404_NOT_FOUND)
        serializer = UpdateCoachProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(CoachProfileSerializer(profile).data)


class ConnectionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/connections/  — connections where I'm either side (?as=coach to see only
    the ones where I'm the coach, ?as=user for the ones I initiated; default: both).
    POST /api/connections/ — a normal user requests a coach.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return CreateConnectionSerializer if self.request.method == "POST" else CoachConnectionSerializer

    def get_queryset(self):
        user = self.request.user
        as_role = self.request.query_params.get("as")
        if as_role == "coach":
            qs = CoachConnection.objects.filter(coach=user)
        elif as_role == "user":
            qs = CoachConnection.objects.filter(user=user)
        else:
            qs = CoachConnection.objects.filter(Q(user=user) | Q(coach=user))

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.select_related("user", "coach", "coach__coach_profile").order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        connection = serializer.save()
        return Response(CoachConnectionSerializer(connection).data, status=status.HTTP_201_CREATED)


class ConnectionAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsConnectionCoach]

    def post(self, request, pk):
        connection = get_object_or_404(CoachConnection, pk=pk)
        self.check_object_permissions(request, connection)
        if connection.status != "pending":
            return Response({"detail": "Only pending requests can be accepted."}, status=status.HTTP_400_BAD_REQUEST)
        connection = accept_connection(connection)
        return Response(CoachConnectionSerializer(connection).data)


class ConnectionRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsConnectionCoach]

    def post(self, request, pk):
        connection = get_object_or_404(CoachConnection, pk=pk)
        self.check_object_permissions(request, connection)
        if connection.status != "pending":
            return Response({"detail": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)
        connection = reject_connection(connection)
        return Response(CoachConnectionSerializer(connection).data)


class ConnectionDisconnectView(APIView):
    """
    Disconnects an active connection. Also allows the requesting USER (not
    the coach) to cancel their own still-pending request — same endpoint,
    since both are "I no longer want this connection to exist."
    """

    permission_classes = [permissions.IsAuthenticated, IsConnectionParticipant]

    def post(self, request, pk):
        connection = get_object_or_404(CoachConnection, pk=pk)
        self.check_object_permissions(request, connection)

        if connection.status == "pending" and request.user != connection.user:
            return Response(
                {"detail": "Only the requester can cancel a pending request."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if connection.status not in ("accepted", "pending"):
            return Response({"detail": "This connection is not active."}, status=status.HTTP_400_BAD_REQUEST)

        connection = disconnect_connection(connection, disconnected_by=request.user)
        return Response(CoachConnectionSerializer(connection).data)


class ConnectionPermissionsView(APIView):
    """
    GET/PATCH /api/connections/<id>/permissions/ — only the CLIENT (data
    owner) can view or change these. This is the backend enforcement point
    the spec calls out explicitly: "the backend must enforce these
    permissions... do NOT rely only on frontend hiding."
    """

    permission_classes = [permissions.IsAuthenticated, IsConnectionUser]

    def get_connection(self, request, pk):
        connection = get_object_or_404(CoachConnection, pk=pk)
        self.check_object_permissions(request, connection)
        return connection

    def get(self, request, pk):
        connection = self.get_connection(request, pk)
        permission_obj, _ = CoachDataPermission.objects.get_or_create(connection=connection)
        return Response(CoachDataPermissionSerializer(permission_obj).data)

    def patch(self, request, pk):
        connection = self.get_connection(request, pk)
        permission_obj, _ = CoachDataPermission.objects.get_or_create(connection=connection)
        serializer = CoachDataPermissionSerializer(permission_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ClientDataView(APIView):
    """
    GET /api/connections/<id>/client-data/ — the coach's view of a client,
    filtered strictly to what CoachDataPermission currently allows. Any key
    the user hasn't granted is simply absent from the response — never
    null, never present-but-redacted — so there is no ambiguity for the
    frontend and nothing to accidentally leak.
    """

    permission_classes = [permissions.IsAuthenticated, IsConnectionCoach]

    def get(self, request, pk):
        connection = get_object_or_404(CoachConnection, pk=pk)
        self.check_object_permissions(request, connection)

        if connection.status != "accepted":
            return Response(
                {"detail": "This connection is not currently active."},
                status=status.HTTP_403_FORBIDDEN,
            )

        perms, _ = CoachDataPermission.objects.get_or_create(connection=connection)
        client = connection.user
        profile = getattr(client, "fitness_profile", None)

        data = {"granted_fields": perms.granted_fields()}

        if profile is None:
            data["detail"] = "This client has not completed their fitness profile yet."
            return Response(data)

        if perms.share_basic_profile:
            data["basic_profile"] = {
                "name": client.full_name,
                "age": profile.age,
                "gender": profile.gender,
            }
        if perms.share_height:
            data["height_cm"] = profile.height_cm
        if perms.share_activity_level:
            data["activity_level"] = profile.activity_level
        if perms.share_fitness_goal:
            data["goal"] = profile.goal

        latest_entry = profile.latest_weight_entry
        if perms.share_weight and latest_entry:
            data["current_weight_kg"] = latest_entry.weight_kg

        if perms.share_weight_history:
            entries = client.weight_entries.all()[:100]
            data["weight_history"] = [
                {"weight_kg": e.weight_kg, "recorded_at": e.recorded_at.isoformat()} for e in entries
            ]

        needs_calc = perms.share_bmi or perms.share_calorie_target or perms.share_fitness_calculations
        if needs_calc and latest_entry:
            try:
                result = calculate_all(
                    weight_kg=latest_entry.weight_kg, height_cm=profile.height_cm, age=profile.age,
                    gender=profile.gender, activity_level=profile.activity_level, goal=profile.goal,
                )
                if perms.share_bmi:
                    data["bmi"] = result.bmi
                    data["bmi_category"] = result.bmi_category
                if perms.share_calorie_target:
                    data["calorie_target"] = result.calorie_target
                if perms.share_fitness_calculations:
                    data["bmr"] = result.bmr
                    data["tdee"] = result.tdee
            except FitnessInputError:
                pass

        if perms.share_progress_information:
            points = [WeightPoint(e.recorded_at, e.weight_kg) for e in client.weight_entries.all()]
            data["progress"] = summarize_progress(points)

        return Response(data)
