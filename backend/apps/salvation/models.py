"""
Salvation decisions.

A record that a named person made a religious decision is special-category data
under GDPR Article 9 and sensitive personal data under Kenya's Data Protection
Act 2019. The audience is explicitly a global diaspora, so both apply.

Three consequences shape this model:
  * the DECISION is the record; contact details are optional extras, because
    praying is the point and nobody should feel surveilled at that moment;
  * consent is explicit and versioned, so the ministry can always show what a
    given person actually agreed to;
  * records expire, and expiry anonymises rather than deletes, so the ministry
    keeps its statistics without keeping its liability.
"""

import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStamped

RETENTION_DAYS = 730  # 24 months from last contact


class Decision(models.TextChoices):
    PRAYED = "prayed", "I prayed"
    NOT_YET = "not_yet", "Not yet"
    HAS_QUESTIONS = "has_questions", "I have questions"
    RECOMMITMENT = "recommitment", "Recommitment"


class FollowUpStatus(models.TextChoices):
    NEW = "new", "New"
    IN_PROGRESS = "in_progress", "In progress"
    DONE = "done", "Completed"
    NO_CONTACT = "no_contact", "No contact details"


class SalvationDecision(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    decision = models.CharField(max_length=16, choices=Decision.choices, db_index=True)

    # Every one of these is optional. A person may pray anonymously.
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=80, blank=True)
    message = models.TextField(blank=True)
    reason = models.CharField(
        max_length=60, blank=True, help_text="For 'not yet': what is holding them back."
    )
    language = models.CharField(max_length=8, default="en")

    # Journey analytics that carry no personal data.
    step_reached = models.PositiveSmallIntegerField(default=0)
    referral_path = models.CharField(max_length=300, blank=True)

    # Consent, versioned so it stays provable.
    wants_follow_up = models.BooleanField(default=False)
    consent_text_version = models.CharField(max_length=20, blank=True)
    consented_at = models.DateTimeField(null=True, blank=True)

    # Abuse control without storing an identifier: a keyed hash, never the IP.
    ip_hash = models.CharField(max_length=64, blank=True)

    # Pastoral workflow, staff-only.
    follow_up_status = models.CharField(
        max_length=16,
        choices=FollowUpStatus.choices,
        default=FollowUpStatus.NEW,
        db_index=True,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="salvation_followups",
    )
    follow_up_notes = models.TextField(blank=True)

    retention_expires_at = models.DateTimeField(db_index=True)
    anonymised_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "salvation decision"

    def __str__(self) -> str:
        who = self.name or "Anonymous"
        return f"{who} — {self.get_decision_display()}"

    def save(self, *args, **kwargs):
        if not self.retention_expires_at:
            self.retention_expires_at = timezone.now() + timedelta(days=RETENTION_DAYS)
        if not self.has_contact_details:
            self.follow_up_status = FollowUpStatus.NO_CONTACT
        super().save(*args, **kwargs)

    @property
    def has_contact_details(self) -> bool:
        return bool(self.email or self.phone)

    def anonymise(self) -> None:
        """Strip the person, keep the statistic."""
        self.name = ""
        self.email = ""
        self.phone = ""
        self.message = ""
        self.ip_hash = ""
        self.follow_up_notes = ""
        self.anonymised_at = timezone.now()
        self.save(
            update_fields=[
                "name",
                "email",
                "phone",
                "message",
                "ip_hash",
                "follow_up_notes",
                "anonymised_at",
                "updated_at",
            ]
        )
