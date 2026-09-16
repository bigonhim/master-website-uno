from django.contrib import admin

from .models import FollowUpStatus, SalvationDecision


@admin.register(SalvationDecision)
class SalvationDecisionAdmin(admin.ModelAdmin):
    """The pastoral follow-up queue.

    Submitted fields are read-only: this is a record of what a person said, not
    a form for staff to rewrite. Only the follow-up workflow is editable.
    """

    list_display = [
        "created_at",
        "decision",
        "display_name",
        "country",
        "contactable",
        "follow_up_status",
        "assigned_to",
    ]
    list_filter = ["decision", "follow_up_status", "wants_follow_up", "created_at"]
    search_fields = ["name", "email", "country"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    list_select_related = ["assigned_to"]

    readonly_fields = [
        "id",
        "decision",
        "name",
        "email",
        "phone",
        "country",
        "message",
        "reason",
        "language",
        "step_reached",
        "referral_path",
        "wants_follow_up",
        "consent_text_version",
        "consented_at",
        "ip_hash",
        "retention_expires_at",
        "anonymised_at",
        "created_at",
        "updated_at",
    ]

    fieldsets = [
        ("The response", {"fields": ["decision", "created_at", "country", "language"]}),
        (
            "Contact",
            {
                "fields": ["name", "email", "phone", "message", "reason"],
                "description": "All optional — a person may pray anonymously.",
            },
        ),
        (
            "Consent",
            {
                "fields": ["wants_follow_up", "consent_text_version", "consented_at"],
                "description": "Follow-up requires explicit consent. Do not contact "
                "anyone who has not given it.",
            },
        ),
        (
            "Follow-up",
            {"fields": ["follow_up_status", "assigned_to", "follow_up_notes"]},
        ),
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
                "description": "Records anonymise after 24 months: the decision is kept, "
                "the person is not.",
            },
        ),
    ]

    actions = ["mark_in_progress", "mark_done", "anonymise_now"]

    def has_add_permission(self, request):
        # Records come from the public flow only; a staff member inventing one
        # would corrupt the ministry's own statistics.
        return False

    @admin.display(description="name")
    def display_name(self, obj):
        return obj.name or "Anonymous"

    @admin.display(boolean=True, description="contactable")
    def contactable(self, obj):
        return obj.has_contact_details and obj.wants_follow_up

    @admin.action(description="Mark as in progress")
    def mark_in_progress(self, request, queryset):
        queryset.update(follow_up_status=FollowUpStatus.IN_PROGRESS)

    @admin.action(description="Mark follow-up complete")
    def mark_done(self, request, queryset):
        queryset.update(follow_up_status=FollowUpStatus.DONE)

    @admin.action(description="Anonymise now (keeps the decision, removes the person)")
    def anonymise_now(self, request, queryset):
        for decision in queryset:
            decision.anonymise()
        self.message_user(request, f"Anonymised {queryset.count()} record(s).")


admin.site.site_header = "Ministry of Repentance and Holiness"
