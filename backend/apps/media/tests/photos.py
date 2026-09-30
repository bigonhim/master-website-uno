"""Photo files made on the fly for tests."""

from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def jpeg_bytes(size=(400, 200), colour="red", orientation=None, make=None) -> bytes:
    image = Image.new("RGB", size, colour)
    exif = Image.Exif()
    if orientation:
        exif[0x0112] = orientation
    if make:
        exif[0x010F] = make  # the camera maker: stands in for any metadata
    out = BytesIO()
    image.save(out, "JPEG", exif=exif.tobytes() if len(exif) else b"")
    return out.getvalue()


def webp_bytes(size=(300, 200), mode="RGB") -> bytes:
    out = BytesIO()
    Image.new(mode, size, (0, 128, 255, 128) if mode == "RGBA" else (0, 128, 255)).save(
        out, "WEBP", quality=92
    )
    return out.getvalue()


def png_bytes(size=(120, 80), mode="RGBA") -> bytes:
    out = BytesIO()
    Image.new(mode, size, (255, 0, 0, 100) if mode == "RGBA" else (255, 0, 0)).save(out, "PNG")
    return out.getvalue()


def upload(content: bytes, name="photo.jpg", content_type="image/jpeg") -> SimpleUploadedFile:
    return SimpleUploadedFile(name, content, content_type=content_type)
