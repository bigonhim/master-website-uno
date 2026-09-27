"""
The fulfilment importer.

What it must not do matters as much as what it does: it must not publish
unasked, must not import what nobody can watch, must not mistake the day of a
fulfilment for the day of the prophecy, and must not write over staff's work.
"""

import json
from datetime import date

import pytest
from django.core.management import call_command

from apps.content.youtube_import import (
    clean_title,
    group_key,
    prophecy_date_in,
)
from apps.content.models import ContentItem, DateSource, Kind, Status, Video
from apps.content.youtube_import import date_in

pytestmark = pytest.mark.django_db


def video(youtube_id, title, **extra):
    return {
        "youtube_id": youtube_id,
        "title": title,
        "upload_date": "20150426",
        "duration": 600,
        "availability": "public",
        "playable_in_embed": True,
        "harvested_at": "2026-09-27T20:00:00+00:00",
        **extra,
    }


@pytest.fixture
def harvest(tmp_path):
    def write(*videos):
        path = tmp_path / "fulfilled.json"
        path.write_text(json.dumps({"videos": list(videos)}), encoding="utf-8")
        return str(path)

    return write


def run(path, **options):
    call_command("import_fulfilled", file=path, **options)


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        (
            "THE BLACK HORSE RELEASED: AUGUST 23, 2008 PROPHECY FULFILLED",
            date(2008, 8, 23),
        ),
        (
            "HISTORIC FLOODS HIT ISRAEL: May 7, 2014 Prophecy Rapidly Fulfilled",
            date(2014, 5, 7),
        ),
        ("HISTORIC FLOODS: SEPT 6 2017 PROPHECY FULFILLED", date(2017, 9, 6)),
        # The day it came to pass is not the day it was given.
        ("HORRIFIC NEPAL EARTHQUAKE: FULFILLED ON APRIL 25, 2015", None),
        ("PERU EARTHQUAKE 2019: ITS PROPHECY & SHOCKING FULFILMENT", None),
        ("FEBRUARY 31, 2015 PROPHECY FULFILLED", None),
    ],
)
def test_only_a_date_before_the_word_prophecy_is_the_prophecy_date(title, expected):
    assert prophecy_date_in(title) == expected


@pytest.mark.parametrize(
    ("raw", "title"),
    [
        (
            "MASSIVE RAGING FIRES SWEEP ACROSS ISRAEL: PROPHECY FULFILLED (UPDATED) - PROPHET DR. OWUOR",
            "Massive Raging Fires Sweep Across Israel: Prophecy Fulfilled",
        ),
        (
            "Prophecy of Earthquake Coming to Chile Accurately Fulfilled   Dr  Owuor",
            "Prophecy of Earthquake Coming to Chile Accurately Fulfilled",
        ),
        (
            "TONGA TSUNAMI 2022: IT'S SHOCKING PROPHECY & FULFILMENT  | PROPHET DR.OWUOR",
            "Tonga Tsunami 2022: It's Shocking Prophecy & Fulfilment",
        ),
        (
            "Prophecy Of Planetary Event Fulfilled - Dr. Owuor. mov",
            "Prophecy Of Planetary Event Fulfilled",
        ),
        (
            "Philippines Earthquake Prophecy Fulfilled.mp4",
            "Philippines Earthquake Prophecy Fulfilled",
        ),
    ],
)
def test_the_speaker_and_file_type_are_tidied_off_the_title(raw, title):
    assert clean_title(raw)[0] == title


def test_a_tidied_speaker_is_still_recorded():
    assert clean_title("Lunar Eclipse Prophecy Accurately Fulfilled - Dr. Owuor")[
        1
    ] == ("Prophet Dr. Owuor")
    assert clean_title("MEXICO EARTHQUAKE PROPHECY FULFILLED 2017")[1] == ""


def test_abbreviations_keep_their_capitals():
    title = clean_title(
        "BIGGEST QUAKE IN 25 YEARS SHAKES CALIFORNIA, U.S.A - PROPHECY FULFILLED"
    )[0]
    assert "U.S.A" in title


def test_the_theme_is_what_was_prophesied(harvest):
    call_command("seed_taxonomy")
    run(
        harvest(
            video(
                "aaaaaaaaaaa",
                "A HUGE EARTHQUAKE VIOLENTLY ROCKS ITALY: PROPHECY FULFILLED",
            )
        )
    )
    # The archive's own classifier files earthquakes under judgement. Without
    # the fulfilment words removed it would find no theme at all.
    assert ContentItem.objects.get().category.slug == "judgement"


def test_reuploads_of_one_film_share_a_key():
    a = group_key("Prophecy of Floods Coming to Malta Accurately Fulfilled - Dr. Owuor")
    b = group_key(
        "Prophecy of Floods Coming to Malta  Accurately Fulfilled   Dr  Owuor".replace(
            "   Dr  Owuor", " - Dr. Owuor"
        )
    )
    assert a == b
    assert a != group_key("Prophecy of Floods Coming to Austria Stunningly Fulfilled")
    assert group_key(
        "FIRES SWEEP ISRAEL: PROPHECY FULFILLED (UPDATED) - PROPHET DR. OWUOR"
    ) == (group_key("FIRES SWEEP ISRAEL: PROPHECY FULFILLED - PROPHET DR. OWUOR"))


def test_rows_land_as_drafts_unless_told_to_publish(harvest):
    run(harvest(video("aaaaaaaaaaa", "MEXICO EARTHQUAKE PROPHECY FULFILLED 2017")))
    item = ContentItem.objects.get()
    assert item.status == Status.DRAFT
    assert item.kind == Kind.PROPHECY
    assert item.is_fulfilled


