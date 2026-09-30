from rest_framework import serializers

from apps.media.models import MediaAsset

from . import version_of


class AssetSummarySerializer(serializers.ModelSerializer):
    """A photo as shown inside whatever uses it."""

    url = serializers.ReadOnlyField()

    class Meta:
        model = MediaAsset
        fields = ["id", "url", "title", "alt_text", "width", "height", "focal_x", "focal_y"]
        read_only_fields = fields


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()
    version = serializers.SerializerMethodField()
    uploaded_by = serializers.SerializerMethodField()
    usage_count = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "url",
            "title",
            "alt_text",
            "caption",
            "credit",
            "collection",
            "focal_x",
            "focal_y",
            "width",
            "height",
            "file_size",
            "original_filename",
            "uploaded_by",
            "usage_count",
            "created_at",
            "updated_at",
            "version",
        ]
        read_only_fields = [
            "width",
            "height",
            "file_size",
            "original_filename",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"title": {"required": False}}

    def get_version(self, obj) -> str:
        return version_of(obj)

    def get_uploaded_by(self, obj) -> str:
        user = obj.uploaded_by
        return (user.get_full_name() or user.get_username()) if user else ""

    def get_usage_count(self, obj) -> int:
        uses = getattr(obj, "_uses", None)
        return uses if uses is not None else len(obj.usages())

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give the photo a title.")
        return value


class MediaAssetDetailSerializer(MediaAssetSerializer):
    usage = serializers.SerializerMethodField()

    class Meta(MediaAssetSerializer.Meta):
        fields = MediaAssetSerializer.Meta.fields + ["usage"]

    def get_usage(self, obj) -> list[dict]:
        return obj.usages()
