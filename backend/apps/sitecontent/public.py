"""
The site content the public site reads, in the shapes its components take.

Hero slides and gallery photos are emitted exactly as frontend/lib/hero-slides.ts
and frontend/lib/recognition.ts declare them, so the site swaps its built-in
photos for the Studio's without translating anything.
"""

from .models import Gallery, HeroSlide, SiteSection
from .sections import SECTIONS, merged


def hero_slide_payload(slide: HeroSlide) -> dict:
    image = slide.image
    return {
        "id": slide.pk,
        "src": image.url,
        "width": image.width,
        "height": image.height,
        "alt": slide.alt_text or image.alt_text or image.title,
        "place": slide.place,
        **({"detail": slide.detail} if slide.detail else {}),
        "event": slide.event,
        "frame": {"x": slide.frame_x, "y": slide.frame_y},
        "frameLg": {"x": slide.frame_lg_x, "y": slide.frame_lg_y},
    }


def gallery_payload(gallery: Gallery) -> dict:
    return {
        "id": gallery.pk,
        "eyebrow": gallery.eyebrow,
        "heading": gallery.heading,
        "place": {"name": gallery.place_name, "detail": gallery.place_detail},
        "summary": gallery.summary,
        "photos": [
            {
                "src": photo.image.url,
                "width": photo.image.width,
                "height": photo.image.height,
                "alt": photo.alt_text or photo.image.alt_text or photo.title,
                "title": photo.title,
                "caption": photo.caption,
                "focus": photo.image.object_position,
            }
            for photo in gallery.photos.all()
        ],
    }


def site_payload() -> dict:
    stored = {row.key: row.data for row in SiteSection.objects.all()}
    slides = HeroSlide.objects.filter(is_active=True).select_related("image")
    gallery = (
        Gallery.objects.filter(is_featured=True)
        .prefetch_related("photos__image")
        .first()
    )
    return {
        "sections": {key: merged(s, stored.get(key)) for key, s in SECTIONS.items()},
        "hero_slides": [hero_slide_payload(s) for s in slides],
        # A featured gallery with no photos would be an empty band; the site
        # shows its built-in one instead.
        "gallery": gallery_payload(gallery) if gallery and gallery.photos.exists() else None,
    }
