"""
Shared by the importers that fill the archive from the ministry's YouTube
channels (`import_fulfilled`, `import_teachings`).

Both read a saved harvest under `data/youtube/`, never the network, for the
same reason the legacy importer reads a snapshot: videos are deleted and
retitled, so an import that hits YouTube cannot be repeated or re-examined.

Only videos that were public and embeddable when harvested are imported; an
entry nobody can watch is not one anybody can check.

Nothing is written that the ministry did not say. Titles are tidied for
display and kept verbatim beside that; descriptions on YouTube are a line of
boilerplate, so summaries and accounts of fulfilment are left for staff.

Rows land as drafts unless the caller publishes. Publishing is a person's
decision, and the `--publish` flag is how that person makes it.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import CommandError
from django.db import transaction
from django.utils import timezone as django_timezone
from django.utils.text import slugify

from apps.content.legacy.parser import classify, normalise_title
from apps.content.models import (
    Availability,
    Category,
    ContentItem,
    DatePrecision,
    DateSource,
    Status,
    Video,
    VideoAttachment,
)

HARVEST_DIR = Path(__file__).resolve().parents[3] / "data" / "youtube"

MONTHS = {
    name: number
    for number, names in enumerate(
        [
            ("january", "jan"),
            ("february", "feb"),
            ("march", "mar"),
            ("april", "apr"),
            ("may",),
            ("june", "jun"),
            ("july", "jul"),
            ("august", "aug"),
            ("september", "sept", "sep"),
            ("october", "oct"),
            ("november", "nov"),
            ("december", "dec"),
        ],
        start=1,
    )
    for name in names
}

_MONTH = r"\b(" + "|".join(sorted(MONTHS, key=len, reverse=True)) + r")\.?"
DATE_RE = re.compile(_MONTH + r"\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})\b", re.I)

# "AUGUST 23, 2008 PROPHECY FULFILLED": a date directly before the word
# "prophecy" is the day the prophecy was given. A date anywhere else may be
# the day it was fulfilled ("FULFILLED ON APRIL 25, 2015") and is not used.
PROPHECY_DATE_RE = re.compile(DATE_RE.pattern[:-2] + r"\s+prophecy\b", re.I)

# The speaker and the file type, however the uploader wrote them: "- Dr. Owuor",
# "| PROPHET DR.OWUOR", "Dr  Owuor", "-Dr. Owuor.mp4", "- Dr. Owuor. mov",
# "- Prophet Dr. David Owuor Teachings .".
SPEAKER_TAIL_RE = re.compile(
    r"[\s\-–—|,]*\b(?:(?:mega\s+)?prophet\s+)?(?:dr\.?\s*)?(?:david\s+)?owuor\b\.?"
    r"(?:\s+teachings?\b)?"
    r"(?:\s*\.?\s*(?:mov|mp4|wmv|avi|flv))?[\s.]*$",
    re.I,
)
FILE_TAIL_RE = re.compile(r"\s*\.\s*(?:mov|mp4|wmv|avi|flv)\s*$", re.I)
NOTE_TAIL_RE = re.compile(r"\s*\(\s*(?:updated|new documentary)\s*\)\s*$", re.I)
# "… | September 9,  2026": the date a teaching was given, set off at the end.
# It is recorded as the entry's date, so the title need not carry it as well.
DATE_TAIL_RE = re.compile(r"\s*\|\s*" + DATE_RE.pattern[:-2] + r"\s*$", re.I)
FULFIL_WORDS_RE = re.compile(r"\b\w*fulfil\w*\b", re.I)
# smart_title lowercases the letters of an abbreviation after the first.
ABBREVIATION_RE = re.compile(r"\b(?:[A-Za-z]\.){2,}(?:[A-Za-z]\b)?")


def _as_date(match: re.Match | None) -> date | None:
    if not match:
        return None
    try:
        return date(
            int(match.group(3)), MONTHS[match.group(1).lower()], int(match.group(2))
        )
    except ValueError:
        return None


def prophecy_date_in(title: str) -> date | None:
    return _as_date(PROPHECY_DATE_RE.search(title))


def date_in(title: str) -> date | None:
    """The first full date in a title. For a teaching that is the day it was
    given; for a prophecy use `prophecy_date_in`, which is stricter."""
    return _as_date(DATE_RE.search(title))


def clean_title(raw: str) -> tuple[str, str]:
    """Return (display_title, speaker). The raw title is kept by the caller."""
    text = raw.strip()
    speaker = ""
    for _ in range(4):  # "(UPDATED) - PROPHET DR. OWUOR" takes two passes
        before = text
        text = FILE_TAIL_RE.sub("", text)
        text = NOTE_TAIL_RE.sub("", text)
        text = DATE_TAIL_RE.sub("", text)
        if SPEAKER_TAIL_RE.search(text):
            speaker = "Prophet Dr. Owuor"
            text = SPEAKER_TAIL_RE.sub("", text)
        text = text.strip(" -,–—|")
        if text == before:
            break
    display, _, parsed_speaker, _ = normalise_title(text)
    display = ABBREVIATION_RE.sub(lambda m: m.group(0).upper(), display)
    return display.strip(" -,–—|"), speaker or parsed_speaker


def is_watchable(row: dict) -> bool:
    return row.get("availability") == "public" and row.get("playable_in_embed") is True


def group_key(title: str) -> str:
    """Uploads of one film share a title, give or take spacing and a suffix."""
    display = clean_title(title)[0]
    return slugify(re.sub(r"\bpart\s*\d+\b", "", display, flags=re.I))


def load_harvest(name: str, given: str | None = None) -> list[dict]:
    path = Path(given) if given else HARVEST_DIR / name
    if not path.exists():
        raise CommandError(f"No harvest at {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    return [row for row in payload["videos"] if row.get("title")]


def _uploaded(row: dict) -> datetime | None:
    raw = row.get("upload_date") or ""
    if not re.fullmatch(r"\d{8}", raw):
        return None
    return datetime(int(raw[:4]), int(raw[4:6]), int(raw[6:]), tzinfo=timezone.utc)


def _harvested(row: dict) -> datetime:
    raw = row.get("harvested_at")
    return datetime.fromisoformat(raw) if raw else django_timezone.now()


def _unique_slug(title: str, fallback: str) -> str:
    base = slugify(title)[:200] or fallback
    slug, n = base, 2
    while ContentItem.objects.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def import_rows(
    rows: list[dict],
    *,
    kind: str,
    key_prefix: str,
    fulfilled: bool = False,
    dated_by=date_in,
    themed: bool = True,
    publish: bool = False,
    dry_run: bool = False,
) -> dict:
    """Create one entry per title, with every upload of it attached.

    An entry that already exists is left exactly as staff have it; only videos
    it does not have yet are attached. Returns the counts for the report.
    """
    watchable = [row for row in rows if is_watchable(row)]
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in watchable:
        key = group_key(row["title"])
        if key:
            groups[key].append(row)

    categories = {c.slug: c for c in Category.objects.all()}
    content_type = ContentType.objects.get_for_model(ContentItem)
    status = Status.PUBLISHED if publish else Status.DRAFT
    stats = {
        "harvested": len(rows),
        "unwatchable": len(rows) - len(watchable),
        "created": 0,
        "existing": 0,
        "videos": 0,
        "dated": 0,
        "status": status,
    }

    with transaction.atomic():
        for key, members in sorted(groups.items()):
            # The earliest upload names the entry; later ones are re-uploads or
            # further parts and attach to it in the order they went up.
            members.sort(
                key=lambda row: (row.get("upload_date") or "", row["youtube_id"])
            )
            first = members[0]

            title, speaker = clean_title(first["title"])
            # The theme is what was said, so it is read from the title without
            # the words that say it came to pass.
            subcategory = (
                classify(FULFIL_WORDS_RE.sub(" ", title))[1] if themed else None
            )
            given = dated_by(first["title"])
            import_key = hashlib.sha256(f"{key_prefix}|{key}".encode()).hexdigest()

            item, created = ContentItem.objects.get_or_create(
                import_key=import_key,
                defaults={
                    "kind": kind,
                    "status": status,
                    "title": title[:500],
                    "title_source": first["title"][:500],
                    "title_yt": first["title"][:500],
                    "slug": _unique_slug(title, kind),
                    "speaker": speaker,
                    "category": categories.get(slugify(subcategory or "")),
                    "is_fulfilled": fulfilled,
                    "published_at": _uploaded(first),
                    "prophecy_date": given,
                    "date_source": (
                        DateSource.TITLE_PARSED if given else DateSource.UNKNOWN
                    ),
                    "date_precision": (
                        DatePrecision.DAY if given else DatePrecision.UNKNOWN
                    ),
                    # The ministry's own title or playlist says what this is;
                    # nothing here was inferred.
                    "confidence": 1.0,
                    "imported_values": {
                        "source": "youtube",
                        "videos": [row["youtube_id"] for row in members],
                    },
                },
            )
            stats["created" if created else "existing"] += 1
            stats["dated"] += bool(created and given)

            for order, row in enumerate(members):
                video, _ = Video.objects.get_or_create(
                    youtube_id=row["youtube_id"],
                    defaults={
                        "title": (row["title"] or "")[:300],
                        "duration_seconds": row.get("duration"),
                        "published_at": _uploaded(row),
                        "availability": Availability.AVAILABLE,
                        "last_checked_at": _harvested(row),
                    },
                )
                _, attached = VideoAttachment.objects.get_or_create(
                    video=video,
                    content_type=content_type,
                    object_id=item.pk,
                    defaults={
                        "label": f"Video {order + 1}" if len(members) > 1 else "",
                        "order": order,
                        "is_primary": order == 0,
                    },
                )
                stats["videos"] += attached

        if dry_run:
            transaction.set_rollback(True)

    return stats


def report(command, stats: dict, dry_run: bool) -> None:
    out, style = command.stdout, command.style
    if dry_run:
        out.write(style.WARNING("DRY RUN — nothing was written\n"))
    out.write("")
    out.write(f"  in the harvest  : {stats['harvested']}")
    out.write(
        style.WARNING(
            f"  not watchable   : {stats['unwatchable']} (deleted, private or not "
            f"embeddable; skipped)"
        )
    )
    out.write(f"  entries created : {stats['created']} ({stats['status']})")
    out.write(f"  already present : {stats['existing']}")
    out.write(f"  videos attached : {stats['videos']}")
    out.write(f"  dated           : {stats['dated']} (from the title)")


def add_arguments(parser) -> None:
    parser.add_argument("--file", help="Harvest file (default: under data/youtube/).")
    parser.add_argument(
        "--publish",
        action="store_true",
        help="Publish new rows. Without it they land as drafts.",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Report and write nothing."
    )
