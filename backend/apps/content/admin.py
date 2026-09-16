"""
Django admin.

No Wagtail in v1. The draft-review requirement is met by `ContentItem.status`,
so this is where a volunteer works the import triage queue: filter to
`needs_review`, check the reconstructed title against the video, fix the
category, publish in bulk.
"""

from django.contrib import admin, messages
from django.contrib.contenttypes.admin import GenericTabularInline
from django.db.models import Count
from django.utils.html import format_html

from .models import (
    Availability,
    Category,
    ContentItem,
    Healing,
    Prophecy,
    Region,
    Series,
    Status,
    Teaching,
    Video,
    VideoAttachment,
    Writing,
)


class VideoAttachmentInline(GenericTabularInline):
    model = VideoAttachment
    extra = 0
    autocomplete_fields = ["video"]
    fields = ["video", "label", "order", "is_primary"]


class HasDeadVideoFilter(admin.SimpleListFilter):
    """The triage queue that matters most: roughly a quarter of the legacy
    archive is deleted on YouTube, and those must never be published."""

    title = "video availability"
    parameter_name = "video_state"

    def lookups(self, request, model_admin):
        return [
            ("dead", "Has an unavailable video"),
            ("ok", "All videos available"),
            ("none", "No video attached"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "dead":
            return queryset.filter(
                videos__video__availability=Availability.UNAVAILABLE
            ).distinct()
        if self.value() == "ok":
            return queryset.filter(
                videos__video__availability=Availability.AVAILABLE
            ).distinct()
        if self.value() == "none":
            return queryset.filter(videos__isnull=True)
        return queryset


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "kind",
        "category",
        "status",
        "video_state",
        "confidence_flag",
        "needs_review",
        "prophecy_date",
    ]
    list_filter = [
        "status",
        "kind",
        "needs_review",
        HasDeadVideoFilter,
        "date_source",
        "is_fulfilled",
        "category",
    ]
    # All three titles: a reviewer often searches the shouty original.
    search_fields = ["title", "title_source", "title_yt", "slug"]
    date_hierarchy = "prophecy_date"
    ordering = ["-needs_review", "confidence", "-created_at"]
    list_per_page = 50
    filter_horizontal = ["regions"]
    inlines = [VideoAttachmentInline]
    readonly_fields = [
        "title_source",
        "import_key",
        "import_hash",
        "imported_values",
        "import_conflicts",
        "created_at",
        "updated_at",
    ]
    actions = [
        "publish_selected",
        "unpublish_selected",
        "mark_reviewed",
        "flag_for_review",
    ]

    fieldsets = [
        (
            "Content",
            {
                "fields": [
                    "kind",
                    "status",
                    "title",
                    "kicker",
                    "speaker",
                    "slug",
                    "summary",
                    "body",
                ]
            },
        ),
        (
            "Classification",
            {
                "fields": [
                    "category",
                    "regions",
                    "series",
                    "position_in_series",
                    "is_featured",
                ]
            },
        ),
        (
            "Dating",
            {
                "fields": [
                    "published_at",
                    "prophecy_date",
                    "date_source",
                    "date_precision",
                ],
                "description": "Most imported rows are undated. Set "
                "<em>date source</em> to “Entered by staff” when you "
                "supply one.",
            },
        ),
        (
            "Prophecy",
            {
                "fields": ["is_fulfilled", "fulfillment_summary"],
                "classes": ["collapse"],
            },
        ),
        ("Healing", {"fields": ["condition", "is_anonymous"], "classes": ["collapse"]}),
        ("Review", {"fields": ["needs_review", "confidence"]}),
        (
            "Import provenance",
            {
                "fields": [
                    "title_yt",
                    "title_source",
                    "import_key",
                    "import_hash",
                    "imported_values",
                    "import_conflicts",
                    "created_at",
                    "updated_at",
                ],
                "classes": ["collapse"],
            },
        ),
    ]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category")
            .prefetch_related("videos__video")
        )

    @admin.display(description="video")
    def video_state(self, obj):
        attachments = list(obj.videos.all())
        if not attachments:
            return format_html('<span style="color:#8D9BB4">none</span>')
        dead = sum(
            1 for a in attachments if a.video.availability == Availability.UNAVAILABLE
        )
        if dead:
            return format_html(
                '<strong style="color:#B3261E">{} dead</strong> / {}',
                dead,
                len(attachments),
            )
        return format_html('<span style="color:#0B7A57">{} ok</span>', len(attachments))

    @admin.display(description="confidence", ordering="confidence")
    def confidence_flag(self, obj):
        colour = "#0B7A57" if obj.confidence >= 0.8 else "#9A6A00"
        return format_html(
            '<span style="color:{}">{:.2f}</span>', colour, obj.confidence
        )

    @admin.action(description="Publish selected")
    def publish_selected(self, request, queryset):
        # A dead video must never reach the public site, so this action refuses
        # rather than silently publishing a broken embed.
        blocked = queryset.filter(
            videos__video__availability=Availability.UNAVAILABLE
        ).distinct()
        publishable = queryset.exclude(pk__in=blocked.values("pk"))
        count = publishable.update(status=Status.PUBLISHED)
        self.message_user(request, f"Published {count} item(s).", messages.SUCCESS)
        if blocked.exists():
            self.message_user(
                request,
                f"Skipped {blocked.count()} item(s) with an unavailable video. "
                "Replace or detach the video first.",
                messages.WARNING,
            )

    @admin.action(description="Return to draft")
    def unpublish_selected(self, request, queryset):
        count = queryset.update(status=Status.DRAFT)
        self.message_user(
            request, f"Returned {count} item(s) to draft.", messages.SUCCESS
        )

    @admin.action(description="Mark reviewed")
    def mark_reviewed(self, request, queryset):
        count = queryset.update(needs_review=False)
        self.message_user(
            request, f"Marked {count} item(s) reviewed.", messages.SUCCESS
        )

    @admin.action(description="Flag for review")
    def flag_for_review(self, request, queryset):
        count = queryset.update(needs_review=True)
        self.message_user(request, f"Flagged {count} item(s).", messages.SUCCESS)


