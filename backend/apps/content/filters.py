import django_filters as filters
from django.db.models import Q

from .models import Availability, ContentItem


class ContentItemFilter(filters.FilterSet):
    """Archive filters. Every value is a slug or a plain scalar so filter state
    lives entirely in the query string and results stay shareable."""

    category = filters.CharFilter(field_name="category__slug")
    region = filters.CharFilter(field_name="regions__slug")
    series = filters.CharFilter(field_name="series__slug")
    year = filters.NumberFilter(field_name="prophecy_date__year")
    fulfilled = filters.BooleanFilter(field_name="is_fulfilled")
    speaker = filters.CharFilter(field_name="speaker", lookup_expr="iexact")

    # "Watchable" is a real distinction here, not a nicety: about a quarter of
    # the archive's videos are deleted on YouTube.
    watchable = filters.BooleanFilter(method="filter_watchable")
    dated = filters.BooleanFilter(method="filter_dated")

    # Free-text search. Every word must match somewhere, so adding a word
    # narrows rather than widens. Only single-valued relations are searched:
    # a join through regions would duplicate rows in the paginated list.
    q = filters.CharFilter(method="filter_q")

    class Meta:
        model = ContentItem
        fields = [
            "kind",
            "category",
            "region",
            "series",
            "year",
            "fulfilled",
            "speaker",
        ]

    def filter_watchable(self, queryset, name, value):
        if value is None:
            return queryset
        lookup = {"videos__video__availability": Availability.AVAILABLE}
        return (
            queryset.filter(**lookup).distinct()
            if value
            else queryset.exclude(**lookup).distinct()
        )

    def filter_dated(self, queryset, name, value):
        if value is None:
            return queryset
        return (
            queryset.exclude(prophecy_date__isnull=True)
            if value
            else queryset.filter(prophecy_date__isnull=True)
        )

    def filter_q(self, queryset, name, value):
        for term in value.split()[:8]:
            queryset = queryset.filter(
                Q(title__icontains=term)
                | Q(title_source__icontains=term)
                | Q(title_yt__icontains=term)
                | Q(summary__icontains=term)
                | Q(body__icontains=term)
                | Q(speaker__icontains=term)
                | Q(kicker__icontains=term)
                | Q(category__name__icontains=term)
                | Q(series__title__icontains=term)
            )
        return queryset
