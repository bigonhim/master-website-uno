"""
The Studio's own records: who is signed in, and what everyone changed.
"""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


class EditorSession(models.Model):
    """A signed-in Studio editor.

    The token itself is never stored, only its hash: a leaked database backup
    signs nobody in. It lives in an httpOnly cookie on the site's own domain
    and reaches Django only through the site's server, so no script on any
    page can read it and the API needs no cross-origin cookies.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="studio_sessions"
    )
    key_hash = models.CharField(max_length=64, unique=True)
    # The account's session hash when this began (Django derives it from the
    # password). A changed password no longer matches, which ends the session,
    # as it ends the account's Django admin sessions.
    auth_hash = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(db_index=True)
    user_agent = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-last_used_at"]

    def __str__(self) -> str:
        return f"{self.user} since {self.created_at:%Y-%m-%d %H:%M}"

    @classmethod
    def start(cls, user, user_agent: str = "") -> tuple["EditorSession", str]:
        """Create a session; returns it and the token, which exists only here."""
        key = secrets.token_urlsafe(32)
        session = cls.objects.create(
            user=user,
            key_hash=hash_key(key),
            auth_hash=user.get_session_auth_hash(),
            expires_at=timezone.now() + timedelta(days=settings.STUDIO_SESSION_DAYS),
            user_agent=user_agent[:200],
        )
        return session, key

    @property
    def is_expired(self) -> bool:
        return self.expires_at <= timezone.now()


class Action(models.TextChoices):
    CREATED = "created", "Created"
    UPDATED = "updated", "Edited"
    PUBLISHED = "published", "Published"
    UNPUBLISHED = "unpublished", "Returned to draft"
    RESTORED = "restored", "Restored an earlier version"
    REORDERED = "reordered", "Reordered"
    RESET = "reset", "Reset to the original words"
    DELETED = "deleted", "Deleted"


class Revision(models.Model):
    """One saved change, with the full state it left behind.

    Every save through the Studio writes one, for every kind of thing it edits,
    so any version of anything can be seen and brought back.
    """

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    # Text, not an integer: site sections are identified by their key.
    object_id = models.CharField(max_length=64, db_index=True)
    object_repr = models.CharField(max_length=300)
    action = models.CharField(max_length=16, choices=Action.choices)
    data = models.JSONField(default=dict)
    changed_fields = models.JSONField(default=list)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="studio_revisions",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["content_type", "object_id", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.get_action_display()}: {self.object_repr}"
