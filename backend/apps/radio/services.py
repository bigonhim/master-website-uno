"""
Radio status.

The station has been off air since March 2023, so "offline" is the normal
case, not an error. Three consequences shape this module:

  * the endpoint always returns a payload and never raises upward — off air is
    a state to render, not a failure to handle;
  * a circuit breaker stops us generating perpetual failing traffic against a
    station that may never come back;
  * radio.co reports `current_track.title` as the literal string " - " when
    nothing is playing, which must become null or the UI renders a stray dash.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

CACHE_KEY = "radio:status"
BREAKER_KEY = "radio:breaker"
CACHE_SECONDS = 20
BREAKER_SECONDS = 300
TIMEOUT_SECONDS = 3.0

# radio.co's placeholders for "nothing is playing".
BLANK_TRACKS = {"", "-", "--", "unknown", "n/a"}


def _clean_track(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip()
    return None if cleaned.strip(" -").lower() in BLANK_TRACKS else cleaned


def _payload(
    station, *, status: str, now_playing=None, artwork=None, stale=False
) -> dict[str, Any]:
    return {
        "status": status,  # live | offline | unknown
        "station_name": station.name,
        "stream_url": station.stream_url,
        "now_playing": now_playing,
        "artwork_url": artwork,
        "offline_message": station.offline_message,
        "schedule_note": station.schedule_note,
        "stale": stale,
        "checked_at": timezone.now().isoformat(),
    }


def _last_snapshot(station) -> dict[str, Any]:
    snapshot = station.snapshots.first()
    if not snapshot:
        return _payload(station, status="unknown", stale=True)
    return _payload(
        station,
        status=snapshot.status,
        now_playing=_clean_track(snapshot.now_playing_title),
        artwork=snapshot.artwork_url or None,
        stale=True,
    )


def get_radio_status(station) -> dict[str, Any]:
    """Return the current status. Never raises; always renderable."""
    if not station.is_enabled:
        return _payload(station, status="offline")

    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

    # Breaker open: the station is known-unreachable, so serve last-known
    # state rather than making every visitor wait on a 3-second timeout.
    if cache.get(BREAKER_KEY):
        return _last_snapshot(station)

    try:
        response = httpx.get(station.status_url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # noqa: BLE001 - any upstream failure is the same to us
        logger.warning("Radio status fetch failed: %s", exc)
        cache.set(BREAKER_KEY, 1, BREAKER_SECONDS)
        return _last_snapshot(station)

    track = data.get("current_track") or {}
    payload = _payload(
        station,
        status="live" if data.get("status") == "online" else "offline",
        now_playing=_clean_track(track.get("title")),
        artwork=track.get("artwork_url") or None,
    )

    cache.set(CACHE_KEY, payload, CACHE_SECONDS)

    from .models import RadioStatusSnapshot

    RadioStatusSnapshot.objects.create(
        station=station,
        status=payload["status"],
        now_playing_title=payload["now_playing"] or "",
        artwork_url=payload["artwork_url"] or "",
    )
    return payload


def get_primary_station():
    """The station the site plays, created on first use so a fresh install works."""
    from .models import RadioStation

    station = (
        RadioStation.objects.filter(is_enabled=True).order_by("-is_primary").first()
    )
    if station is None:
        station = RadioStation.objects.create()
    return station
