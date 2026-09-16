"""
Content models.

One table with a `kind` discriminator plus proxy models, rather than separate
concrete tables. The types share ~90% of their fields, and separate tables
would force UNION queries (or a mirror table) for global search and triple the
index maintenance. Proxies keep `Prophecy.objects...` ergonomics and give each
type its own admin screen.

`Video` is the deliberate exception and stays its own model: 44 legacy rows
attach several videos each ("Video 1", "Video 2"), which a URL column cannot
represent, and liveness is a property of a video rather than of an item — one
row, one probe, one fix.

No SearchVectorField here. Search is Phase 6 behind a Postgres-guarded
migration; declaring the field now would break migrations on SQLite in dev.
"""

import uuid

from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStamped


class Kind(models.TextChoices):
    TEACHING = "teaching", "Teaching"
    PROPHECY = "prophecy", "Prophecy"
    HEALING = "healing", "Healing"
    WRITING = "writing", "Writing"


class Status(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"


class DateSource(models.TextChoices):
    """Where a date came from, so 'undated' is never confused with 'guessed'."""

    TITLE_PARSED = "title_parsed", "Parsed from title"
    MANUAL = "manual", "Entered by staff"
    UNKNOWN = "unknown", "Undated"


class DatePrecision(models.TextChoices):
    DAY = "day", "Day"
    MONTH = "month", "Month"
    YEAR = "year", "Year"
    UNKNOWN = "unknown", "Unknown"


class Availability(models.TextChoices):
    AVAILABLE = "available", "Available"
    UNAVAILABLE = "unavailable", "Unavailable"
    UNKNOWN = "unknown", "Not checked"


class Category(TimeStamped):
    """Curated facet axis. A foreign key, not free text, so counts can be
    grouped, options renamed, and ordering controlled."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.PROTECT, related_name="children"
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class Region(TimeStamped):
    """Nation or region a prophecy concerns.

    Dozens of legacy titles read '<EVENT> COMING TO <NATION>'. For a diaspora
    audience, 'show me prophecies about my country' is the most valuable filter
    this archive can offer.
    """

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    iso2 = models.CharField(max_length=2, blank=True)
    continent = models.CharField(max_length=40, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Series(TimeStamped):
    """Conferences, campaigns and multi-part teachings."""

    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True)
    description = models.TextField(blank=True)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "series"
        ordering = ["-starts_on", "title"]

    def __str__(self) -> str:
        return self.title


class Video(TimeStamped):
    """A YouTube video, tracked once and attachable to many items."""

    youtube_id = models.CharField(max_length=16, unique=True, db_index=True)
    title = models.CharField(max_length=300, blank=True)
    slug = models.SlugField(max_length=320, unique=True, blank=True)

    # Populated only if staff enter them; no API sync was authorised.
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    availability = models.CharField(
        max_length=12,
        choices=Availability.choices,
        default=Availability.UNKNOWN,
        db_index=True,
        help_text="Checked against the YouTube thumbnail CDN.",
    )
    last_checked_at = models.DateTimeField(null=True, blank=True)
    allow_embed = models.BooleanField(
        default=True, help_text="Uncheck to link out to YouTube instead of embedding."
    )
    thumbnail_override = models.URLField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title or self.youtube_id

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:280] or f"video-{self.youtube_id}"
            self.slug = f"{base}-{self.youtube_id}"[:320]
        super().save(*args, **kwargs)

    @property
    def watch_url(self) -> str:
        return f"https://www.youtube.com/watch?v={self.youtube_id}"

    @property
    def embed_url(self) -> str:
        # youtube-nocookie sets no tracking cookie until the viewer presses play.
        return f"https://www.youtube-nocookie.com/embed/{self.youtube_id}"

    @property
    def thumbnail_url(self) -> str:
        return (
            self.thumbnail_override
            or f"https://i.ytimg.com/vi/{self.youtube_id}/hqdefault.jpg"
        )

    @property
    def is_playable(self) -> bool:
        return self.availability == Availability.AVAILABLE


class ContentItem(TimeStamped):
    """A teaching, prophecy, healing testimony or written booklet."""

    kind = models.CharField(max_length=16, choices=Kind.choices, db_index=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    # Three titles, always. `title_source` is the raw reconstruction and is the
    # audit trail — never displayed, never discarded. The ministry's wording is
    # not ours to destroy; normalisation is a reversible display convenience.
    title = models.CharField(max_length=500)
    title_source = models.CharField(max_length=500, blank=True)
    title_yt = models.CharField(max_length=500, blank=True)

    slug = models.SlugField(max_length=520, unique=True)
    kicker = models.CharField(max_length=80, blank=True)
    speaker = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    body = models.TextField(blank=True, help_text="Markdown.")

    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="items"
    )
    regions = models.ManyToManyField(Region, blank=True, related_name="items")
    series = models.ForeignKey(
        Series, null=True, blank=True, on_delete=models.SET_NULL, related_name="items"
    )
    position_in_series = models.PositiveIntegerField(null=True, blank=True)

    # Dating is deliberately tolerant: the legacy source carries almost no dates,
    # so most rows launch undated and `date_source` keeps that honest.
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    prophecy_date = models.DateField(null=True, blank=True, db_index=True)
    date_source = models.CharField(
        max_length=16, choices=DateSource.choices, default=DateSource.UNKNOWN
    )
    date_precision = models.CharField(
        max_length=8, choices=DatePrecision.choices, default=DatePrecision.UNKNOWN
    )

    is_fulfilled = models.BooleanField(default=False, db_index=True)
    fulfillment_summary = models.TextField(blank=True)
    condition = models.CharField(
        max_length=200, blank=True, help_text="Healings: the condition reported."
    )
    is_anonymous = models.BooleanField(
        default=True,
        help_text="Healings: keep the person unnamed unless consent is on file.",
    )

    # Editorial and import provenance.
    is_featured = models.BooleanField(default=False)
    needs_review = models.BooleanField(default=False, db_index=True)
    confidence = models.FloatField(
        default=0.0,
        help_text="Auto-classification confidence, 0-1. Below 0.8 needs review.",
    )
    source_order = models.PositiveIntegerField(null=True, blank=True)
    import_key = models.CharField(max_length=64, blank=True, db_index=True)
    import_hash = models.CharField(max_length=64, blank=True)
    imported_values = models.JSONField(default=dict, blank=True)
    import_conflicts = models.JSONField(default=list, blank=True)

    # i18n hooks. Free now; retrofitting them onto populated tables is not.
    language = models.CharField(max_length=8, default="en", db_index=True)
    translation_group = models.UUIDField(default=uuid.uuid4, db_index=True)

    videos = GenericRelation("content.VideoAttachment")

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["kind", "status", "-published_at"]),
            models.Index(fields=["status", "needs_review"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def is_published(self) -> bool:
        return self.status == Status.PUBLISHED

    @property
    def is_dated(self) -> bool:
        return self.date_source != DateSource.UNKNOWN


class VideoAttachment(models.Model):
    """Join between a video and any content item.

    Generic rather than three explicit M2Ms: a video legitimately appears under
    more than one item, and 'where is this dead video used?' must be one query
    rather than three.
    """

    video = models.ForeignKey(
        Video, on_delete=models.PROTECT, related_name="attachments"
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    item = GenericForeignKey("content_type", "object_id")

    label = models.CharField(max_length=40, blank=True, help_text='e.g. "Video 1"')
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]
        indexes = [models.Index(fields=["content_type", "object_id"])]
        constraints = [
            models.UniqueConstraint(
                fields=["video", "content_type", "object_id"],
                name="uniq_video_attachment",
            )
        ]

    def __str__(self) -> str:
        return f"{self.video} -> {self.item}"


class KindManager(models.Manager):
    """Scopes a proxy model to its kind, in both directions."""

    def __init__(self, kind: str):
        self.kind = kind
        super().__init__()

    def get_queryset(self):
        return super().get_queryset().filter(kind=self.kind)

    def create(self, **kwargs):
        kwargs.setdefault("kind", self.kind)
        return super().create(**kwargs)


class Teaching(ContentItem):
    objects = KindManager(Kind.TEACHING)

    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        self.kind = Kind.TEACHING
        super().save(*args, **kwargs)


class Prophecy(ContentItem):
    objects = KindManager(Kind.PROPHECY)

    class Meta:
        proxy = True
        verbose_name_plural = "prophecies"

    def save(self, *args, **kwargs):
        self.kind = Kind.PROPHECY
        super().save(*args, **kwargs)


class Healing(ContentItem):
    objects = KindManager(Kind.HEALING)

    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        self.kind = Kind.HEALING
        super().save(*args, **kwargs)


class Writing(ContentItem):
    objects = KindManager(Kind.WRITING)

    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        self.kind = Kind.WRITING
        super().save(*args, **kwargs)
