from django.contrib import admin

from .models import Gallery, GalleryPhoto, HeroSlide, SiteSection


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ["__str__", "order", "is_active"]
    list_editable = ["order", "is_active"]
    autocomplete_fields = ["image"]


class GalleryPhotoInline(admin.TabularInline):
    model = GalleryPhoto
    extra = 0
    autocomplete_fields = ["image"]
    fields = ["image", "title", "caption", "alt_text", "order"]


@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ["title", "is_featured", "updated_at"]
    inlines = [GalleryPhotoInline]


@admin.register(SiteSection)
class SiteSectionAdmin(admin.ModelAdmin):
    """Read-only here: the Studio validates each section against its fields,
    and a raw JSON box would not."""

    list_display = ["__str__", "updated_at", "updated_by"]
    readonly_fields = ["key", "data", "updated_at", "updated_by"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
