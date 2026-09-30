"""
Studio serializers.

Each editable thing has one serializer that both shows it and saves it, and
its representation of the writable fields is exactly what it accepts. That is
what makes history work: a revision stores that representation, and restoring
a revision is saving it again through the same validation as any edit.
"""

from datetime import timezone as dt_timezone


def version_of(obj) -> str:
    """An opaque token for "the copy you are editing". Sent back as If-Match,
    so a save over someone else's newer save is refused, not silently lost."""
    return obj.updated_at.astimezone(dt_timezone.utc).isoformat()
