from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from ..history import REGISTRY, restore, visible_revisions
from ..models import Revision
from ..permissions import IsStudioEditor, can
from ..serializers.revisions import RevisionDetailSerializer, RevisionSerializer
from .base import StudioMixin, StudioPagination


class RevisionViewSet(StudioMixin, viewsets.ReadOnlyModelViewSet):
    """The history of every change made in the Studio.

    Each editor sees the history of what they may view: seeing what changed
    is how a team stays in step. Restoring needs permission to change it.
    """

    permission_classes = [IsStudioEditor]
    pagination_class = StudioPagination

    def get_serializer_class(self):
        return RevisionDetailSerializer if self.action != "list" else RevisionSerializer

    def get_queryset(self):
        queryset = visible_revisions(
            self.request.user, Revision.objects.select_related("user", "content_type")
        )
        params = self.request.query_params
        if model := params.get("model"):
            app_label, _, model_name = model.partition(".")
            queryset = queryset.filter(
                content_type__app_label=app_label, content_type__model=model_name
            )
        if object_id := params.get("object_id"):
            queryset = queryset.filter(object_id=object_id)
        if action_name := params.get("action"):
            queryset = queryset.filter(action=action_name)
        return queryset

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        revision = self.get_object()
        ct = revision.content_type
        entry = REGISTRY.get(f"{ct.app_label}.{ct.model}")
        if entry is None or not can(request.user, "change", entry.model):
            raise PermissionDenied("You can't change this, so you can't restore it.")
        with transaction.atomic():
            _, tags = restore(revision, request)
        self.mark_changed(*tags)
        latest = self.get_queryset().filter(
            content_type=revision.content_type, object_id=revision.object_id
        ).first()
        return Response(RevisionDetailSerializer(latest).data)
