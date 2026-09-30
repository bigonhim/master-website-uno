"""
Adding a YouTube video by pasting its link.

Staff paste whatever the share button gave them: a youtu.be link, a watch
link with a playlist and a timestamp, a Shorts link, or just the id. All of
them name one video, and only that id is kept.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

import httpx

from apps.content.models import Availability

VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
HOSTS = {"youtube.com", "youtube-nocookie.com"}


def parse_youtube_id(value: str) -> str | None:
    value = value.strip()
    if VIDEO_ID.match(value):
        return value
    url = urlparse(value if "://" in value else f"https://{value}")
    host = (url.hostname or "").lower()
    for prefix in ("www.", "m.", "music."):
        host = host.removeprefix(prefix)

    candidate = ""
    if host == "youtu.be":
        candidate = url.path.strip("/").split("/")[0]
    elif host in HOSTS:
        parts = url.path.strip("/").split("/")
        if parts[0] == "watch":
            candidate = parse_qs(url.query).get("v", [""])[0]
        elif len(parts) > 1 and parts[0] in {"embed", "shorts", "live", "v"}:
            candidate = parts[1]
    return candidate if VIDEO_ID.match(candidate) else None


def probe(youtube_id: str) -> tuple[str, str]:
    """(availability, title) from YouTube's public oEmbed endpoint.

    No API key: oEmbed answers for any public video and refuses a deleted one.
    A private video, or one whose owner turned embedding off, is refused too
    but still exists, so that reads as "not checked" and staff decide. Any
    network trouble reads the same way; it is never taken for a deletion.
    """
    try:
        response = httpx.get(
            "https://www.youtube.com/oembed",
            params={"url": f"https://www.youtube.com/watch?v={youtube_id}", "format": "json"},
            timeout=6.0,
        )
    except httpx.HTTPError:
        return Availability.UNKNOWN, ""
    if response.status_code == 200:
        try:
            title = str(response.json().get("title", ""))[:300]
        except ValueError:
            title = ""
        return Availability.AVAILABLE, title
    if response.status_code in (400, 404):
        return Availability.UNAVAILABLE, ""
    return Availability.UNKNOWN, ""
