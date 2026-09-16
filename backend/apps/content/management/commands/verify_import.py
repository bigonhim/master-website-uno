"""
Import QA.

Checks the imported archive against values measured from the frozen snapshot,
then writes a staff review CSV sorted worst-first. Any deviation from the
expected counts is a real regression, not a tolerance — the numbers come from
parsing the source, not from a previous run of this importer.

The `truncated_title` heuristic is the important one: a title ending in a
conjunction is near-proof that a caption fragment was dropped, which is exactly
how the parser fails without anyone noticing.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db.models import Count, QuerySet

from apps.content.models import (
    Availability,
    ContentItem,
    Status,
    Video,
    VideoAttachment,
)

# Measured against data/source_snapshot/, not assumed.
EXPECTED = {
    "items": 366,
    "videos": 411,
    "attachments": 419,
    "multi_video_items": 43,
    "dead_videos": 111,
}

CONJUNCTION_TAIL = re.compile(r"\b(and|or|of|the|to|in|for|with|from|&)\s*$", re.I)
ORDINAL_LEFTOVER = re.compile(r"\d+\s*\)")
LOW_CONFIDENCE = 0.8


class Command(BaseCommand):
    help = "Verify the imported archive and write a staff review CSV."

    def add_arguments(self, parser):
        parser.add_argument("--csv", default="data/import_review.csv")

    def handle(self, *args, **options):
        actual = {
            "items": ContentItem.objects.count(),
            "videos": Video.objects.count(),
            "attachments": VideoAttachment.objects.count(),
            "multi_video_items": ContentItem.objects.annotate(n=Count("videos"))
            .filter(n__gt=1)
            .count(),
            "dead_videos": Video.objects.filter(
                availability=Availability.UNAVAILABLE
            ).count(),
        }

        self.stdout.write("=== EXPECTED VS ACTUAL ===")
        failures = 0
        for key, expected in EXPECTED.items():
            got = actual[key]
            ok = got == expected
            failures += not ok
            style = self.style.SUCCESS if ok else self.style.ERROR
            self.stdout.write(
                style(
                    f"  {key:<20} expected {expected:>5}  actual {got:>5}  "
                    f"{'OK' if ok else 'MISMATCH'}"
                )
            )

        issues = self._issues()

        self.stdout.write("\n=== QUALITY FLAGS ===")
        for label, queryset in issues.items():
            # hasattr is the wrong test here: list.count() exists too, but takes
            # an argument, so a plain list took the QuerySet branch and raised.
            count = (
                queryset.count() if isinstance(queryset, QuerySet) else len(queryset)
            )
            style = self.style.WARNING if count else self.style.SUCCESS
            self.stdout.write(style(f"  {label:<24} {count}"))

        path = self._write_csv(Path(options["csv"]))
        self.stdout.write(f"\n  staff review CSV : {path}")

        published = ContentItem.objects.filter(status=Status.PUBLISHED).count()
        self.stdout.write(f"  published so far : {published}")

        if failures:
            self.stdout.write(
                self.style.ERROR(
                    f"\n  {failures} count mismatch(es). Investigate before publishing."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "\n  Counts match the snapshot. Ready for staff review."
                )
            )

    def _issues(self) -> dict[str, object]:
        items = ContentItem.objects.all()
        return {
            # A dropped fragment leaves a title hanging on a conjunction.
            "truncated_title": [
                i for i in items if CONJUNCTION_TAIL.search(i.title or "")
            ],
            "ordinal_leftover": [
                i for i in items if ORDINAL_LEFTOVER.search(i.title or "")
            ],
            "suspiciously_short": items.filter(title__regex=r"^.{1,12}$"),
            "duplicate_title": ContentItem.objects.values("title")
            .annotate(n=Count("id"))
            .filter(n__gt=1),
            "low_confidence": items.filter(confidence__lt=LOW_CONFIDENCE),
            "uncategorised": items.filter(category__isnull=True),
            "undated": items.filter(prophecy_date__isnull=True),
            "dead_video_attached": items.filter(
                videos__video__availability=Availability.UNAVAILABLE
            ).distinct(),
            "no_video": items.filter(videos__isnull=True),
            "import_conflicts": items.exclude(import_conflicts=[]),
            "needs_review": items.filter(needs_review=True),
        }

    def _write_csv(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        items = (
            ContentItem.objects.select_related("category").prefetch_related(
                "videos__video"
            )
            # Worst first: a reviewer should never have to hunt for the problems.
            .order_by("-needs_review", "confidence", "title")
        )
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(
                [
                    "id",
                    "kind",
                    "category",
                    "confidence",
                    "needs_review",
                    "title",
                    "title_source",
                    "video_ids",
                    "video_state",
                    "prophecy_date",
                    "date_source",
                    "issues",
                    "admin_url",
                ]
            )
            for item in items:
                attachments = list(item.videos.all())
                dead = sum(
                    1
                    for a in attachments
                    if a.video.availability == Availability.UNAVAILABLE
                )
                issues = []
                if CONJUNCTION_TAIL.search(item.title or ""):
                    issues.append("truncated_title")
                if dead:
                    issues.append("dead_video")
                if item.confidence < LOW_CONFIDENCE:
                    issues.append("low_confidence")
                if item.category is None:
                    issues.append("uncategorised")
                writer.writerow(
                    [
                        item.pk,
                        item.kind,
                        item.category.name if item.category else "",
                        f"{item.confidence:.2f}",
                        "yes" if item.needs_review else "",
                        item.title,
                        item.title_source,
                        " ".join(a.video.youtube_id for a in attachments),
                        f"{dead} dead / {len(attachments)}" if attachments else "none",
                        item.prophecy_date or "",
                        item.date_source,
                        ";".join(issues),
                        f"/admin/content/contentitem/{item.pk}/change/",
                    ]
                )
        return path
