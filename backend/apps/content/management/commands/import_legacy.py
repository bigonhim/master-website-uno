"""
Seed the archive from the frozen legacy snapshot.

Runs against `data/source_snapshot/`, never the live site: the source is still
being edited and its videos are being deleted, so an import that hits the
network is not reproducible and a bug in it cannot be re-examined.

Everything lands as a DRAFT. Roughly a quarter of the archive's videos are
already deleted on YouTube, and classification confidence is below 0.8 for most
rows, so publication is a human decision.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.content.legacy.parser import (
    classify,
    find_orphan_ids,
    normalise_title,
    parse_homepage,
)
from apps.content.models import (
    Availability,
    Category,
    ContentItem,
    Status,
    Video,
    VideoAttachment,
)

CONFIDENCE_REVIEW_THRESHOLD = 0.8


class Command(BaseCommand):
    help = "Import the legacy archive from the frozen snapshot as draft rows."

    def add_arguments(self, parser):
        parser.add_argument("--snapshot", help="Snapshot directory (default: newest).")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change and write nothing.",
        )
        parser.add_argument("--limit", type=int, help="Process only the first N items.")

    def handle(self, *args, **options):
        snapshot = self._resolve_snapshot(options.get("snapshot"))
        markup = (snapshot / "index.html").read_text(encoding="utf-8", errors="replace")
        availability = self._load_availability()

        items = parse_homepage(markup)
        if options.get("limit"):
            items = items[: options["limit"]]

        claimed = {vid for item in items for vid in item.video_ids}
        orphans = find_orphan_ids(markup, claimed)
        categories = {c.slug: c for c in Category.objects.all()}

        stats = {
            "created": 0,
            "updated": 0,
            "unchanged": 0,
            "skipped_locked": 0,
            "videos": 0,
            "needs_review": 0,
            "dead_video": 0,
        }
        conflicts: list[str] = []
        # A dry run has to account for the videos it would create too. Reporting
        # zero because the write path was skipped makes the preview untrustworthy
        # exactly where it matters most.
        planned_videos: set[str] = set()

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("DRY RUN — nothing will be written\n"))

        with transaction.atomic():
            for parsed in items:
                title, kicker, speaker, ordinal = normalise_title(parsed.title_source)
                if not title:
                    continue

                kind, subcategory, confidence = classify(title)
                payload = {
                    "title": title,
                    # The raw reconstruction, kept verbatim. Normalisation is a
                    # display convenience and has to stay reversible: the
                    # ministry's own wording is not ours to discard.
                    "title_source": parsed.title_source,
                    "kicker": kicker,
                    "speaker": speaker,
                    "kind": kind,
                    "source_order": ordinal,
                    "confidence": round(confidence, 2),
                }
                import_key = self._import_key(title, parsed.video_ids)
                import_hash = hashlib.sha256(
                    json.dumps(
                        {**payload, "videos": sorted(parsed.video_ids)}, sort_keys=True
                    ).encode()
                ).hexdigest()

                dead = any(
                    availability.get(v) == Availability.UNAVAILABLE
                    for v in parsed.video_ids
                )
                if dead:
                    stats["dead_video"] += 1

                needs_review = (
                    confidence < CONFIDENCE_REVIEW_THRESHOLD
                    or parsed.needs_review
                    or dead
                )
                if needs_review:
                    stats["needs_review"] += 1

                if options["dry_run"]:
                    stats["created"] += 1
                    planned_videos.update(parsed.video_ids)
                    continue

                item, created = ContentItem.objects.get_or_create(
                    import_key=import_key,
                    defaults={
                        **payload,
                        "status": Status.DRAFT,
                        "slug": self._unique_slug(title),
                        "import_hash": import_hash,
                        "imported_values": payload,
                        "needs_review": needs_review,
                        "category": categories.get(slugify(subcategory or ""), None),
                    },
                )

                if created:
                    stats["created"] += 1
                elif item.import_hash == import_hash:
                    stats["unchanged"] += 1
                else:
                    changed = self._refresh_unedited(item, payload)
                    if changed is None:
                        stats["skipped_locked"] += 1
                    else:
                        conflicts.extend(changed)
                        item.import_hash = import_hash
                        item.imported_values = payload
                        item.save()
                        stats["updated"] += 1

                for order, video_id in enumerate(parsed.video_ids):
                    video, made = Video.objects.get_or_create(
                        youtube_id=video_id,
                        defaults={
                            "availability": availability.get(
                                video_id, Availability.UNKNOWN
                            )
                        },
                    )
                    stats["videos"] += made
                    label = parsed.labels[order] if order < len(parsed.labels) else ""
                    VideoAttachment.objects.get_or_create(
                        video=video,
                        content_type_id=self._content_type_id(),
                        object_id=item.pk,
                        defaults={
                            "label": label,
                            "order": order,
                            "is_primary": order == 0,
                        },
                    )

            if options["dry_run"]:
                existing = set(
                    Video.objects.filter(youtube_id__in=planned_videos).values_list(
                        "youtube_id", flat=True
                    )
                )
                stats["videos"] = len(planned_videos - existing)
                transaction.set_rollback(True)

        self._report(stats, orphans, conflicts, snapshot, options["dry_run"])

    # ---------------------------------------------------------------- helpers

    def _resolve_snapshot(self, given: str | None) -> Path:
        if given:
            path = Path(given)
        else:
            root = Path(__file__).resolve().parents[5] / "data" / "source_snapshot"
            candidates = sorted(p for p in root.glob("*") if p.is_dir())
            if not candidates:
                raise CommandError(
                    "No snapshot found. Run the Phase 0 capture first — the importer "
                    "never reads the live site."
                )
            path = candidates[-1]
        if not (path / "index.html").exists():
            raise CommandError(f"{path} has no index.html")
        return path

    def _load_availability(self) -> dict[str, str]:
        meta = Path(__file__).resolve().parents[5] / "data" / "youtube_meta.jsonl"
        if not meta.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No youtube_meta.jsonl — video availability will be 'unknown' "
                    "and nothing can be safely published."
                )
            )
            return {}
        result = {}
        for line in meta.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                result[row["youtube_id"]] = row["availability"]
        return result

    @staticmethod
    def _import_key(title: str, video_ids: list[str]) -> str:
        basis = f"{slugify(title)}|{'|'.join(sorted(video_ids))}"
        return hashlib.sha256(basis.encode()).hexdigest()[:64]

    @staticmethod
    def _unique_slug(title: str) -> str:
        base = slugify(title)[:200] or "item"
        slug, n = base, 2
        while ContentItem.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    @staticmethod
    def _refresh_unedited(item: ContentItem, payload: dict) -> list[str] | None:
        """Update only fields a human has not touched.

        A field counts as machine-owned while it still matches what the importer
        last wrote. Once someone edits it, the importer leaves it alone forever
        and records the divergence instead of overwriting the person's work.
        """
        conflicts = []
        for field, value in payload.items():
            current = getattr(item, field)
            last_written = item.imported_values.get(field)
            if current in (None, "", last_written):
                setattr(item, field, value)
            elif current != value:
                conflicts.append(f"{item.slug}:{field}")
        return conflicts

    @staticmethod
    def _content_type_id() -> int:
        from django.contrib.contenttypes.models import ContentType

        return ContentType.objects.get_for_model(ContentItem).id

    def _report(self, stats, orphans, conflicts, snapshot, dry_run):
        self.stdout.write("")
        self.stdout.write(f"  snapshot        : {snapshot.name}")
        for key in ("created", "updated", "unchanged", "skipped_locked", "videos"):
            self.stdout.write(f"  {key:<15} : {stats[key]}")
        self.stdout.write(
            self.style.WARNING(f"  needs_review    : {stats['needs_review']}")
        )
        self.stdout.write(
            self.style.WARNING(f"  dead video      : {stats['dead_video']}")
        )
        if orphans:
            self.stdout.write(
                self.style.WARNING(
                    f"  orphan video ids: {len(orphans)} — linked from images, not "
                    f"captured by any caption. Not imported silently."
                )
            )
            for vid in orphans[:10]:
                self.stdout.write(f"      {vid}")
        if conflicts:
            self.stdout.write(
                self.style.WARNING(f"  edit conflicts  : {len(conflicts)} (left as-is)")
            )
        if dry_run:
            self.stdout.write(self.style.WARNING("\n  DRY RUN — rolled back."))
        else:
            self.stdout.write(
                self.style.SUCCESS("\n  Imported as drafts. Nothing is public yet.")
            )
