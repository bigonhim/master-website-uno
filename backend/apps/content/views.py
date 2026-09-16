from django.utils.cache import patch_cache_control
from rest_framework import viewsets

from apps.core.facets import FacetMixin

from .filters import ContentItemFilter
from .models import Category, ContentItem, Kind, Region, Series, Status
from .serializers import (
    CategorySerializer,
    ContentItemDetailSerializer,
    ContentItemListSerializer,
    RegionSerializer,
    SeriesSerializer,
)


class ContentItemViewSet(FacetMixin, viewsets.ReadOnlyModelViewSet):
    """Read-only by construction.

    The previous attempt exposed a public ModelViewSet and left PUT/PATCH/DELETE
    reachable. There is no write route here to get wrong.
    """

    lookup_field = "slug"
    lookup_value_regex = r"[-\w]+"
    filterset_class = ContentItemFilter
    ordering_fields = ["published_at", "prophecy_date", "title", "created_at"]
    ordering = ["-published_at", "-created_at"]

    facet_specs = {
        "category": ("category", "category__slug", "category__name"),
        "region": ("region", "regions__slug", "regions__name"),
        "series": ("series", "series__slug", "series__title"),
    }

    def get_queryset(self):
        # Drafts never leave the admin. Imported rows land as drafts, and a
        # quarter of them reference a deleted video.
        return (
            ContentItem.objects.filter(status=Status.PUBLISHED)
            .select_related("category", "series")
            .prefetch_related("regions", "videos__video")
        )

    def get_serializer_class(self):
        return (
            ContentItemDetailSerializer
            if self.action == "retrieve"
            else ContentItemListSerializer
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if request.query_params.get("facets") != "0":
            response.data["facets"] = self.get_facets(request)
        # Drives Next.js ISR; stale-while-revalidate keeps a slow origin from
        # ever being the visitor's problem.
        patch_cache_control(
            response, public=True, max_age=300, stale_while_revalidate=86400
        )
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        patch_cache_control(
            response, public=True, max_age=3600, stale_while_revalidate=86400
        )
        return response


class KindScopedViewSet(ContentItemViewSet):
    """One archive per content type, sharing all behaviour above."""

    kind: str = ""

    def get_queryset(self):
        return super().get_queryset().filter(kind=self.kind)


class TeachingViewSet(KindScopedViewSet):
    kind = Kind.TEACHING


class ProphecyViewSet(KindScopedViewSet):
    kind = Kind.PROPHECY


class HealingViewSet(KindScopedViewSet):
    kind = Kind.HEALING


class WritingViewSet(KindScopedViewSet):
    kind = Kind.WRITING


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"
    pagination_class = None


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    lookup_field = "slug"
    pagination_class = None


class SeriesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Series.objects.filter(is_active=True)
    serializer_class = SeriesSerializer
    lookup_field = "slug"
    pagination_class = None
