"""Shared settings. Environment-driven; no insecure defaults."""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

# No default: a misconfigured environment must fail to boot, not boot insecurely.
SECRET_KEY = env.str("SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "apps.core",
    "apps.content",
    "apps.search",
    "apps.salvation",
    "apps.contact",
    "apps.radio",
    "apps.media",
    "apps.sitecontent",
    "apps.studio",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.http.ConditionalGetMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# SQLite locally; DATABASE_URL (Postgres) in production.
if env.str("DATABASE_URL", default=""):
    DATABASES = {"default": env.db("DATABASE_URL")}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# In-process by default. With several server processes in production, point
# CACHE_URL at a shared cache (e.g. rediscache://… or dbcache://django_cache
# after `manage.py createcachetable`) so the radio status and the Studio's
# sign-in limits are shared between them.
CACHES = {"default": env.cache("CACHE_URL", default="locmemcache://")}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{v}"}
    for v in (
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    )
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    # Public site: read-only by default. Writes are opt-in, per view.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly"
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "salvation": "5/hour",
        "contact": "5/hour",
        "radio": "60/min",
        "search": "30/min",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Ministry of Repentance and Holiness API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = False  # no cross-origin cookies; don't opt into the risk
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# The Studio. A signed-in editor stays signed in for this long.
STUDIO_SESSION_DAYS = env.int("STUDIO_SESSION_DAYS", default=7)
# Photos uploaded in the Studio are files under MEDIA_ROOT. In development
# Django serves them; in production something must (a web server, or a storage
# bucket). SERVE_MEDIA=True makes Django serve them itself, which is fine for
# a small site behind a caching proxy and the simplest thing that works.
SERVE_MEDIA = env.bool("SERVE_MEDIA", default=False)
# Uploads above this go to a temporary file rather than memory. The size of an
# upload itself is capped by the Studio (25MB, apps/studio/views/media.py) and
# by the site's relay in front of it; DATA_UPLOAD_MAX_MEMORY_SIZE stays at
# Django's default, as it only ever counted the non-file fields.
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

RADIO_STATION_ID = env.str("RADIO_STATION_ID", default="s97f38db97")
RADIO_STREAM_URL = env.str(
    "RADIO_STREAM_URL", default="https://s3.radio.co/s97f38db97/listen"
)
RADIO_STATUS_URL = env.str(
    "RADIO_STATUS_URL", default="https://public.radio.co/stations/s97f38db97/status"
)
RADIO_STATUS_CACHE_SECONDS = 20

# Where salvation-decision alerts go. Declared explicitly rather than only read
# via getattr, so it is visible to whoever configures a deployment. Empty means
# no team alert is sent; the decision is still recorded either way.
SALVATION_TEAM_EMAIL = env.str("SALVATION_TEAM_EMAIL", default="")
# Where contact-page alerts go. Empty means no alert is sent; the message is
# still recorded and waits in the admin either way.
CONTACT_TEAM_EMAIL = env.str("CONTACT_TEAM_EMAIL", default="")
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", default="webmaster@localhost")