def test_publish_is_an_explicit_choice(harvest):
    run(
        harvest(video("aaaaaaaaaaa", "MEXICO EARTHQUAKE PROPHECY FULFILLED 2017")),
        publish=True,
    )
    assert ContentItem.objects.get().status == Status.PUBLISHED


def test_what_nobody_can_watch_is_not_imported(harvest):
    run(
        harvest(
            video("aaaaaaaaaaa", "PRIVATE PROPHECY FULFILLED", availability="private"),
            video(
                "bbbbbbbbbbb", "NO EMBED PROPHECY FULFILLED", playable_in_embed=False
            ),
            video("ccccccccccc", None),
            video("ddddddddddd", "WATCHABLE PROPHECY FULFILLED"),
        ),
        publish=True,
    )
    assert [v.youtube_id for v in Video.objects.all()] == ["ddddddddddd"]
    assert ContentItem.objects.count() == 1


def test_no_account_of_the_fulfilment_is_invented(harvest):
    run(harvest(video("aaaaaaaaaaa", "MEXICO EARTHQUAKE PROPHECY FULFILLED 2017")))
    assert ContentItem.objects.get().fulfillment_summary == ""


def test_the_ministrys_title_is_kept_verbatim_beside_the_display_title(harvest):
    raw = "HISTORIC FLOODS HIT KENYA: MARCH 13, 2015 PROPHECY FULFILLED - PROPHET DR. OWUOR"
    run(harvest(video("aaaaaaaaaaa", raw)))
    item = ContentItem.objects.get()
    assert item.title_source == raw
    assert item.title_yt == raw
    assert item.speaker == "Prophet Dr. Owuor"
    assert "OWUOR" not in item.title.upper()
    assert item.prophecy_date == date(2015, 3, 13)
    assert item.date_source == DateSource.TITLE_PARSED


def test_uploads_with_one_title_become_one_entry_with_several_videos(harvest):
    title = "Prophecy of Valencia, Venezuela EARTHQUAKE Shockingly Fulfilled"
    run(
        harvest(
            video("bbbbbbbbbbb", title, upload_date="20120103"),
            video("aaaaaaaaaaa", title, upload_date="20120101"),
            video("ccccccccccc", title, upload_date="20120102"),
        )
    )
    item = ContentItem.objects.get()
    attached = list(item.videos.order_by("order"))
    assert [a.video.youtube_id for a in attached] == [
        "aaaaaaaaaaa",
        "ccccccccccc",
        "bbbbbbbbbbb",
    ]
    assert [a.is_primary for a in attached] == [True, False, False]
    assert attached[0].label == "Video 1"


def test_running_twice_changes_nothing_and_spares_staff_edits(harvest):
    path = harvest(video("aaaaaaaaaaa", "MEXICO EARTHQUAKE PROPHECY FULFILLED 2017"))
    run(path)
    item = ContentItem.objects.get()
    item.title = "Edited by staff"
    item.fulfillment_summary = "Written by staff."
    item.save()

    run(path, publish=True)

    item.refresh_from_db()
    assert ContentItem.objects.count() == 1
    assert Video.objects.count() == 1
    assert item.title == "Edited by staff"
    assert item.fulfillment_summary == "Written by staff."
    assert item.status == Status.DRAFT


def test_a_dry_run_writes_nothing(harvest):
    run(
        harvest(video("aaaaaaaaaaa", "MEXICO EARTHQUAKE PROPHECY FULFILLED 2017")),
        dry_run=True,
    )
    assert not ContentItem.objects.exists()
    assert not Video.objects.exists()


# ------------------------------------------------------------------ teachings


@pytest.mark.parametrize(
    ("raw", "title", "given"),
    [
        (
            "Special Teaching: The Enormity of the Day of the Rapture | September 9,  2026",
            "Special Teaching: The Enormity of the Day of the Rapture",
            date(2026, 9, 9),
        ),
        (
            "The Rapture Generation - Prophet Dr. David Owuor Teachings",
            "The Rapture Generation",
            None,
        ),
        (
            "Ignorance in the Church - Prophet Dr  David Owuor Teachings .",
            "Ignorance in the Church",
            None,
        ),
        (
            "SPECIAL TEACHING ON THE ROLE OF THE HOLY SPIRIT | PROPHET DR.OWUOR | JUNE 23, 2019",
            # HOLY SPIRIT keeps its capitals: the archive's protected words.
            "Special Teaching on the Role of the HOLY SPIRIT",
            date(2019, 6, 23),
        ),
    ],
)
def test_a_teachings_title_is_tidied_and_its_date_read(raw, title, given):
    assert clean_title(raw)[0] == title
    assert date_in(raw) == given


def test_teachings_are_imported_as_teachings(harvest):
    call_command("seed_taxonomy")
    call_command(
        "import_teachings",
        file=harvest(
            video(
                "aaaaaaaaaaa",
                "Special Teaching: The Enormity of the Day of the Rapture | September 9,  2026",
            )
        ),
        publish=True,
    )
    item = ContentItem.objects.get()
    assert item.kind == Kind.TEACHING
    assert item.status == Status.PUBLISHED
    assert not item.is_fulfilled
    assert item.prophecy_date == date(2026, 9, 9)
    # The classifier's themes are for prophecies; it is not asked.
    assert item.category is None


def test_a_teaching_and_a_prophecy_with_one_title_stay_separate(harvest):
    path = harvest(video("aaaaaaaaaaa", "THE RESTORATION OF THE PULPIT"))
    call_command("import_teachings", file=path)
    call_command("import_fulfilled", file=path)
    assert ContentItem.objects.count() == 2
    assert Video.objects.count() == 1
