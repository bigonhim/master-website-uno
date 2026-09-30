"""
The history of everything edited in the Studio, and how to go back.

Every kind of thing the Studio edits is registered here with the serializer
that edits it. A revision stores that serializer's view of the writable
fields; restoring runs the stored version back through the same serializer, so
a restore is validated exactly like a fresh edit. If the world has moved on
(the photo it used was deleted, its web address is now taken) the restore is
refused with the reason, rather than half-applied.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers
from rest_framework.exceptions import NotFound

from apps.content.models import ContentItem, Video
from apps.media.models import MediaAsset
from apps.sitecontent.models import Gallery, HeroSlide, SiteSection
from apps.sitecontent.sections import SECTIONS, clean_section, merged

from .models import Action, Revision
from .serializers.items import ItemSerializer
from .serializers.media import MediaAssetSerializer
from .serializers.site import GallerySerializer, HeroSlideSerializer
from .serializers.videos import VideoSerializer

ARCHIVE_TAGS = ["teachings", "prophecies", "healings", "writings"]


def writable_snapshot(serializer: serializers.Serializer) -> dict:
    data = serializer.data
    return {
        name: data[name]
        for name, field in serializer.fields.items()
        if not field.read_only and name in data
    }


@dataclass(frozen=True)
class Tracked:
    model: type
    serializer: type
    # Cache tags on the site that show this kind of thing.
    tags: tuple[str, ...]

    def get(self, object_id: str):
        try:
            return self.model.objects.get(pk=object_id)
        except (self.model.DoesNotExist, ValueError):
            return None

    def snapshot(self, obj) -> dict:
        return writable_snapshot(self.serializer(obj))

    def restore(self, obj, data: dict, context: dict):
        serializer = self.serializer(obj, data=data, context=context)
        serializer.is_valid(raise_exception=True)
        return serializer.save()


class TrackedSections:
    """Site sections are identified by key and may have no row at all (still
    on their original words), so they are restored by key."""

    model = SiteSection
    tags = ("site",)

    def get(self, key: str):
        return SECTIONS.get(key)

    def snapshot(self, obj) -> dict:
        return dict(obj.data)

    def restore(self, section, data: dict, context: dict):
        cleaned, errors = clean_section(section, data)
        if errors:
            raise serializers.ValidationError({"errors": errors})
        row, _ = SiteSection.objects.update_or_create(
            key=section.key,
            defaults={"data": cleaned, "updated_by": context["request"].user},
        )
        return row


REGISTRY: dict[str, Any] = {
    "content.contentitem": Tracked(ContentItem, ItemSerializer, tuple(ARCHIVE_TAGS)),
    "content.video": Tracked(Video, VideoSerializer, tuple(ARCHIVE_TAGS)),
    "media.mediaasset": Tracked(MediaAsset, MediaAssetSerializer, ("site",)),
    "sitecontent.heroslide": Tracked(HeroSlide, HeroSlideSerializer, ("site",)),
    "sitecontent.gallery": Tracked(Gallery, GallerySerializer, ("site",)),
    "sitecontent.sitesection": TrackedSections(),
}


def visible_revisions(user, queryset):
    """Only the history of things this account may view: a revision holds
    the full text of what it records, drafts included."""
    if user.is_superuser:
        return queryset
    from .permissions import can

    allowed = [
        ContentType.objects.get_for_model(entry.model).pk
        for entry in REGISTRY.values()
        if can(user, "view", entry.model)
    ]
    return queryset.filter(content_type_id__in=allowed)


def entry_for_model(model) -> Any:
    return REGISTRY[model._meta.concrete_model._meta.label_lower]


def record(
    obj,
    action: str,
    user,
    *,
    object_id: str | None = None,
    label: str | None = None,
    data: dict | None = None,
    before: dict | None = None,
) -> Revision:
    """Write one revision. `data` defaults to the object's current state.

    `before` is the state just before the change, when the caller has it; what
    changed is worked out against that, or else against the last revision.
    """
    entry = entry_for_model(type(obj))
    snapshot = data if data is not None else entry.snapshot(obj)
    content_type = ContentType.objects.get_for_model(entry.model)
    object_id = object_id or str(obj.pk)
    if before is None and action not in (Action.CREATED, Action.DELETED):
        previous = (
            Revision.objects.filter(content_type=content_type, object_id=object_id)
            .order_by("-created_at", "-id")
            .first()
        )
        before = previous.data if previous else None
    changed = (
        sorted(k for k in set(before) | set(snapshot) if before.get(k) != snapshot.get(k))
        if before is not None and action not in (Action.CREATED, Action.DELETED)
        else []
    )
    return Revision.objects.create(
        content_type=content_type,
        object_id=object_id,
        object_repr=(label or str(obj))[:300],
        action=action,
        data=snapshot,
        changed_fields=changed,
        user=user if getattr(user, "is_authenticated", False) else None,
    )


def restore(revision: Revision, request) -> tuple[Any, tuple[str, ...]]:
    ct = revision.content_type
    entry = REGISTRY.get(f"{ct.app_label}.{ct.model}")
    if entry is None:
        raise NotFound("This kind of change can't be restored.")
    target = entry.get(revision.object_id)
    if target is None:
        raise NotFound("It has been deleted since, so this version can't be put back.")

    context = {"request": request}
    if isinstance(entry, TrackedSections):
        row = SiteSection.objects.filter(key=target.key).first()
        before = merged(target, row.data if row else None)
        saved = entry.restore(target, revision.data, context)
        record(
            saved,
            Action.RESTORED,
            request.user,
            object_id=target.key,
            label=target.label,
            data=merged(target, saved.data),
            before=before,
        )
    else:
        before = entry.snapshot(target)
        saved = entry.restore(target, revision.data, context)
        record(saved, Action.RESTORED, request.user, before=before)
    return saved, entry.tags
