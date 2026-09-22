"""
Fill in the archive's groupings from what the titles already say.

The legacy importer assigns a theme to prophecies but never links nations,
and teachings arrive with no theme at all, so the Theme and Nation filters sat
empty on most of the archive. Titles like "Message of the LORD to Kenya…" or
"The Highway of Holiness…" carry that information plainly; this reads it off.

Only blanks are filled. A theme an editor has set is never replaced, and
nations are only ever added, never removed. Idempotent — safe to re-run after
every import.
"""

import re

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.content.models import Category, ContentItem, Region

# Theme slug -> title pattern. Checked in order; the first match wins.
THEME_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("repentance", re.compile(r"\brepent|\bholiness\b|\bholy living\b", re.I)),
]


def nations_in(title: str, names: list[str]) -> list[str]:
    """Nation names mentioned in `title`, in the order given.

    Longer names are matched first and their text blanked out, so "South
    Sudan" is not also counted as "Sudan".
    """
    remaining = title
    found: list[str] = []
    for name in sorted(names, key=len, reverse=True):
        pattern = re.compile(rf"\b{re.escape(name)}\b", re.I)
        if pattern.search(remaining):
            found.append(name)
            remaining = pattern.sub(" ", remaining)
    return [n for n in names if n in found]


def theme_for(title: str) -> str | None:
    """The slug of the theme a title plainly names, or None."""
    for slug, pattern in THEME_RULES:
        if pattern.search(title):
            return slug
    return None


class Command(BaseCommand):
    help = "Link nations and fill missing themes from item titles. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Report changes without saving."
        )

    @transaction.atomic
    def handle(self, *args, dry_run=False, **options):
        regions = {r.name: r for r in Region.objects.all()}
        categories = {c.slug: c for c in Category.objects.all()}
        names = list(regions)

        themed = linked = 0
        for item in ContentItem.objects.prefetch_related("regions"):
            if item.category_id is None:
                slug = theme_for(item.title)
                if slug and slug in categories:
                    self.stdout.write(f"theme  {item.kind:9} {slug:12} {item.title}")
                    item.category = categories[slug]
                    if not dry_run:
                        item.save(update_fields=["category", "updated_at"])
                    themed += 1

            have = {r.name for r in item.regions.all()}
            new = [n for n in nations_in(item.title, names) if n not in have]
            if new:
                self.stdout.write(f"nation {item.kind:9} {', '.join(new):12} {item.title}")
                if not dry_run:
                    item.regions.add(*(regions[n] for n in new))
                linked += 1

        if dry_run:
            transaction.set_rollback(True)
        verb = "Would update" if dry_run else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb}: {themed} themes filled, {linked} items linked to nations.")
        )
