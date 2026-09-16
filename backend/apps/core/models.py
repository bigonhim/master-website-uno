from django.db import models


class TimeStamped(models.Model):
    """Creation and modification stamps, shared by every concrete model."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
