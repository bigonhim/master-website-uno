"""
Messages sent to the ministry through the contact page.

People write to a church about their prayers, their health and their faith, so
a message here is treated as the salvation decisions are: only what is needed
to answer is asked for, the caller's address is never stored, and the person
is removed from the record once the retention window has passed.
"""

import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStamped

RETENTION_DAYS = 730  # 24 months, the same window as salvation decisions


class Topic(models.TextChoices):
    PRAYER = "prayer", "Prayer"
    VISIT = "visit", "Attending a service"
    TEACHINGS = "teachings", "The teachings"
    OTHER = "other", "Something else"


class ReplyStatus(models.TextChoices):
    NEW = "new", "New"
    IN_PROGRESS = "in_progress", "In progress"
    DONE = "done", "Answered"


class ContactMessage(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    topic = models.CharField(
        max_length=16, choices=Topic.choices, default=Topic.OTHER, db_index=True
    )
    name = models.CharField(max_length=200)
    email = models.EmailField()
    # Optional: only for someone who would rather be called back.
    phone = models.CharField(max_length=40, blank=True)
    message = models.TextField(max_length=5000)

    # Abuse control without storing an identifier: a keyed hash, never the IP.
    ip_hash = models.CharField(max_length=64, blank=True)

    # Office workflow, staff-only.
    status = models.CharField(
        max_length=16,
        choices=ReplyStatus.choices,
        default=ReplyStatus.NEW,
        db_index=True,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="contact_messages",
    )
    notes = models.TextField(blank=True)

    retention_expires_at = models.DateTimeField(db_index=True)
    anonymised_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "contact message"

    def __str__(self) -> str:
        return f"{self.name or 'Removed'} — {self.get_topic_display()}"

    def save(self, *args, **kwargs):
        if not self.retention_expires_at:
            self.retention_expires_at = timezone.now() + timedelta(days=RETENTION_DAYS)
        super().save(*args, **kwargs)

    def anonymise(self) -> None:
        """Strip the person and what they wrote; keep that a message came."""
        self.name = ""
        self.email = ""
        self.phone = ""
        self.message = ""
        self.ip_hash = ""
        self.notes = ""
        self.anonymised_at = timezone.now()
        self.save(
            update_fields=[
                "name",
                "email",
                "phone",
                "message",
                "ip_hash",
                "notes",
                "anonymised_at",
                "updated_at",
            ]
        )
