"""
Moves the site's built-in photos into the Studio.

Until the Studio existed, the hero slides and the recognition gallery were
files in frontend/public/ described by frontend/lib/site/builtin-photos.json.
This copies them into the photo library and creates the same slides and
gallery from them, so the site looks exactly as it did but every photo and
caption is now editable.

Safe to run again: photos already in the library are reused (matched by
content), and slides or galleries that already exist are left alone.
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.media.models import MediaAsset
from apps.media.processing import checksum_of, process_upload, store
from apps.sitecontent.models import Gallery, GalleryPhoto, HeroSlide

FRONTEND = settings.BASE_DIR.parent / "frontend"


def import_photo(path: Path, **fields) -> MediaAsset:
    raw = path.read_bytes()
    existing = MediaAsset.objects.filter(checksum=checksum_of(raw)).first()
    if existing:
        return existing
    with path.open("rb") as handle:
        processed = process_upload(File(handle, name=path.name))
    return store(processed, **fields)


class Command(BaseCommand):
    help = "Copy the built-in hero slides and recognition gallery into the Studio."

    def add_arguments(self, parser):
        parser.add_argument(
            "--frontend",
            default=str(FRONTEND),
            help="Path to the frontend folder (default: the one beside backend/).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        root = Path(options["frontend"])
        source = root / "lib" / "site" / "builtin-photos.json"
        if not source.exists():
            raise CommandError(f"Not found: {source}")
        builtin = json.loads(source.read_text(encoding="utf-8"))

        def photo(src: str) -> Path:
            path = root / "public" / src.lstrip("/")
            if not path.exists():
                raise CommandError(f"Photo not found: {path}")
            return path

        if HeroSlide.objects.exists():
            self.stdout.write("Hero slides already exist; left as they are.")
        else:
            for order, slide in enumerate(builtin["heroSlides"]):
                asset = import_photo(
                    photo(slide["src"]),
                    alt_text=slide["alt"],
                    collection="Hero",
                    focal_x=slide["frameLg"]["x"],
                    focal_y=slide["frameLg"]["y"],
                )
                HeroSlide.objects.create(
                    image=asset,
                    place=slide["place"],
                    detail=slide.get("detail", ""),
                    event=slide["event"],
                    frame_x=slide["frame"]["x"],
                    frame_y=slide["frame"]["y"],
                    frame_lg_x=slide["frameLg"]["x"],
                    frame_lg_y=slide["frameLg"]["y"],
                    order=order,
                )
            self.stdout.write(
                self.style.SUCCESS(f"Created {len(builtin['heroSlides'])} hero slides.")
            )

        recognition = builtin["recognition"]
        if Gallery.objects.exists():
            self.stdout.write("A gallery already exists; left as it is.")
        else:
            place = recognition["place"]
            gallery = Gallery.objects.create(
                title=f"{place['name']}, {place['detail']}",
                eyebrow=recognition["eyebrow"],
                heading=recognition["heading"],
                place_name=place["name"],
                place_detail=place["detail"],
                summary=recognition["summary"],
                is_featured=True,
            )
            for order, item in enumerate(recognition["photos"]):
                x, y = _focus(item.get("focus"))
                asset = import_photo(
                    photo(item["src"]),
                    title=item["title"],
                    alt_text=item["alt"],
                    caption=item["caption"],
                    collection=f"Recognition — {place['name']}",
                    focal_x=x,
                    focal_y=y,
                )
                GalleryPhoto.objects.create(
                    gallery=gallery,
                    image=asset,
                    title=item["title"],
                    caption=item["caption"],
                    order=order,
                )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created the {gallery.title} gallery with "
                    f"{len(recognition['photos'])} photos."
                )
            )


def _focus(value: str | None) -> tuple[float, float]:
    """'60% 50%' -> (0.6, 0.5); centred when not given."""
    if not value:
        return 0.5, 0.5
    x, y = (float(part.rstrip("%")) / 100 for part in value.split())
    return x, y
