"""
Faceted counts.

The rule that makes facets feel correct: a facet's own filter is excluded when
counting its own options, while every other active filter still applies.
Without it, choosing "Prophecy" makes every other kind show 0 and the visitor
is trapped with no way back.
"""

from __future__ import annotations

from typing import Any

from django.db.models import Count, QuerySet


class FacetMixin:
    """Mixin for a DRF viewset whose list response carries facet counts.

    Subclasses declare `facet_specs`: a mapping of facet name to
    (query_param, value_field, label_field).
    """

    facet_specs: dict[str, tuple[str, str, str]] = {}

    def _base_facet_queryset(self) -> QuerySet:
        return self.filter_queryset(self.get_queryset())

    def get_facets(self, request) -> dict[str, list[dict[str, Any]]]:
        facets: dict[str, list[dict[str, Any]]] = {}

        for name, (param, value_field, label_field) in self.facet_specs.items():
            # Re-filter from scratch, dropping only this facet's own parameter.
            params = request.query_params.copy()
            params.pop(param, None)

            queryset = self.get_queryset()
            filterset = self.filterset_class(params, queryset=queryset, request=request)
            if filterset.is_valid():
                queryset = filterset.qs

            rows = (
                queryset.values(value_field, label_field)
                .annotate(count=Count("id", distinct=True))
                .order_by("-count", label_field)
            )
            facets[name] = [
                {
                    "value": row[value_field],
                    "label": row[label_field],
                    "count": row["count"],
                }
                for row in rows
                if row[value_field] is not None
            ]

        return facets
