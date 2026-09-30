"""
The photo library.

Every photo staff can change on the site lives here once and is used by
reference: a hero slide or a gallery photo points at an asset rather than
carrying its own file. That makes "where is this photo used?" one question with
one answer, and it is why an asset in use cannot be deleted.

Uploads are re-encoded on the way in (processing.py), so what is stored is
always a web-ready WebP without camera metadata, whatever was uploaded.
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStamped

UNIT = [MinValueValidator(0.0), MaxValueValidator(1.0)]


def asset_path(instance, filename: str) -> str:
    # Dated folders keep any one directory small; the name itself is made
    # unique by processing.py, so two uploads never overwrite each other.
    from django.utils import timezone

    return f"cms/{timezone.now():%Y/%m}/{filename}"


class MediaAsset(TimeStamped):
    file = models.ImageField(
        upload_to=asset_path,
        width_field="width",
        height_field="height",
        max_length=255,
    )
    title = models.CharField(max_length=200)
    alt_text = models.CharField(
        max_length=300,
        blank=True,
        help_text="What the photo shows, for someone who cannot see it.",
    )
    caption = models.TextField(max_length=1000, blank=True)
    credit = models.CharField(max_length=200, blank=True)
    collection = models.CharField(
        max_length=80,
        blank=True,
        db_index=True,
        help_text='A folder to find it by, e.g. "Hero" or "Bogotá 2026".',
    )

    # The point that must stay in view however the photo is cropped, 0–1
    # across and down. Every crop on the site is taken around it.
    focal_x = models.FloatField(default=0.5, validators=UNIT)
    focal_y = models.FloatField(default=0.5, validators=UNIT)

    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    file_size = models.PositiveIntegerField(default=0)
    original_filename = models.CharField(max_length=255, blank=True)
    # Of the bytes as uploaded, so the same photo uploaded twice is caught.
    checksum = models.CharField(max_length=64, blank=True, db_index=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "photo"

    def __str__(self) -> str:
        return self.title

    @property
    def url(self) -> str:
        return self.file.url if self.file else ""

    @property
    def object_position(self) -> str:
        """The focal point as CSS, for a crop that keeps it in view."""
        return f"{round(self.focal_x * 100)}% {round(self.focal_y * 100)}%"

    def usages(self) -> list[dict]:
        """Everything that shows this photo, found through every relation that
        points at it, so a new use is covered without this model knowing it."""
        found = []
        for relation in self._meta.related_objects:
            accessor = relation.get_accessor_name()
            for obj in getattr(self, accessor).all():
                meta = obj._meta
                found.append(
                    {
                        "model": meta.label_lower,
                        "type": str(meta.verbose_name),
                        "id": obj.pk,
                        "label": str(obj),
                    }
                )
        return found
