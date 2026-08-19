"""
Custom DRF exception handler.

The project spec requires that raw backend errors never reach the client
and that error messages stay friendly. This wraps DRF's default handler:
known API exceptions (validation errors, permission denials, not-found,
throttling, auth failures) are passed through with their normal structured
payload, but anything unexpected (a bug, a database error, ...) is logged
in full server-side and converted into one generic, safe JSON message.
"""
import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler

logger = logging.getLogger("django")

_KNOWN_EXCEPTIONS = (
    drf_exceptions.APIException,
    Http404,
    PermissionDenied,
)


def friendly_exception_handler(exc, context):
    response = drf_default_handler(exc, context)

    if response is not None:
        # A known, well-structured DRF/Django exception. Make sure the
        # payload always has a top-level "detail" for the frontend to read
        # consistently, while preserving field-level validation errors.
        if isinstance(response.data, dict) and "detail" not in response.data:
            response.data = {"detail": "Validation failed.", "errors": response.data}
        return response

    # Anything else is unexpected: log the real exception with a stack
    # trace for developers, but never expose internals to the client.
    request = context.get("request")
    path = getattr(request, "path", "unknown-path")
    logger.exception("Unhandled exception while processing %s", path, exc_info=exc)

    return Response(
        {"detail": "Something went wrong on our end. Please try again."},
        status=500,
    )
