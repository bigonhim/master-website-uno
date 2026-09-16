from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from apps.content.views import (
    CategoryViewSet,
    ContentItemViewSet,
    HealingViewSet,
    ProphecyViewSet,
    RegionViewSet,
    SeriesViewSet,
    TeachingViewSet,
    WritingViewSet,
)
from apps.radio.views import RadioStatusView

router = DefaultRouter()
# One archive per content type, plus a combined feed for cross-type listings.
router.register("teachings", TeachingViewSet, basename="teaching")
router.register("prophecies", ProphecyViewSet, basename="prophecy")
router.register("healings", HealingViewSet, basename="healing")
router.register("writings", WritingViewSet, basename="writing")
router.register("content", ContentItemViewSet, basename="content")
router.register("categories", CategoryViewSet, basename="category")
router.register("regions", RegionViewSet, basename="region")
router.register("series", SeriesViewSet, basename="series")

# Versioned from the start: the previous attempt had no prefix, so any future
# breaking change would have broken the frontend with nowhere to stand.
api_v1 = [
    path("", include(router.urls)),
    path("radio/status/", RadioStatusView.as_view(), name="radio-status"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include((api_v1, "api"), namespace="v1")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
