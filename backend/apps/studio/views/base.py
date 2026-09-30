"""
What every Studio endpoint shares.

- Only Studio tokens are accepted, and model permissions gate each action.
- Every save writes a revision (history.py).
- A save carrying a stale If-Match is refused with 409, so two editors can't
  silently overwrite each other; the response carries the newer copy.
- A successful change names the site's cache tags it touched in an
  X-Studio-Revalidate header. The site's server, which relays every Studio
  request, refreshes those tags as the response passes, so an edit is live on
  the next page view rather than whenever the cache would have expired.
"""

from django.db import transaction
from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.exceptions import APIException
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from ..auth import EditorTokenAuthentication
from ..history import entry_for_model, record
from ..models import Action
from ..permissions import StudioModelPermissions
from ..serializers import version_of

REVALIDATE_HEADER = "X-Studio-Revalidate"


class EditConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"
    default_detail = "Someone else saved this while you were editing."


class VersionRequired(APIException):
    status_code = status.HTTP_428_PRECONDITION_REQUIRED
    default_code = "version_required"
    default_detail = (
        "Say which version you are editing (If-Match), so no one's work is overwritten."
    )


class InUse(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "in_use"
    default_detail = "This is in use, so it can't be deleted."


class StudioPagination(LimitOffsetPagination):
    default_limit = 25
    max_limit = 100


class StudioMixin:
    authentication_classes = [EditorTokenAuthentication]
    permission_classes = [StudioModelPermissions]

    def mark_changed(self, *tags: str) -> None:
        self._changed_tags = set(getattr(self, "_changed_tags", set())) | set(tags)

    def finalize_response(self, request, response, *args, **kwargs):
        tags = getattr(self, "_changed_tags", None)
        if tags and 200 <= response.status_code < 300:
            response[REVALIDATE_HEADER] = ",".join(sorted(tags))
        return super().finalize_response(request, response, *args, **kwargs)

    def check_version(self, request, current, expected_version: str) -> None:
        """Refuses a save without If-Match, or over a newer save. `current`
        gives the newer copy, and is only called on a conflict."""
        expected = request.headers.get("If-Match", "").strip().strip('"')
        if not expected:
            raise VersionRequired()
        if expected != expected_version:
            raise EditConflict(
                {
                    "detail": "Someone else saved this while you were editing. "
                    "Their version is shown; copy anything you need from yours.",
                    "current": current(),
                }
            )


class StudioModelViewSet(StudioMixin, viewsets.ModelViewSet):
    """A Studio collection with history, conflict checks and cache refresh."""

    pagination_class = StudioPagination
    detail_serializer_class = None

    def get_serializer_class(self):
        if self.action != "list" and self.detail_serializer_class:
            return self.detail_serializer_class
        return super().get_serializer_class()

    def tags(self) -> tuple[str, ...]:
        return entry_for_model(self.get_queryset().model).tags

    def update(self, request, *args, **kwargs):
        # The row stays locked from the version check to the save, so two saves
        # of the same version can't both pass the check.
        with transaction.atomic():
            instance = self.get_object()
            locked = type(instance).objects.select_for_update().get(pk=instance.pk)
            self.check_version(
                request, lambda: self.get_serializer(locked).data, version_of(locked)
            )
            return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        with transaction.atomic():
            obj = serializer.save()
            record(obj, Action.CREATED, self.request.user)
        self.mark_changed(*self.tags())

    def perform_update(self, serializer):
        before = entry_for_model(type(serializer.instance)).snapshot(serializer.instance)
        with transaction.atomic():
            obj = serializer.save()
            record(obj, Action.UPDATED, self.request.user, before=before)
        self.mark_changed(*self.tags())

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                record(instance, Action.DELETED, self.request.user)
                instance.delete()
        except ProtectedError:
            raise InUse() from None
        self.mark_changed(*self.tags())

    def respond(self, obj, code=status.HTTP_200_OK) -> Response:
        return Response(self.get_serializer(obj).data, status=code)
