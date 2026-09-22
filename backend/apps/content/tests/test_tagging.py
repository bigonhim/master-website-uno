"""
Title tagging tests. Pure functions — no database.
"""

from apps.content.management.commands.tag_from_titles import nations_in, theme_for

NAMES = ["Kenya", "Namibia", "Sudan", "South Sudan", "Israel"]


def test_finds_a_nation_named_in_the_title():
    title = "Message of the LORD to Kenya After the Week-long National Repentance"
    assert nations_in(title, NAMES) == ["Kenya"]


def test_matches_regardless_of_case():
    assert nations_in("EARTHQUAKE COMING TO NAMIBIA", NAMES) == ["Namibia"]


def test_longer_name_is_not_double_counted():
    assert nations_in("Floods coming to South Sudan", NAMES) == ["South Sudan"]


def test_ignores_partial_words():
    # "Kenyan" is a demonym, not a mention of the nation's name.
    assert nations_in("A Kenyan brother testifies", NAMES) == []


def test_several_nations_keep_gazetteer_order():
    assert nations_in("Warning to Israel and Kenya", NAMES) == ["Kenya", "Israel"]


def test_repentance_and_holiness_titles_get_the_repentance_theme():
    assert theme_for("Calls for National Repentance") == "repentance"
    assert theme_for("The Highway of Holiness: Warning to the Church") == "repentance"


def test_no_theme_when_the_title_does_not_name_one():
    assert theme_for("Mighty Prophecy of the Imminent Rapture") is None
