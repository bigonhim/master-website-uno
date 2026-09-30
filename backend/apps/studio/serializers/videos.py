from rest_framework import serializers

from apps.content.models import ContentItem, Video

from . import version_of


class VideoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.ReadOnlyField()
    watch_url = serializers.ReadOnlyField()
    embed_url = serializers.ReadOnlyField()
    usage_count = serializers.SerializerMethodField()
    version = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "youtube_id",
            "title",
            "availability",
            "allow_embed",
            "thumbnail_override",
            "thumbnail_url",
            "watch_url",
            "embed_url",
            "duration_seconds",
            "last_checked_at",
            "usage_count",
            "created_at",
            "updated_at",
            "version",
        ]
        read_only_fields = [
            "youtube_id",
            "availability",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]

    def get_usage_count(self, obj) -> int:
        uses = getattr(obj, "_uses", None)
        return uses if uses is not None else obj.attachments.count()

    def get_version(self, obj) -> str:
        return version_of(obj)


class VideoDetailSerializer(VideoSerializer):
    usage = serializers.SerializerMethodField()

    class Meta(VideoSerializer.Meta):
        fields = VideoSerializer.Meta.fields + ["usage"]

    def get_usage(self, obj) -> list[dict]:
        items = ContentItem.objects.filter(videos__video=obj).distinct()
        return [
            {
                "model": "content.contentitem",
                "type": item.get_kind_display().lower(),
                "id": item.pk,
                "label": item.title,
            }
            for item in items
        ]


class AddVideoSerializer(serializers.Serializer):
    url = serializers.CharField(
        max_length=500, help_text="A YouTube link, or a bare 11-character video id."
    )
