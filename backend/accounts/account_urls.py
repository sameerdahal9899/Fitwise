from django.urls import path

from .views import AccountDetailView, ChangePasswordView

urlpatterns = [
    path("me/", AccountDetailView.as_view(), name="account-me"),
    path("change-password/", ChangePasswordView.as_view(), name="account-change-password"),
]
