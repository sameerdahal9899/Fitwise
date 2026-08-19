"""
Root URL configuration.

API surface, per the project spec:

    /api/auth/          registration, login, refresh, logout, current user
    /api/users/         account-level profile (name, email, password)
    /api/health/        fitness profile + calculations + recommendations
    /api/progress/      weight entries + summary
    /api/coaches/       coach application + directory + coach's own profile
    /api/connections/   user<->coach connection requests + data permissions
    /api/messages/      conversations + messages

Admin (coach application review, user/coach management) lives at /admin/,
using Django's built-in admin per the project spec rather than a bespoke
custom admin panel.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok", "service": "fitwise-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health-check/", health_check),
    path("api/auth/", include("accounts.urls")),
    path("api/users/", include("accounts.account_urls")),
    path("api/health/", include("fitness.urls")),
    path("api/progress/", include("fitness.progress_urls")),
    path("api/coaches/", include("coaching.coach_urls")),
    path("api/connections/", include("coaching.connection_urls")),
    path("api/messages/", include("chat.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
