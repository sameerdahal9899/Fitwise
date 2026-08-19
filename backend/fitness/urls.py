from django.urls import path

from .views import CalculationsView, FitnessProfileView, RecommendationsView

urlpatterns = [
    path("profile/", FitnessProfileView.as_view(), name="fitness-profile"),
    path("calculations/", CalculationsView.as_view(), name="fitness-calculations"),
    path("recommendations/", RecommendationsView.as_view(), name="fitness-recommendations"),
]
