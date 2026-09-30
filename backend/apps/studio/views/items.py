from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.content.filters import search_items
from apps.content.models import Availability, ContentItem, Kind, Status

from ..history import record
from ..models import Action
from ..serializers.items import ItemListSerializer, ItemSerializer, PublishSerializer
from .base import StudioModelViewSet

ORDERINGS = {
    "updated": ("-updated_at", "-id"),
    "title": ("title", "id"),
    "published": ("-published_at", "-id"),
    "review": ("-needs_review", "confidence", "-updated_at"),
}


class ItemViewSet(StudioModelViewSet):
    """Teachings, prophecies, healings and writings.

    Saving an item that is already published updates the live page; the
    editor says so on its button. Publishing and unpublishing are actions of
    their own rather than a field, so the rules around them live in one place.
    """

    serializer_class = ItemListSerializer
    detail_serializer_class = ItemSerializer
    action_perms = {"publish": "change", "unpublish": "change"}

    def get_queryset(self):
        queryset = ContentItem.objects.select_related("category").prefetch_related(
            "videos__video", "regions"
        )
        params = self.request.query_params
        if (kind := params.get("kind")) in Kind.values:
            queryset = queryset.filter(kind=kind)
        state = params.get("state")
        now = timezone.now()
        if state == "draft":
            queryset = queryset.exclude(status=Status.PUBLISHED)
        elif state == "published":
            queryset = queryset.filter(status=Status.PUBLISHED).exclude(published_at__gt=now)
        elif state == "scheduled":
            queryset = queryset.filter(status=Status.PUBLISHED, published_at__gt=now)
        if params.get("needs_review") == "1":
            queryset = queryset.filter(needs_review=True)
        if params.get("dead_video") == "1":
            queryset = queryset.filter(
                videos__video__availability=Availability.UNAVAILABLE
            ).distinct()
        if q := params.get("q", "").strip():
            queryset = search_items(queryset, q)
        return queryset.order_by(*ORDERINGS.get(params.get("ordering", ""), ORDERINGS["updated"]))

    def _set_status(self, item, new_status, action_name, published_at=None):
        item.status = new_status
        if published_at is not None:
            item.published_at = published_at
        with transaction.atomic():
            item.save()
            record(item, action_name, self.request.user)
        self.mark_changed(*self.tags())
        return self.respond(self.get_queryset().get(pk=item.pk))

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        item = self.get_object()
        form = PublishSerializer(data=request.data)
        form.is_valid(raise_exception=True)

        # The same rule as the admin's bulk action: a deleted video must
        # never reach the public site.
        dead = [
            a.video.title or a.video.youtube_id
            for a in item.videos.all()
            if a.video.availability == Availability.UNAVAILABLE
        ]
        if dead:
            return Response(
                {
                    "detail": "This item has a video that has been deleted on YouTube. "
                    "Replace or remove it before publishing.",
                    "videos": dead,
                },
                status=status.HTTP_409_CONFLICT,
            )

        when = form.validated_data.get("published_at") or item.published_at or timezone.now()
        return self._set_status(item, Status.PUBLISHED, Action.PUBLISHED, when)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        return self._set_status(self.get_object(), Status.DRAFT, Action.UNPUBLISHED)
