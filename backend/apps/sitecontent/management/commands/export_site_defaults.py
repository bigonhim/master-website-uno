"""
Writes the site-text defaults to the frontend's fallback copy.

The frontend shows these words whenever the API cannot be reached, so they
must match sections.py exactly. Run this after changing a default there; a
test fails until you do.
"""

import json

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.sitecontent.sections import SECTIONS

TARGET = settings.BASE_DIR.parent / "frontend" / "lib" / "site" / "defaults.json"


def render_defaults() -> str:
    data = {key: section.default for key, section in SECTIONS.items()}
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


class Command(BaseCommand):
    help = "Write the site-text defaults to frontend/lib/site/defaults.json."

    def handle(self, *args, **options):
        TARGET.parent.mkdir(parents=True, exist_ok=True)
        TARGET.write_text(render_defaults(), encoding="utf-8", newline="\n")
        self.stdout.write(self.style.SUCCESS(f"Wrote {TARGET}"))
