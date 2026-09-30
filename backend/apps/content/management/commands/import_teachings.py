"""
Fill the teachings archive from the ministry's own YouTube channels.

The harvest, `data/youtube/teachings.json`, holds the uploads on its two
channels that it titles as teachings, the entries of its "PROPHET DR. OWUOR
TEACHINGS" playlist, and any entry marked `selected_by: hand` in the file,
which a person chose because the title did not say "teaching" but the film is
one. See `apps/content/youtube_import.py` for the rules both importers keep.

Teachings take no theme from the classifier: its rules were written for
prophecies, and a teaching on the rapture is not a prophecy of it.
`tag_from_titles` fills what themes a title plainly names.
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
    help = "Import the ministry's teaching videos from the saved harvest."

    def add_arguments(self, parser):
        add_arguments(parser)

    def handle(self, *args, **options):
        stats = import_rows(
            load_harvest("teachings.json", options.get("file")),
            kind=Kind.TEACHING,
            key_prefix="yt-teaching",
            dated_by=date_in,
            themed=False,
            publish=options["publish"],
            dry_run=options["dry_run"],
        )
        report(self, stats, options["dry_run"])
