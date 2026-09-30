from django.contrib import admin

from .models import EditorSession, Revision


@admin.register(EditorSession)
class EditorSessionAdmin(admin.ModelAdmin):
    """Who is signed in to the Studio. Deleting a row signs that session out."""

    list_display = ["user", "created_at", "last_used_at", "expires_at", "user_agent"]
    list_select_related = ["user"]
    readonly_fields = ["user", "key_hash", "created_at", "last_used_at", "expires_at", "user_agent"]

    def has_add_permission(self, request):
        return False


@admin.register(Revision)
class RevisionAdmin(admin.ModelAdmin):
    """The Studio's history. A record, so it can't be edited here."""

    list_display = ["created_at", "user", "action", "object_repr", "content_type"]
    list_filter = ["action", "content_type"]
    search_fields = ["object_repr"]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
