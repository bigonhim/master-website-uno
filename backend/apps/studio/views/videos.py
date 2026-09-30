from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.content.models import Video

from .. import youtube
from ..history import record
from ..models import Action
from ..serializers.videos import AddVideoSerializer, VideoDetailSerializer, VideoSerializer
from .base import InUse, StudioModelViewSet


class VideoViewSet(StudioModelViewSet):
    """The YouTube videos the archive plays.

    Videos are added by link, not uploaded: YouTube already streams them to
    every kind of connection, which this site's server could not.
    """

    serializer_class = VideoSerializer
    detail_serializer_class = VideoDetailSerializer
    action_perms = {"check": "change"}

    def get_queryset(self):
        queryset = Video.objects.annotate(_uses=Count("attachments"))
        params = self.request.query_params
        if q := params.get("q", "").strip():
            for term in q.split()[:6]:
                queryset = queryset.filter(
                    Q(title__icontains=term) | Q(youtube_id__icontains=term)
                )
        if availability := params.get("availability"):
            queryset = queryset.filter(availability=availability)
        if params.get("unused") == "1":
            queryset = queryset.filter(_uses=0)
        return queryset.order_by("-created_at", "-id")

    def create(self, request, *args, **kwargs):
        form = AddVideoSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        youtube_id = youtube.parse_youtube_id(form.validated_data["url"])
        if not youtube_id:
            return Response(
                {"url": ["That isn't a YouTube video link."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = self.get_queryset().filter(youtube_id=youtube_id).first()
        if existing:
            data = VideoDetailSerializer(existing, context=self.get_serializer_context()).data
            return Response({**data, "duplicate": True})

        availability, title = youtube.probe(youtube_id)
        with transaction.atomic():
            video = Video.objects.create(
                youtube_id=youtube_id,
                title=title,
                availability=availability,
                last_checked_at=timezone.now(),
            )
            record(video, Action.CREATED, request.user)
        self.mark_changed(*self.tags())
        video = self.get_queryset().get(pk=video.pk)
        data = VideoDetailSerializer(video, context=self.get_serializer_context()).data
        return Response({**data, "duplicate": False}, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        if instance.attachments.exists():
            raise InUse(
                {
                    "detail": "This video is attached to archive items. Detach it first:",
                    "usage": VideoDetailSerializer(instance).data["usage"],
                }
            )
        super().perform_destroy(instance)

    @action(detail=True, methods=["post"])
    def check(self, request, pk=None):
        """Ask YouTube again whether the video still exists."""
        video = self.get_object()
        availability, title = youtube.probe(video.youtube_id)
        video.availability = availability
        video.last_checked_at = timezone.now()
        if title and not video.title:
            video.title = title
        with transaction.atomic():
            video.save()
            record(video, Action.UPDATED, request.user)
        self.mark_changed(*self.tags())
        return self.respond(self.get_queryset().get(pk=video.pk))
