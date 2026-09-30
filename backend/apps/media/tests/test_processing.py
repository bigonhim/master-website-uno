"""
The upload pipeline. What it guarantees: whatever comes in, what is stored is
an upright, web-sized WebP carrying no camera metadata, and anything that is
not a JPEG, PNG or WebP photo is refused.
"""

from io import BytesIO

import pytest
from PIL import Image

from apps.media import processing
from apps.media.processing import RejectedUpload, process_upload

from .photos import jpeg_bytes, png_bytes, upload, webp_bytes


def decoded(processed) -> Image.Image:
    image = Image.open(BytesIO(processed.content.read()))
    processed.content.seek(0)
    return image


def test_jpeg_becomes_webp_without_metadata():
    processed = process_upload(upload(jpeg_bytes(make="Acme Camera")))
    image = decoded(processed)
    assert image.format == "WEBP"
    assert not image.getexif()
    assert "exif" not in image.info
    assert processed.content.name.endswith(".webp")


def test_sideways_phone_photo_is_turned_upright():
    # Orientation 6: the camera held on its side; pixels are 400x200, the
    # photo as seen is 200x400.
    processed = process_upload(upload(jpeg_bytes(size=(400, 200), orientation=6)))
    assert (processed.width, processed.height) == (200, 400)
    assert decoded(processed).size == (200, 400)


def test_large_photo_is_scaled_to_the_long_edge_limit():
    processed = process_upload(upload(jpeg_bytes(size=(3000, 1500))))
    assert (processed.width, processed.height) == (2560, 1280)


def test_web_ready_webp_is_kept_byte_for_byte():
    raw = webp_bytes()
    processed = process_upload(upload(raw, "ready.webp", "image/webp"))
    assert processed.content.read() == raw


def test_transparency_survives():
    processed = process_upload(upload(png_bytes(), "logo.png", "image/png"))
    assert decoded(processed).mode == "RGBA"


def test_title_comes_from_the_file_name():
    processed = process_upload(upload(jpeg_bytes(), "nakuru_crowd-flags.jpg"))
    assert processed.title == "Nakuru crowd flags"
    assert processed.original_filename == "nakuru_crowd-flags.jpg"


def test_same_photo_gets_the_same_checksum():
    raw = jpeg_bytes()
    assert process_upload(upload(raw)).checksum == process_upload(upload(raw)).checksum


@pytest.mark.parametrize(
    "content,name",
    [
        (b"<?php echo 'hi'; ?>", "shell.jpg"),
        (b"", "empty.jpg"),
        (b"GIF89a" + b"\x00" * 20, "anim.gif"),
    ],
)
def test_non_photos_are_refused(content, name):
    with pytest.raises(RejectedUpload):
        process_upload(upload(content, name))


def test_gif_is_refused_even_when_valid():
    out = BytesIO()
    Image.new("RGB", (10, 10)).save(out, "GIF")
    with pytest.raises(RejectedUpload, match="JPEG, PNG or WebP"):
        process_upload(upload(out.getvalue(), "real.gif", "image/gif"))


def test_decompression_bomb_is_refused(monkeypatch):
    monkeypatch.setattr(processing, "MAX_PIXELS", 100)
    with pytest.raises(RejectedUpload, match="too large"):
        process_upload(upload(jpeg_bytes(size=(20, 20))))


def test_oversized_file_is_refused(monkeypatch):
    monkeypatch.setattr(processing, "MAX_UPLOAD_BYTES", 10)
    with pytest.raises(RejectedUpload, match="larger than"):
        process_upload(upload(jpeg_bytes()))


GPS_XMP = (
    b'<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    b'<rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="1,17.0N"/>'
    b"</rdf:RDF></x:xmpmeta>"
)


def test_a_webp_carrying_xmp_location_is_re_encoded_without_it():
    out = BytesIO()
    Image.new("RGB", (300, 200), (0, 128, 255)).save(out, "WEBP", quality=92, xmp=GPS_XMP)
    raw = out.getvalue()
    assert b"GPSLatitude" in raw  # the test file really carries it
    stored = process_upload(upload(raw, "phone.webp", "image/webp")).content.read()
    assert stored != raw
    assert b"GPSLatitude" not in stored
    assert b"XMP " not in stored


def test_a_webp_with_bytes_after_it_is_re_encoded():
    raw = webp_bytes() + b"<?php hidden ?>"
    stored = process_upload(upload(raw, "tail.webp", "image/webp")).content.read()
    assert b"php" not in stored


def test_clean_webp_detection():
    from apps.media.processing import is_clean_webp

    assert is_clean_webp(webp_bytes())
    assert not is_clean_webp(webp_bytes() + b"x")
    assert not is_clean_webp(b"RIFF\x00\x00\x00\x00WEBP")
    assert not is_clean_webp(jpeg_bytes())
