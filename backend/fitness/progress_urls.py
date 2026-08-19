from django.urls import path

from .views import ProgressSummaryView, WeightEntryDetailView, WeightEntryListCreateView

urlpatterns = [
    path("entries/", WeightEntryListCreateView.as_view(), name="progress-entries"),
    path("entries/<int:pk>/", WeightEntryDetailView.as_view(), name="progress-entry-detail"),
    path("summary/", ProgressSummaryView.as_view(), name="progress-summary"),
]
