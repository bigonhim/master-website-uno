"""
Parser tests.

The parser is the one component where a silent regression corrupts the whole
archive: a title that loses its last fragment still looks like a title. These
run against inline fixtures — no network, no snapshot, no database.
"""

from apps.content.legacy.parser import (
    NAV_VIDEO_IDS,
    classify,
    find_orphan_ids,
    normalise_title,
    parse_homepage,
    smart_title,
)


def caption(text: str, video_id: str | None = None) -> str:
    """Reproduce WebAcappella's markup: one div per rendered LINE."""
    if video_id is None:
        return f'<div align="left"><span>{text}</span></div>'
    return (
        f'<div align="left"><a href="https://www.youtube.com/watch?v={video_id}">'
        f"<span>{text}</span></a></div>"
    )


class TestFragmentJoining:
    def test_consecutive_divs_sharing_an_href_become_one_title(self):
        markup = (
            caption("THE LORD JEHOVAH COMMANDS ALL", "w4t-InD7wJM")
            + caption("NATIONS TO MOVE THEIR EMBASSIES", "w4t-InD7wJM")
            + caption("TO RECOGNIZE JERUSALEM", "w4t-InD7wJM")
        )
        items = parse_homepage(markup)
        assert len(items) == 1
        assert "EMBASSIES" in items[0].title_source.upper()
        assert "JERUSALEM" in items[0].title_source.upper()

    def test_a_caption_without_a_link_breaks_the_run(self):
        markup = (
            caption("FIRST PROPHECY", "aaaaaaaaaaa")
            + caption("an unrelated heading")
            + caption("SECOND PROPHECY", "bbbbbbbbbbb")
        )
        assert len(parse_homepage(markup)) == 2

    def test_different_videos_are_never_merged(self):
        markup = caption("ONE", "aaaaaaaaaaa") + caption("TWO", "bbbbbbbbbbb")
        items = parse_homepage(markup)
        assert [i.video_ids[0] for i in items] == ["aaaaaaaaaaa", "bbbbbbbbbbb"]

    def test_a_new_ordinal_starts_a_new_entry_on_the_same_video(self):
        """The source genuinely reuses one video for two numbered events."""
        markup = caption("15) Magnitude 6.8 Quake Hits India", "BJZycjCX7Ms") + caption(
            "16) Massive Floods Lash Iran", "BJZycjCX7Ms"
        )
        items = parse_homepage(markup)
        assert len(items) == 2, "numbered restart must not be concatenated"

    def test_translations_menu_videos_are_not_content(self):
        nav_id = sorted(NAV_VIDEO_IDS)[0]
        markup = caption("Hindi", nav_id) + caption("A REAL PROPHECY", "aaaaaaaaaaa")
        items = parse_homepage(markup)
        assert len(items) == 1
        assert items[0].video_ids == ["aaaaaaaaaaa"]


class TestTitleNormalisation:
    def test_divine_names_keep_their_capitals(self):
        assert "LORD" in smart_title("THE LORD SPOKE TO HIS SERVANT")
        assert "GOD" in smart_title("THE GLORY OF GOD DESCENDED")
        assert "JEHOVAH" in smart_title("JEHOVAH COMMANDS THE NATIONS")

    def test_ordinary_words_are_case_folded(self):
        assert smart_title("A VERY VIOLENT EARTHQUAKE") == "A Very Violent Earthquake"

    def test_slashed_acronyms_survive(self):
        assert smart_title("HIV/AIDS HEALED") == "HIV/AIDS Healed"

    def test_mixed_case_titles_are_left_alone(self):
        original = "Chile Earthquake Prophecy Fulfilled"
        assert smart_title(original) == original

    def test_click_to_watch_is_stripped(self):
        title, *_ = normalise_title("A MIGHTY VISION - Click to watch")
        assert "click" not in title.lower()

    def test_ordinal_is_lifted_out_of_the_title(self):
        title, _, _, ordinal = normalise_title("14) CARIBBEAN FLOODS")
        assert ordinal == 14
        assert not title.startswith("14")

    def test_kicker_is_lifted_out_of_the_title(self):
        title, kicker, _, _ = normalise_title("BREAKING NEWS: THE CLOUD OF GOD")
        assert kicker.lower() == "breaking news"
        assert "BREAKING" not in title.upper()

    def test_speaker_suffix_is_separated(self):
        title, _, speaker, _ = normalise_title("HEALING SERVICE - PROPHET DR. OWUOR")
        assert "Owuor" in speaker
        assert "OWUOR" not in title.upper()

    def test_file_extensions_are_dropped(self):
        title, *_ = normalise_title("Chile Earthquake Prophecy.mp4")
        assert not title.lower().endswith(".mp4")


class TestClassification:
    def test_healing_testimony_is_detected(self):
        kind, _, confidence = classify("Blind Eyes Opened in Nakuru")
        assert kind == "healing"
        assert confidence >= 0.7

    def test_an_announced_healing_service_is_not_a_testimony(self):
        """'Astronomical healing anointing COMING TO the global healing service'
        is an event announcement. A naive keyword match files it as a healing."""
        kind, _, _ = classify(
            "Astronomical Healing Anointing Coming to the Global Service"
        )
        assert kind != "healing"

    def test_disaster_words_classify_as_judgement(self):
        kind, sub, _ = classify("A Very Violent Earthquake Coming to Strike the Earth")
        assert (kind, sub) == ("prophecy", "judgement")

    def test_unmatched_titles_get_zero_confidence_for_review(self):
        _, _, confidence = classify("Something entirely unremarkable")
        assert confidence == 0.0, "an unrecognised title must not look confident"


class TestOrphans:
    def test_ids_linked_from_images_are_reported_not_swallowed(self):
        markup = (
            caption("A CAPTIONED ITEM", "aaaaaaaaaaa")
            + '<img src="x.png"><a href="https://www.youtube.com/watch?v=ccccccccccc"></a>'
        )
        items = parse_homepage(markup)
        claimed = {v for i in items for v in i.video_ids}
        assert find_orphan_ids(markup, claimed) == ["ccccccccccc"]
