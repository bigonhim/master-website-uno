"""
Fill the healings archive from the ministry's own YouTube channels.

The harvest, `data/youtube/healings.json`, holds the uploads on its two
channels whose titles plainly say a healing happened — "…HEALED", a
testimony, a miracle — and none that merely announce a healing service or
prophesy one. See `apps/content/youtube_import.py` for the rules both
importers keep.

Healings take no theme from the classifier for the same reason teachings do
not: its rules were written for prophecies. The condition reported is left
for staff — a title says "HIV/AIDS HEALED", but naming the condition on the
record is an editorial act.
"""

from django.core.management.base import BaseCommand

from apps.content.models import Kind
from apps.content.youtube_import import (
    add_arguments,
    date_in,
    import_rows,
    load_harvest,
    report,
)


class Command(BaseCommand):
    help = "Import the ministry's healing testimony videos from the saved harvest."

    def add_arguments(self, parser):
        add_arguments(parser)

    def handle(self, *args, **options):
        stats = import_rows(
            load_harvest("healings.json", options.get("file")),
            kind=Kind.HEALING,
            key_prefix="yt-healing",
            dated_by=date_in,
            themed=False,
            publish=options["publish"],
            dry_run=options["dry_run"],
        )
        report(self, stats, options["dry_run"])
