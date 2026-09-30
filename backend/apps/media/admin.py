from django.contrib import admin
from django.utils.html import format_html

from .models import MediaAsset


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    """A fallback view of the library. Photos are uploaded in the Studio, which
    optimises them on the way in; this screen only edits their details."""

    list_display = ["thumb", "title", "collection", "width", "height", "created_at"]
    list_filter = ["collection"]
    search_fields = ["title", "alt_text", "caption", "original_filename"]
    readonly_fields = [
        "file",
        "width",
        "height",
        "file_size",
        "original_filename",
        "checksum",
        "uploaded_by",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    @admin.display(description="")
    def thumb(self, obj):
        return format_html(
            '<img src="{}" alt="" style="height:40px;width:60px;object-fit:cover">',
            obj.url,
        )