class KindAdmin(ContentItemAdmin):
    """Per-kind screens. The `kind` field is fixed by the proxy's save()."""

    list_display = [c for c in ContentItemAdmin.list_display if c != "kind"]
    list_filter = [f for f in ContentItemAdmin.list_filter if f != "kind"]

    def get_exclude(self, request, obj=None):
        return ["kind"]


@admin.register(Teaching)
class TeachingAdmin(KindAdmin):
    pass


@admin.register(Prophecy)
class ProphecyAdmin(KindAdmin):
    pass


@admin.register(Healing)
class HealingAdmin(KindAdmin):
    pass


@admin.register(Writing)
class WritingAdmin(KindAdmin):
    pass


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ["youtube_id", "title", "availability", "used_by", "last_checked_at"]
    list_filter = ["availability", "allow_embed"]
    search_fields = ["youtube_id", "title", "slug"]
    readonly_fields = ["last_checked_at", "created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_uses=Count("attachments"))

    @admin.display(description="used by", ordering="_uses")
    def used_by(self, obj):
        # Answers "where is this dead video used?" in one place, which is why
        # Video is its own model rather than a URL column.
        return obj._uses


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "kind_hint", "parent", "order", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}

    @admin.display(description="items")
    def kind_hint(self, obj):
        return obj.items.count()


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ["name", "iso2", "continent"]
    search_fields = ["name", "iso2"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Series)
class SeriesAdmin(admin.ModelAdmin):
    list_display = ["title", "starts_on", "ends_on", "location", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title", "location"]
    prepopulated_fields = {"slug": ["title"]}


admin.site.site_header = "Ministry of Repentance and Holiness"
admin.site.site_title = "Ministry admin"
admin.site.index_title = "Content administration"
