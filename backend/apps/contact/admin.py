from django.contrib import admin

from .models import ContactMessage, ReplyStatus


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """The office's inbox.

    What a person wrote is read-only: this is a record of what they said, not a
    form for staff to rewrite. Only the reply workflow is editable.
    """

    list_display = [
        "created_at",
        "topic",
        "display_name",
        "has_phone",
        "status",
        "assigned_to",
    ]
    list_filter = ["topic", "status", "created_at"]
    search_fields = ["name", "email", "message"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    list_select_related = ["assigned_to"]

    readonly_fields = [
        "id",
        "topic",
        "name",
        "email",
        "phone",
        "message",
        "ip_hash",
        "retention_expires_at",
        "anonymised_at",
        "created_at",
        "updated_at",
    ]

    fieldsets = [
        ("The message", {"fields": ["topic", "created_at", "message"]}),
        ("From", {"fields": ["name", "email", "phone"]}),
        ("Reply", {"fields": ["status", "assigned_to", "notes"]}),
        (
            "Retention",
            {
                "fields": [
                    "id",
                    "ip_hash",
                    "retention_expires_at",
                    "anonymised_at",
                    "updated_at",
                ],
                "classes": ["collapse"],
                "description": "Messages anonymise after 24 months: that a message "
                "came is kept, the person and their words are not.",
            },
        ),
    ]

    actions = ["mark_in_progress", "mark_done", "anonymise_now"]

    def has_add_permission(self, request):
        # Messages come from the public form only.
        return False

    @admin.display(description="name")
    def display_name(self, obj):
        return obj.name or "Removed"

    @admin.display(boolean=True, description="phone")
    def has_phone(self, obj):
        return bool(obj.phone)

    @admin.action(description="Mark as in progress")
    def mark_in_progress(self, request, queryset):
        queryset.update(status=ReplyStatus.IN_PROGRESS)

    @admin.action(description="Mark as answered")
    def mark_done(self, request, queryset):
        queryset.update(status=ReplyStatus.DONE)

    @admin.action(description="Anonymise now (removes the person and their words)")
    def anonymise_now(self, request, queryset):
        for message in queryset:
            message.anonymise()
        self.message_user(request, f"Anonymised {queryset.count()} message(s).")
