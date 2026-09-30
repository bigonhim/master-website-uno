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
from apps.contact.views import ContactMessageCreateView
from apps.radio.views import RadioStatusView
from apps.salvation.views import SalvationDecisionCreateView
from apps.sitecontent.views import SiteContentView

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
# breaking change would have had nowhere to stand.
api_v1 = [
    path("", include(router.urls)),
    path("radio/status/", RadioStatusView.as_view(), name="radio-status"),
    # Everything on the site that the Studio edits, for the site to read.
    path("site/", SiteContentView.as_view(), name="site-content"),
    # The Studio's own API. Every route in it requires a signed-in editor.
    path("studio/", include("apps.studio.urls")),
    # The two public write routes on the site. Both only ever create.
    path(
        "salvation/decisions/",
        SalvationDecisionCreateView.as_view(),
        name="salvation-decision",
    ),
    path(
        "contact/messages/",
        ContactMessageCreateView.as_view(),
        name="contact-message",
    ),
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
elif settings.SERVE_MEDIA:
    # static() only works under DEBUG; this is its production equivalent,
    # opted into explicitly (see SERVE_MEDIA in settings).
    from django.urls import re_path
    from django.views.static import serve

    urlpatterns += [
        re_path(
            r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}
        )
    ]
