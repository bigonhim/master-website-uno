"""
Archive items (teachings, prophecies, healings, writings) as the Studio edits
them.

Publication is not a field here. It changes only through the publish and
unpublish actions, which enforce the one rule the archive cannot break: an
item with a deleted video is never published.
"""

from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers

from apps.content.models import (
    Availability,
    Category,
    ContentItem,
    DatePrecision,
    DateSource,
    Kind,
    Region,
    Series,
    Status,
    Video,
)

from . import version_of

KIND_PATHS = {
    Kind.TEACHING: "teachings",
    Kind.PROPHECY: "prophecies",
    Kind.HEALING: "healings",
    Kind.WRITING: "writings",
}


def state_of(item: ContentItem) -> str:
    """draft, scheduled or published, as a visitor would experience it."""
    if item.status != Status.PUBLISHED:
        return "draft"
    if item.published_at and item.published_at > timezone.now():
        return "scheduled"
    return "published"


def public_path(item: ContentItem) -> str:
    # Writings have no public archive page yet.
    if item.kind == Kind.WRITING:
        return ""
    return f"/{KIND_PATHS[item.kind]}/{item.slug}"


def unique_slug(title: str, exclude_pk=None) -> str:
    base = slugify(title)[:500] or "item"
    slug, n = base, 2
    taken = ContentItem.objects.exclude(pk=exclude_pk)
    while taken.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class AttachedVideosField(serializers.Field):
    """The item's videos, in order. Written as [{video, label, is_primary}];
    shown with enough of each video to draw it."""

    def __init__(self, **kwargs):
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)

    def to_representation(self, manager):
        return [
            {
                "video": a.video_id,
                "label": a.label,
                "is_primary": a.is_primary,
                "youtube_id": a.video.youtube_id,
                "title": a.video.title,
                "thumbnail_url": a.video.thumbnail_url,
                "availability": a.video.availability,
            }
            for a in manager.all()
        ]

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Expected a list of videos.")
        if len(data) > 20:
            raise serializers.ValidationError("An item can have at most 20 videos.")
        ids = []
        for row in data:
            if not isinstance(row, dict) or not isinstance(row.get("video"), int):
                raise serializers.ValidationError("Each video needs its id.")
            ids.append(row["video"])
        if len(set(ids)) != len(ids):
            raise serializers.ValidationError("The same video is attached twice.")
        found = Video.objects.in_bulk(ids)
        missing = [i for i in ids if i not in found]
        if missing:
            raise serializers.ValidationError("A video in the list no longer exists.")
        return [
            {
                "video": found[row["video"]],
                "label": str(row.get("label", ""))[:40],
                "is_primary": bool(row.get("is_primary", False)),
            }
            for row in data
        ]


class ItemListSerializer(serializers.ModelSerializer):
    state = serializers.SerializerMethodField()
    category = serializers.CharField(source="category.name", default="")
    thumbnail_url = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    dead_videos = serializers.SerializerMethodField()

    class Meta:
        model = ContentItem
        fields = [
            "id",
            "kind",
            "title",
            "kicker",
            "slug",
            "status",
            "state",
            "category",
            "published_at",
            "prophecy_date",
            "needs_review",
            "thumbnail_url",
            "video_count",
            "dead_videos",
            "updated_at",
        ]
        read_only_fields = fields

    def get_state(self, obj) -> str:
        return state_of(obj)

    def get_thumbnail_url(self, obj) -> str:
        first = next(iter(obj.videos.all()), None)
        return first.video.thumbnail_url if first else ""

    def get_video_count(self, obj) -> int:
        return len(obj.videos.all())

    def get_dead_videos(self, obj) -> int:
        return sum(
            1 for a in obj.videos.all() if a.video.availability == Availability.UNAVAILABLE
        )


class ItemSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(max_length=520, required=False, allow_blank=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )
    regions = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(), many=True, required=False
    )
    series = serializers.PrimaryKeyRelatedField(
        queryset=Series.objects.all(), allow_null=True, required=False
    )
    videos = AttachedVideosField()
    state = serializers.SerializerMethodField()
    public_path = serializers.SerializerMethodField()
    version = serializers.SerializerMethodField()

    class Meta:
        model = ContentItem
        fields = [
            "id",
            "kind",
            "title",
            "slug",
            "kicker",
            "speaker",
            "summary",
            "body",
            "category",
            "regions",
            "series",
            "position_in_series",
            "published_at",
            "prophecy_date",
            "date_source",
            "date_precision",
            "is_fulfilled",
            "fulfillment_summary",
            "condition",
            "is_anonymous",
            "is_featured",
            "needs_review",
            "videos",
            # Read-only context for the editor.
            "status",
            "state",
            "public_path",
            "title_source",
            "title_yt",
            "confidence",
            "created_at",
            "updated_at",
            "version",
        ]
        read_only_fields = [
            "status",
            "title_source",
            "title_yt",
            "confidence",
            "created_at",
            "updated_at",
        ]

    def get_state(self, obj) -> str:
        return state_of(obj)

    def get_public_path(self, obj) -> str:
        return public_path(obj)

    def get_version(self, obj) -> str:
        return version_of(obj)

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give it a title.")
        return value

    def validate_slug(self, value):
        if not value:
            return value
        clash = ContentItem.objects.filter(slug=value)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("Another item already uses this web address.")
        return value

    def validate(self, attrs):
        # The publish rule, kept after publishing too: a live item never gains
        # a video that has been deleted on YouTube, whether by an edit or by
        # restoring an older version. One that died after it was attached is
        # left for the editor to remove; refusing every save would block that.
        videos = attrs.get("videos")
        if videos and self.instance is not None and self.instance.status == Status.PUBLISHED:
            attached = {a.video_id for a in self.instance.videos.all()}
            dead = [
                row["video"]
                for row in videos
                if row["video"].availability == Availability.UNAVAILABLE
                and row["video"].pk not in attached
            ]
            if dead:
                names = ", ".join(v.title or v.youtube_id for v in dead)
                raise serializers.ValidationError(
                    {
                        "videos": f"This item is published, and {names} has been "
                        "deleted on YouTube, so it can't be added."
                    }
                )

        # A date typed by staff is a date staff vouch for: record where it came
        # from, so "undated" and "guessed" never blur together.
        if attrs.get("prophecy_date"):
            source = attrs.get(
                "date_source", self.instance.date_source if self.instance else DateSource.UNKNOWN
            )
            if source == DateSource.UNKNOWN:
                attrs["date_source"] = DateSource.MANUAL
            precision = attrs.get(
                "date_precision",
                self.instance.date_precision if self.instance else DatePrecision.UNKNOWN,
            )
            if precision == DatePrecision.UNKNOWN:
                attrs["date_precision"] = DatePrecision.DAY
        return attrs

    def _save_videos(self, item, videos):
        if videos is None:
            return
        item.videos.all().delete()
        has_primary = any(v["is_primary"] for v in videos)
        for order, row in enumerate(videos):
            item.videos.create(
                video=row["video"],
                label=row["label"],
                order=order,
                is_primary=row["is_primary"] or (not has_primary and order == 0),
            )

    def create(self, validated_data):
        videos = validated_data.pop("videos", [])
        regions = validated_data.pop("regions", [])
        if not validated_data.get("slug"):
            validated_data["slug"] = unique_slug(validated_data["title"])
        item = ContentItem.objects.create(status=Status.DRAFT, **validated_data)
        item.regions.set(regions)
        self._save_videos(item, videos)
        return item

    def update(self, instance, validated_data):
        videos = validated_data.pop("videos", None)
        if "slug" in validated_data and not validated_data["slug"]:
            validated_data["slug"] = unique_slug(
                validated_data.get("title", instance.title), exclude_pk=instance.pk
            )
        item = super().update(instance, validated_data)
        self._save_videos(item, videos)
        return item


class PublishSerializer(serializers.Serializer):
    published_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Leave empty to publish now; a future time schedules it.",
    )
