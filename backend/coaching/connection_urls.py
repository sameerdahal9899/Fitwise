from django.urls import path

from .views import (
    ClientDataView,
    ConnectionAcceptView,
    ConnectionDisconnectView,
    ConnectionListCreateView,
    ConnectionPermissionsView,
    ConnectionRejectView,
)

urlpatterns = [
    path("", ConnectionListCreateView.as_view(), name="connection-list-create"),
    path("<int:pk>/accept/", ConnectionAcceptView.as_view(), name="connection-accept"),
    path("<int:pk>/reject/", ConnectionRejectView.as_view(), name="connection-reject"),
    path("<int:pk>/disconnect/", ConnectionDisconnectView.as_view(), name="connection-disconnect"),
    path("<int:pk>/permissions/", ConnectionPermissionsView.as_view(), name="connection-permissions"),
    path("<int:pk>/client-data/", ClientDataView.as_view(), name="connection-client-data"),
]
