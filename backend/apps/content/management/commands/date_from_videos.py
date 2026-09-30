"""
Date undated teachings from their videos' upload dates.

Half the teachings name their date in the title and are already parsed; the
rest say nothing, but every one of them is a YouTube upload, and YouTube
publishes the upload date in the watch page's microformat. That date is when
the recording was posted, not necessarily when it was preached, so it lands
under its own `date_source` ("video") and never overwrites a parsed or
manually entered date.

Idempotent — safe to re-run after every import. Items whose videos cannot be
reached are left untouched and reported.
"""

import re
import urllib.request

from django.core.management.base import BaseCommand

from apps.content.models import ContentItem, DatePrecision, DateSource

# The microformat carries `"uploadDate":"2011-06-04"` (newer pages append a
# time and offset, which the date alone survives).
UPLOAD_DATE_RE = re.compile(r'"uploadDate":"(\d{4}-\d{2}-\d{2})')

# Without a browser user agent YouTube serves a stripped page without the fact.
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


def upload_date(youtube_id: str) -> str | None:
    """The video's upload date as YYYY-MM-DD, or None if the page hides it."""
    request = urllib.request.Request(
        f"https://www.youtube.com/watch?v={youtube_id}",
        headers={"User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            page = response.read().decode("utf-8", errors="replace")
    except OSError:
        return None
    match = UPLOAD_DATE_RE.search(page)
    return match.group(1) if match else None


class Command(BaseCommand):
    help = "Date undated teachings and healings from their videos' upload dates. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Report changes without saving."
        )
        parser.add_argument(
            "--kind",
            default="teaching",
            choices=["teaching", "healing", "prophecy"],
            help="Which kind of entry to date (default: teaching).",
        )

    def handle(self, *args, dry_run=False, kind="teaching", **options):
        undated = ContentItem.objects.filter(
            kind=kind, date_source=DateSource.UNKNOWN
        ).prefetch_related("videos__video")

        dated = missed = 0
        for item in undated:
            attachments = sorted(
                item.videos.all(), key=lambda a: (not a.is_primary, a.order)
            )
            if not attachments:
                continue

            # The importers store the upload date on the video; only a video
            # that arrived without one costs a trip to YouTube.
            known = attachments[0].video.published_at
            date = (
                known.date().isoformat()
                if known
                else upload_date(attachments[0].video.youtube_id)
            )
            if date is None:
                self.stdout.write(f"missed {item.title}")
                missed += 1
                continue

            self.stdout.write(f"{date}  {item.title}")
            if not dry_run:
                item.prophecy_date = date
                item.date_source = DateSource.VIDEO
                item.date_precision = DatePrecision.DAY
                item.save(
                    update_fields=[
                        "prophecy_date",
                        "date_source",
                        "date_precision",
                        "updated_at",
                    ]
                )
            dated += 1

        verb = "Would date" if dry_run else "Dated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} {dated} {kind} entries; {missed} unreachable.")
        )
