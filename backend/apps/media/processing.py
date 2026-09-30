"""
What happens to a photo on the way into the library.

Staff upload whatever their phone or camera produced: a 12MB JPEG lying on its
side, carrying the GPS position of the house it was taken in. What is stored is
the photo the site needs and nothing else:

- turned the right way up (phones record rotation as metadata, not pixels);
- at most 2560px on its long edge, the size the hero photos were prepared at,
  which is the largest any photo is ever shown; the image optimiser sizes it
  down per screen from there;
- WebP at quality 92, the setting the hero photos were prepared at: large on
  screen, the default 75 visibly softens them;
- with no EXIF at all, so no location, device or owner details reach the
  public. Only the colour profile is kept, so colours do not shift.

A WebP that already meets all of this (within 2560px, and carrying nothing
but its picture and colour profile: no EXIF, no XMP, nothing trailing) is kept
byte for byte: encoding it again would only lose detail.

The file is opened as an image before anything else. Anything Pillow cannot
read as a JPEG, PNG or WebP is refused, whatever its name says it is.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath

from django.core.files.base import ContentFile
from django.utils.text import slugify
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
# A 60-megapixel ceiling admits any real camera and refuses decompression
# bombs: a tiny file that claims billions of pixels to exhaust memory.
MAX_PIXELS = 60_000_000
MAX_EDGE = 2560
QUALITY = 92
# MPO is how Pillow reports the JPEGs many cameras write (a JPEG with a
# second, preview frame); it is a JPEG for every purpose here.
ACCEPTED_FORMATS = {"JPEG", "MPO", "PNG", "WEBP"}
# The Pillow readers tried, so nothing but these three formats is ever parsed
# (the JPEG reader also opens MPO files).
OPENERS = ["JPEG", "PNG", "WEBP"]
# The only chunks a WebP kept byte for byte may carry: image data, alpha and
# a colour profile. EXIF and XMP (where a location would be) are not among them.
CLEAN_WEBP_CHUNKS = {b"VP8 ", b"VP8L", b"VP8X", b"ALPH", b"ICCP"}


class RejectedUpload(ValueError):
    """The upload is not a photo the library will store. The message is safe
    to show the person who uploaded it."""


@dataclass
class ProcessedPhoto:
    content: ContentFile
    width: int
    height: int
    checksum: str
    original_filename: str
    title: str


def checksum_of(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def title_from_filename(filename: str) -> str:
    stem = PurePath(filename).stem.replace("_", " ").replace("-", " ").strip()
    stem = " ".join(stem.split())
    return (stem[:1].upper() + stem[1:])[:200] if stem else "Untitled photo"


def is_clean_webp(raw: bytes) -> bool:
    """True when a WebP holds nothing but its picture: every chunk is image
    data or a colour profile, and nothing trails the declared file length."""
    if len(raw) < 12 or raw[:4] != b"RIFF" or raw[8:12] != b"WEBP":
        return False
    if int.from_bytes(raw[4:8], "little") + 8 != len(raw):
        return False
    offset = 12
    while offset < len(raw):
        if offset + 8 > len(raw):
            return False
        fourcc = raw[offset : offset + 4]
        size = int.from_bytes(raw[offset + 4 : offset + 8], "little")
        if fourcc not in CLEAN_WEBP_CHUNKS:
            return False
        offset += 8 + size + (size & 1)
    return offset == len(raw)


def process_upload(upload) -> ProcessedPhoto:
    """Validate and re-encode an uploaded file. Raises RejectedUpload."""
    if upload.size and upload.size > MAX_UPLOAD_BYTES:
        raise RejectedUpload("That file is larger than 25 MB.")
    raw = upload.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise RejectedUpload("That file is larger than 25 MB.")
    if not raw:
        raise RejectedUpload("That file is empty.")

    try:
        with Image.open(BytesIO(raw), formats=OPENERS) as probe:
            if probe.format not in ACCEPTED_FORMATS:
                raise RejectedUpload("Upload a JPEG, PNG or WebP photo.")
            if probe.width * probe.height > MAX_PIXELS:
                raise RejectedUpload("That photo is too large (over 60 megapixels).")
            # Already what this pipeline would produce: kept byte for byte, as
            # a second encode would only lose detail.
            web_ready = (
                probe.format == "WEBP"
                and max(probe.size) <= MAX_EDGE
                and not getattr(probe, "is_animated", False)
                and is_clean_webp(raw)
            )
            size = probe.size
            probe.verify()
        # verify() leaves the image unusable; open it again to decode it.
        image = Image.open(BytesIO(raw), formats=OPENERS)
        image.seek(0)  # the first frame of an animated file
        icc_profile = image.info.get("icc_profile")
        image = ImageOps.exif_transpose(image)
        image.load()
    except RejectedUpload:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        raise RejectedUpload("That file could not be read as a JPEG, PNG or WebP photo.") from None

    checksum = checksum_of(raw)
    original = PurePath(getattr(upload, "name", "") or "photo").name[:255]
    stem = slugify(PurePath(original).stem)[:60] or "photo"
    name = f"{stem}-{checksum[:10]}.webp"
    title = title_from_filename(original)

    if web_ready:
        return ProcessedPhoto(
            content=ContentFile(raw, name=name),
            width=size[0],
            height=size[1],
            checksum=checksum,
            original_filename=original,
            title=title,
        )

    has_alpha = image.mode in ("RGBA", "LA") or (
        image.mode == "P" and "transparency" in image.info
    )
    image = image.convert("RGBA" if has_alpha else "RGB")
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

    out = BytesIO()
    options = {"quality": QUALITY, "method": 4}
    if icc_profile:
        options["icc_profile"] = icc_profile
    image.save(out, "WEBP", **options)

    return ProcessedPhoto(
        content=ContentFile(out.getvalue(), name=name),
        width=image.width,
        height=image.height,
        checksum=checksum,
        original_filename=original,
        title=title,
    )


def store(processed: ProcessedPhoto, **fields):
    """Save a processed photo as a new library asset."""
    from .models import MediaAsset

    asset = MediaAsset(
        title=fields.pop("title", "") or processed.title,
        original_filename=processed.original_filename,
        checksum=processed.checksum,
        file_size=processed.content.size,
        **fields,
    )
    asset.file.save(processed.content.name, processed.content, save=False)
    asset.save()
    return asset
