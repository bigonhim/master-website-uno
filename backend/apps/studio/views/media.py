import hashlib

from django.db import transaction
from django.db.models import Count, F, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.media.models import MediaAsset
from apps.media.processing import MAX_UPLOAD_BYTES, RejectedUpload, process_upload, store

from ..history import record
from ..models import Action
from ..serializers.media import MediaAssetDetailSerializer, MediaAssetSerializer
from .base import InUse, StudioModelViewSet, StudioPagination


# The largest photo, plus room for the form fields around it.
MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024


class LibraryPagination(StudioPagination):
    default_limit = 48


def with_usage_counts(queryset):
    """Annotate how many things use each photo, across every relation that
    points at the library, so a new kind of use is counted automatically."""
    total = None
    for relation in MediaAsset._meta.related_objects:
        count = Count(relation.name, distinct=True)
        total = count if total is None else total + count
    return queryset.annotate(_uses=total) if total is not None else queryset


class MediaAssetViewSet(StudioModelViewSet):
    serializer_class = MediaAssetSerializer
    detail_serializer_class = MediaAssetDetailSerializer
    pagination_class = LibraryPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    action_perms = {"collections": "view"}

    def get_queryset(self):
        queryset = with_usage_counts(MediaAsset.objects.select_related("uploaded_by"))
        params = self.request.query_params
        if q := params.get("q", "").strip():
            for term in q.split()[:6]:
                queryset = queryset.filter(
                    Q(title__icontains=term)
                    | Q(alt_text__icontains=term)
                    | Q(caption__icontains=term)
                    | Q(collection__icontains=term)
                    | Q(original_filename__icontains=term)
                )
        if (collection := params.get("collection")) is not None and collection != "":
            queryset = queryset.filter(collection=collection)
        if params.get("unused") == "1":
            queryset = queryset.filter(_uses=0)
        if params.get("missing_alt") == "1":
            queryset = queryset.filter(alt_text="")
        return queryset.order_by(F("created_at").desc(), "-id")

    def create(self, request, *args, **kwargs):
        # Refused before the body is read at all: touching request.FILES
        # would have Django spool the whole upload to disk first.
        try:
            length = int(request.META.get("CONTENT_LENGTH") or 0)
        except ValueError:
            length = 0
        if length > MAX_REQUEST_BYTES:
            return Response(
                {"file": ["That file is larger than 25 MB."]},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        upload = request.FILES.get("file")
        if upload is None:
            return Response({"file": ["Choose a photo to upload."]}, status=400)
        if upload.size > MAX_UPLOAD_BYTES:
            return Response({"file": ["That file is larger than 25 MB."]}, status=400)

        # The same photo uploaded twice is one photo: hand back the one the
        # library already has rather than keeping two copies to go out of step.
        digest = hashlib.sha256()
        for chunk in upload.chunks():
            digest.update(chunk)
        upload.seek(0)
        existing = MediaAsset.objects.filter(checksum=digest.hexdigest()).first()
        if existing:
            data = MediaAssetDetailSerializer(existing, context=self.get_serializer_context()).data
            return Response({**data, "duplicate": True}, status=status.HTTP_200_OK)

        try:
            processed = process_upload(upload)
        except RejectedUpload as error:
            return Response({"file": [str(error)]}, status=400)

        fields = {
            key: str(request.data.get(key, "")).strip()[:limit]
            for key, limit in (("alt_text", 300), ("collection", 80), ("title", 200), ("credit", 200))
        }
        with transaction.atomic():
            asset = store(processed, uploaded_by=request.user, **fields)
            record(asset, Action.CREATED, request.user)
        self.mark_changed(*self.tags())
        asset = with_usage_counts(MediaAsset.objects.filter(pk=asset.pk)).get()
        data = MediaAssetDetailSerializer(asset, context=self.get_serializer_context()).data
        return Response({**data, "duplicate": False}, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        usage = instance.usages()
        if usage:
            raise InUse(
                {
                    "detail": "This photo is in use. Remove it from these first:",
                    "usage": usage,
                }
            )
        name = instance.file.name
        storage = instance.file.storage
        super().perform_destroy(instance)
        transaction.on_commit(lambda: storage.delete(name))

    @action(detail=False)
    def collections(self, request):
        rows = (
            MediaAsset.objects.exclude(collection="")
            .values("collection")
            .annotate(count=Count("id"))
            .order_by("collection")
        )
        return Response([{"name": r["collection"], "count": r["count"]} for r in rows])
