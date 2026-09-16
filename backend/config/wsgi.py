import os

from django.core.wsgi import get_wsgi_application

# Fail secure: an unconfigured box serves production settings, never dev.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
application = get_wsgi_application()
