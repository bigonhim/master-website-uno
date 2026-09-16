from django.db import models

from apps.core.models import TimeStamped


class RadioStation(TimeStamped):
    """Jesus is LORD Radio.

    The stream URL lives here rather than in frontend code. The previous
    attempt hardcoded it in three files and two of them disagreed, so the
    footer and the navbar pointed at different stations.
    """

    name = models.CharField(max_length=120, default="Jesus is LORD Radio")
    station_id = models.CharField(max_length=40, default="s97f38db97")
    stream_url = models.URLField(default="https://s3.radio.co/s97f38db97/listen")
    status_url = models.URLField(
        default="https://public.radio.co/stations/s97f38db97/status"
    )
    is_enabled = models.BooleanField(default=True)
    offline_message = models.CharField(
        max_length=200,
        default="We're off air right now — browse the teaching archive meanwhile.",
        help_text="Shown in the player bar when the station is not broadcasting.",
    )
    schedule_note = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional, e.g. "Next broadcast: Sunday 09:00 EAT".',
    )
    is_primary = models.BooleanField(
        default=True,
        help_text="The station the site plays. Only one should be primary.",
    )

    class Meta:
        ordering = ["-is_primary", "name"]

    def __str__(self) -> str:
        return self.name


class RadioStatusSnapshot(TimeStamped):
    """Last known upstream state.

    Kept so the bar can fall back to something truthful when radio.co is
    unreachable, rather than guessing "live" or rendering an error.
    """

    station = models.ForeignKey(
        RadioStation, on_delete=models.CASCADE, related_name="snapshots"
    )
    status = models.CharField(max_length=12, default="unknown")
    now_playing_title = models.CharField(max_length=300, blank=True)
    artwork_url = models.URLField(blank=True)
    fetched_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-fetched_at"]

    def __str__(self) -> str:
        return f"{self.station} · {self.status} · {self.fetched_at:%Y-%m-%d %H:%M}"
