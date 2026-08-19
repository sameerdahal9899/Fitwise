"""ASGI config for the fitwise project."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fitwise.settings")

application = get_asgi_application()
