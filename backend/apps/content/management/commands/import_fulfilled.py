"""
Fill the fulfilment archive from the ministry's own YouTube channels.

The harvest, `data/youtube/fulfilled_prophecies.json`, holds two things, both
the ministry's own statement that a prophecy was fulfilled:

  * uploads whose title says so ("... PROPHECY FULFILLED", "... & FULFILMENT");
  * the entries of its "FULFILLED PROPHECIES" playlist.

No account of the fulfilment is imported: `fulfillment_summary` is left for
staff to write, and the recording is the account until they do. See
`apps/content/youtube_import.py` for the rules both YouTube importers keep.
"""

from django.core.management.base import BaseCommand

from apps.content.models import Kind
from apps.content.youtube_import import (
    add_arguments,
    import_rows,
    load_harvest,
    prophecy_date_in,
    report,
)


class Command(BaseCommand):
    help = "Import the ministry's fulfilled-prophecy videos from the saved harvest."

    def add_arguments(self, parser):
        add_arguments(parser)

    def handle(self, *args, **options):
        stats = import_rows(
            load_harvest("fulfilled_prophecies.json", options.get("file")),
            kind=Kind.PROPHECY,
            key_prefix="yt-fulfilled",
            fulfilled=True,
            dated_by=prophecy_date_in,
            publish=options["publish"],
            dry_run=options["dry_run"],
        )
        report(self, stats, options["dry_run"])
