from django.urls import path

from .views import CoachApplicationView, CoachDirectoryDetailView, CoachDirectoryListView, MyCoachProfileView

urlpatterns = [
    # GET returns my current application status, POST submits/resubmits it.
    path("apply/", CoachApplicationView.as_view(), name="coach-apply"),
    path("directory/", CoachDirectoryListView.as_view(), name="coach-directory"),
    path("directory/<int:pk>/", CoachDirectoryDetailView.as_view(), name="coach-directory-detail"),
    path("profile/", MyCoachProfileView.as_view(), name="coach-my-profile"),
]
