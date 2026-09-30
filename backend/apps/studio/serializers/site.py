from django.db import transaction
from rest_framework import serializers

from apps.media.models import MediaAsset
from apps.sitecontent.models import Gallery, GalleryPhoto, HeroSlide

from . import version_of
from .media import AssetSummarySerializer


class HeroSlideSerializer(serializers.ModelSerializer):
    image = AssetSummarySerializer(read_only=True)
    image_id = serializers.PrimaryKeyRelatedField(
        source="image", queryset=MediaAsset.objects.all()
    )
    version = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = [
            "id",
            "image",
            "image_id",
            "alt_text",
            "place",
            "detail",
            "event",
            "frame_x",
            "frame_y",
            "frame_lg_x",
            "frame_lg_y",
            "is_active",
            "order",
            "created_at",
            "updated_at",
            "version",
        ]
        read_only_fields = ["order", "created_at", "updated_at"]

    def get_version(self, obj) -> str:
        return version_of(obj)

    def create(self, validated_data):
        image = validated_data["image"]
        # A new slide starts framed on the photo's own focal point.
        for key, focal in (
            ("frame_x", image.focal_x),
            ("frame_y", image.focal_y),
            ("frame_lg_x", image.focal_x),
            ("frame_lg_y", image.focal_y),
        ):
            if key not in self.initial_data:
                validated_data[key] = focal
        last = HeroSlide.objects.order_by("-order").values_list("order", flat=True).first()
        validated_data["order"] = (last or 0) + 1
        return super().create(validated_data)


class GalleryPhotoSerializer(serializers.ModelSerializer):
    image = AssetSummarySerializer(read_only=True)
    image_id = serializers.PrimaryKeyRelatedField(
        source="image", queryset=MediaAsset.objects.all()
    )

    class Meta:
        model = GalleryPhoto
        fields = ["id", "image", "image_id", "title", "caption", "alt_text"]
        read_only_fields = ["id"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give the photo a title.")
        return value


class GallerySerializer(serializers.ModelSerializer):
    photos = GalleryPhotoSerializer(many=True, required=False)
    version = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = [
            "id",
            "title",
            "eyebrow",
            "heading",
            "place_name",
            "place_detail",
            "summary",
            "photos",
            "is_featured",
            "created_at",
            "updated_at",
            "version",
        ]
        read_only_fields = ["is_featured", "created_at", "updated_at"]

    def get_version(self, obj) -> str:
        return version_of(obj)

    def validate_photos(self, value):
        if len(value) > 24:
            raise serializers.ValidationError("A gallery can hold at most 24 photos.")
        return value

    def _save_photos(self, gallery, photos):
        if photos is None:
            return
        gallery.photos.all().delete()
        for order, photo in enumerate(photos):
            GalleryPhoto.objects.create(gallery=gallery, order=order, **photo)

    @transaction.atomic
    def create(self, validated_data):
        photos = validated_data.pop("photos", [])
        gallery = super().create(validated_data)
        self._save_photos(gallery, photos)
        return gallery

    @transaction.atomic
    def update(self, instance, validated_data):
        photos = validated_data.pop("photos", None)
        gallery = super().update(instance, validated_data)
        self._save_photos(gallery, photos)
        if photos is not None:
            # The photos are the gallery; changing them is changing it, even
            # when no field of the gallery itself moved.
            gallery.save(update_fields=["updated_at"])
        return gallery


class GallerySummarySerializer(serializers.ModelSerializer):
    photo_count = serializers.IntegerField(source="photos.count", read_only=True)
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = ["id", "title", "heading", "is_featured", "photo_count", "cover", "updated_at"]
        read_only_fields = fields

    def get_cover(self, obj) -> dict | None:
        first = next(iter(obj.photos.all()), None)
        return AssetSummarySerializer(first.image).data if first else None
