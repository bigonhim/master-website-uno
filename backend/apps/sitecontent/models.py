"""
The parts of the site staff change from time to time that are not archive
items: the home page's photos, its galleries, and the words on it.

Each is structured to fit the design it fills rather than being a free-form
page builder. The home page is designed to the line; a block editor that can
put anything anywhere is also a block editor that can break it. Here an editor
changes what the site says and shows, and the design keeps saying it well.
"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.core.models import TimeStamped
from apps.media.models import UNIT, MediaAsset


class HeroSlide(TimeStamped):
    """One photo in the home page slider, with the place tag over it."""

    image = models.ForeignKey(
        MediaAsset, on_delete=models.PROTECT, related_name="hero_slides"
    )
    alt_text = models.CharField(
        max_length=300,
        blank=True,
        help_text="Leave empty to use the photo's own description.",
    )
    place = models.CharField(max_length=60, help_text="Yellow block of the place tag.")
    detail = models.CharField(
        max_length=60, blank=True, help_text="Navy block of the place tag, e.g. the country."
    )
    event = models.CharField(max_length=80)

    # Which part of the photo stays in view: on phones the frame is a
    # square-ish band, on wide screens far wider than 3:2 (see .hero-box).
    frame_x = models.FloatField(default=0.5, validators=UNIT)
    frame_y = models.FloatField(default=0.3, validators=UNIT)
    frame_lg_x = models.FloatField(default=0.5, validators=UNIT)
    frame_lg_y = models.FloatField(default=0.25, validators=UNIT)

    order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "hero slide"

    def __str__(self) -> str:
        return f"{self.place} — {self.event}"


class Gallery(TimeStamped):
    """A set of photos with a heading: the home page's recognition band.

    Several can be prepared; one at a time is featured on the home page, so
    the next one can be made ready before it is switched on.
    """

    title = models.CharField(max_length=200, help_text="For staff; not shown on the site.")
    eyebrow = models.CharField(max_length=60, default="Recognition")
    heading = models.CharField(
        max_length=200,
        help_text="Wrap words in **double stars** to set them in yellow.",
    )
    place_name = models.CharField(max_length=80, blank=True)
    place_detail = models.CharField(max_length=80, blank=True)
    summary = models.TextField(max_length=600, blank=True)
    is_featured = models.BooleanField(
        default=False, help_text="Shown on the home page. Only one gallery can be."
    )

    class Meta:
        ordering = ["-is_featured", "-updated_at"]
        verbose_name_plural = "galleries"
        constraints = [
            models.UniqueConstraint(
                fields=["is_featured"],
                condition=Q(is_featured=True),
                name="one_featured_gallery",
            )
        ]

    def __str__(self) -> str:
        return self.title


class GalleryPhoto(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="photos")
    image = models.ForeignKey(
        MediaAsset, on_delete=models.PROTECT, related_name="gallery_photos"
    )
    title = models.CharField(max_length=120)
    caption = models.CharField(max_length=400, blank=True)
    alt_text = models.CharField(
        max_length=300,
        blank=True,
        help_text="Leave empty to use the photo's own description.",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "gallery photo"

    def __str__(self) -> str:
        return f"{self.gallery.title}: {self.title}"


class SiteSection(models.Model):
    """The words of one part of the site, as edited in the Studio.

    What the fields are, and what they say until someone edits them, is
    defined in sections.py; a row exists only once a section has been edited.
    Deleting the row returns the section to its original words.
    """

    key = models.CharField(max_length=64, unique=True)
    data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        ordering = ["key"]
        verbose_name = "site text"
        verbose_name_plural = "site text"

    def __str__(self) -> str:
        from .sections import SECTIONS

        section = SECTIONS.get(self.key)
        return section.label if section else self.key
