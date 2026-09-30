from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.sitecontent.models import Gallery, GalleryPhoto, HeroSlide, SiteSection
from apps.sitecontent.sections import SECTIONS, SECTIONS_LIST, clean_section, merged

from ..history import record
from ..models import Action
from ..serializers import version_of
from ..serializers.site import (
    GallerySerializer,
    GallerySummarySerializer,
    HeroSlideSerializer,
)
from .base import EditConflict, StudioMixin, StudioModelViewSet


class HeroSlideViewSet(StudioModelViewSet):
    serializer_class = HeroSlideSerializer
    pagination_class = None
    action_perms = {"reorder": "change"}

    def get_queryset(self):
        return HeroSlide.objects.select_related("image").order_by("order", "id")

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids") if isinstance(request.data, dict) else None
        slides = {s.pk: s for s in HeroSlide.objects.all()}
        if (
            not isinstance(ids, list)
            or not all(type(i) is int for i in ids)
            or sorted(ids) != sorted(slides)
        ):
            raise serializers.ValidationError({"ids": ["List every slide, once, in order."]})
        with transaction.atomic():
            for order, pk in enumerate(ids):
                HeroSlide.objects.filter(pk=pk).update(order=order)
            first = slides[ids[0]] if ids else None
            if first:
                record(first, Action.REORDERED, request.user, label="Hero slides")
        self.mark_changed(*self.tags())
        return Response(self.get_serializer(self.get_queryset(), many=True).data)


class GalleryViewSet(StudioModelViewSet):
    serializer_class = GallerySummarySerializer
    detail_serializer_class = GallerySerializer
    pagination_class = None
    action_perms = {"feature": "change"}

    def get_queryset(self):
        photos = GalleryPhoto.objects.select_related("image").order_by("order", "id")
        return Gallery.objects.prefetch_related(Prefetch("photos", queryset=photos))

    @action(detail=True, methods=["post"])
    def feature(self, request, pk=None):
        """Put this gallery on the home page (or take it off with
        {"featured": false}). Only one gallery is featured at a time."""
        gallery = self.get_object()
        value = request.data.get("featured", True) if isinstance(request.data, dict) else True
        featured = value not in (False, 0, "false", "False", "0", "no")
        if featured and not gallery.photos.exists():
            raise serializers.ValidationError(
                {"detail": "Add photos before putting the gallery on the home page."}
            )
        try:
            with transaction.atomic():
                if featured:
                    Gallery.objects.exclude(pk=gallery.pk).filter(is_featured=True).update(
                        is_featured=False
                    )
                gallery.is_featured = featured
                gallery.save()
                record(
                    gallery,
                    Action.PUBLISHED if featured else Action.UNPUBLISHED,
                    request.user,
                )
        except IntegrityError:
            # Another editor featured a gallery at the same moment.
            raise EditConflict(
                {"detail": "Another gallery went on the home page just now. Reload and try again."}
            ) from None
        self.mark_changed(*self.tags())
        return self.respond(self.get_queryset().get(pk=gallery.pk))


class SectionViewSet(StudioMixin, viewsets.ViewSet):
    """The site's editable words, one section at a time.

    PUT replaces a section's words; DELETE returns it to its original words.
    """

    queryset = SiteSection.objects.all()  # for the model permission check
    lookup_value_regex = r"[a-z_]+"
    # Returning a section to its original words changes what it says; it
    # deletes nothing an editor could lose.
    action_perms = {"destroy": "change"}

    def _section(self, key):
        section = SECTIONS.get(key)
        if section is None:
            raise NotFound("There is no such section.")
        return section

    def _payload(self, section, row):
        return {
            **section.schema(),
            "data": merged(section, row.data if row else None),
            "defaults": section.default,
            "is_default": row is None,
            "updated_at": row.updated_at if row else None,
            "updated_by": (
                (row.updated_by.get_full_name() or row.updated_by.get_username())
                if row and row.updated_by
                else ""
            ),
            "version": _section_version(row),
        }

    def list(self, request):
        rows = {r.key: r for r in SiteSection.objects.select_related("updated_by")}
        return Response([self._payload(s, rows.get(s.key)) for s in SECTIONS_LIST])

    def retrieve(self, request, pk=None):
        section = self._section(pk)
        row = SiteSection.objects.select_related("updated_by").filter(key=pk).first()
        return Response(self._payload(section, row))

    @transaction.atomic
    def update(self, request, pk=None):
        section = self._section(pk)
        row = SiteSection.objects.select_for_update().filter(key=pk).first()
        self.check_version(request, lambda: self._payload(section, row), _section_version(row))

        data = request.data.get("data") if isinstance(request.data, dict) else None
        cleaned, errors = clean_section(section, data)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
        before = merged(section, row.data if row else None)
        with transaction.atomic():
            row, _ = SiteSection.objects.update_or_create(
                key=pk, defaults={"data": cleaned, "updated_by": request.user}
            )
            record(row, Action.UPDATED, request.user, object_id=pk, label=section.label,
                   data=merged(section, cleaned), before=before)
        self.mark_changed("site")
        return Response(self._payload(section, row))

    def destroy(self, request, pk=None):
        section = self._section(pk)
        row = SiteSection.objects.filter(key=pk).first()
        if row:
            with transaction.atomic():
                record(row, Action.RESET, request.user, object_id=pk, label=section.label,
                       data=section.default, before=merged(section, row.data))
                row.delete()
            self.mark_changed("site")
        return Response(self._payload(section, None))


def _section_version(row) -> str:
    return version_of(row) if row else "default"
