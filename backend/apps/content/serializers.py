from rest_framework import serializers

from .models import Category, ContentItem, Region, Series, Video, VideoAttachment


class VideoSerializer(serializers.ModelSerializer):
    """The frontend gets a bare `youtube_id`, not a URL to re-parse.

    `availability` matters: roughly a quarter of the legacy archive is deleted
    on YouTube, so the client must be able to render an honest "no longer
    available" state rather than a broken embed.
    """

    watch_url = serializers.ReadOnlyField()
    embed_url = serializers.ReadOnlyField()
    thumbnail_url = serializers.ReadOnlyField()

    class Meta:
        model = Video
        fields = [
            "youtube_id",
            "title",
            "slug",
            "duration_seconds",
            "availability",
            "allow_embed",
            "watch_url",
            "embed_url",
            "thumbnail_url",
        ]


class VideoAttachmentSerializer(serializers.ModelSerializer):
    """Flattens the join so a card reads `item.videos[0].youtube_id`."""

    youtube_id = serializers.CharField(source="video.youtube_id")
    availability = serializers.CharField(source="video.availability")
    allow_embed = serializers.BooleanField(source="video.allow_embed")
    thumbnail_url = serializers.CharField(source="video.thumbnail_url")
    embed_url = serializers.CharField(source="video.embed_url")
    watch_url = serializers.CharField(source="video.watch_url")
    duration_seconds = serializers.IntegerField(source="video.duration_seconds")

    class Meta:
        model = VideoAttachment
        fields = [
            "youtube_id",
            "label",
            "order",
            "is_primary",
            "availability",
            "allow_embed",
            "thumbnail_url",
            "embed_url",
            "watch_url",
            "duration_seconds",
        ]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["name", "slug", "description"]


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["name", "slug", "iso2", "continent"]


class SeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Series
        fields = ["title", "slug", "description", "starts_on", "ends_on", "location"]


class ContentItemListSerializer(serializers.ModelSerializer):
    """Card payload.

    Deliberately excludes `body`. The previous attempt returned the entire
    transcript for every row, which would make a 400-item archive page weigh
    megabytes.
    """

    category = CategorySerializer(read_only=True)
    videos = VideoAttachmentSerializer(many=True, read_only=True)
    is_dated = serializers.ReadOnlyField()

    class Meta:
        model = ContentItem
        fields = [
            "slug",
            "kind",
            "kicker",
            "title",
            "speaker",
            "summary",
            "category",
            "published_at",
            "prophecy_date",
            "date_source",
            "date_precision",
            "is_dated",
            "is_fulfilled",
            "condition",
            "videos",
        ]


class ContentItemDetailSerializer(ContentItemListSerializer):
    regions = RegionSerializer(many=True, read_only=True)
    series = SeriesSerializer(read_only=True)

    class Meta(ContentItemListSerializer.Meta):
        fields = ContentItemListSerializer.Meta.fields + [
            "body",
            "fulfillment_summary",
            "regions",
            "series",
            "position_in_series",
            "is_anonymous",
            "language",
            "updated_at",
        ]
