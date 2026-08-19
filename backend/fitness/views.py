from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FitnessProfile, WeightEntry
from .serializers import (
    CreateFitnessProfileSerializer,
    FitnessProfileSerializer,
    UpdateFitnessProfileSerializer,
    WeightEntrySerializer,
)
from .services.calculations import FitnessInputError, calculate_all
from .services.progress import WeightPoint, compute_weight_trend, summarize_progress
from .services.recommendations import RecommendationContext, generate_recommendations


class FitnessProfileView(APIView):
    """GET / POST / PATCH /api/health/profile/ — the current user's own profile only."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "fitness_profile", None)
        if profile is None:
            return Response(
                {"detail": "No fitness profile yet. Complete onboarding to see your dashboard."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FitnessProfileSerializer(profile).data)

    def post(self, request):
        if hasattr(request.user, "fitness_profile"):
            return Response(
                {"detail": "A fitness profile already exists. Use PATCH to update it."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = CreateFitnessProfileSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(FitnessProfileSerializer(profile).data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        profile = getattr(request.user, "fitness_profile", None)
        if profile is None:
            return Response(
                {"detail": "No fitness profile yet. Create one first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UpdateFitnessProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(FitnessProfileSerializer(profile).data)


def _get_calculations_or_none(user):
    """Shared helper: returns a CalculationResult for `user`, or None if not computable yet."""
    profile = getattr(user, "fitness_profile", None)
    if profile is None:
        return None, "No fitness profile yet. Complete onboarding first."

    latest_entry = profile.latest_weight_entry
    if latest_entry is None:
        return None, "No weight logged yet. Add a weight entry to see calculations."

    try:
        result = calculate_all(
            weight_kg=latest_entry.weight_kg,
            height_cm=profile.height_cm,
            age=profile.age,
            gender=profile.gender,
            activity_level=profile.activity_level,
            goal=profile.goal,
        )
    except FitnessInputError as exc:
        return None, str(exc)

    return result, None


class CalculationsView(APIView):
    """GET /api/health/calculations/ — the single source of truth for BMI/BMR/TDEE/target."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result, error = _get_calculations_or_none(request.user)
        if result is None:
            return Response({"detail": error}, status=status.HTTP_404_NOT_FOUND)
        return Response(result.to_dict())


class RecommendationsView(APIView):
    """GET /api/health/recommendations/ — deterministic, rule-based guidance."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "fitness_profile", None)
        if profile is None:
            return Response(
                {"detail": "No fitness profile yet. Complete onboarding first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        result, error = _get_calculations_or_none(request.user)
        if result is None:
            return Response({"detail": error}, status=status.HTTP_404_NOT_FOUND)

        entries = list(request.user.weight_entries.all())
        points = [WeightPoint(e.recorded_at, e.weight_kg) for e in entries]
        trend = compute_weight_trend(points)

        ctx = RecommendationContext(
            bmi=result.bmi,
            bmi_category=result.bmi_category,
            age=profile.age,
            gender=profile.gender,
            weight_kg=profile.latest_weight_entry.weight_kg,
            activity_level=profile.activity_level,
            goal=profile.goal,
            tdee=result.tdee,
            bmr=result.bmr,
            calorie_target=result.calorie_target,
            safety_floor_applied=result.safety_floor_applied,
            weight_trend_kg_per_week=trend,
            entries_count=len(entries),
        )
        recommendations = generate_recommendations(ctx)
        return Response({
            "recommendations": [
                {"category": r.category, "title": r.title, "message": r.message, "priority": r.priority}
                for r in recommendations
            ]
        })


class WeightEntryListCreateView(generics.ListCreateAPIView):
    """GET (paginated history) / POST (add entry) /api/progress/entries/"""

    serializer_class = WeightEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeightEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeightEntryDetailView(generics.RetrieveDestroyAPIView):
    """GET / DELETE /api/progress/entries/<id>/ — users may only touch their own entries."""

    serializer_class = WeightEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeightEntry.objects.filter(user=self.request.user)


class ProgressSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = list(request.user.weight_entries.all())
        points = [WeightPoint(e.recorded_at, e.weight_kg) for e in entries]
        return Response(summarize_progress(points))
