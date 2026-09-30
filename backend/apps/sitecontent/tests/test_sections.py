import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.sitecontent.management.commands.export_site_defaults import TARGET, render_defaults
from apps.sitecontent.models import Gallery, HeroSlide, SiteSection
from apps.sitecontent.sections import SECTIONS, SECTIONS_LIST, clean_section, merged


@pytest.mark.parametrize("section", SECTIONS_LIST, ids=lambda s: s.key)
def test_every_default_passes_its_own_rules(section):
    # Otherwise an editor opening an untouched section could not save it.
    cleaned, errors = clean_section(section, section.default)
    assert errors == {}
    assert cleaned == section.default


def test_frontend_fallback_matches_the_defaults():
    """The site shows frontend/lib/site/defaults.json when the API is down.
    If this fails, run `python manage.py export_site_defaults`."""
    assert TARGET.read_text(encoding="utf-8") == render_defaults()


def test_text_is_tidied_but_a_non_breaking_space_is_kept():
    section = SECTIONS["home_hero"]
    data = {**section.default, "line_1": "  Prepare \n  ye ", "eyebrow": "Psalm 118"}
    cleaned, errors = clean_section(section, data)
    assert errors == {}
    assert cleaned["line_1"] == "Prepare ye"
    assert cleaned["eyebrow"] == "Psalm 118"


def test_paragraph_breaks_survive_but_not_runs_of_blank_lines():
    section = SECTIONS["about_pillars"]
    data = {**section.default, "who_body": "One.\r\n\r\n\r\n\r\nTwo."}
    cleaned, _ = clean_section(section, data)
    assert cleaned["who_body"] == "One.\n\nTwo."


def test_unknown_fields_are_dropped():
    section = SECTIONS["home_radio"]
    cleaned, errors = clean_section(section, {**section.default, "script": "<script>"})
    assert "script" not in cleaned and errors == {}


def test_limits_and_formats():
    section = SECTIONS["contact"]
    cleaned, errors = clean_section(
        section,
        {**section.default, "place": "x" * 121, "phone_2": "", "whatsapp": "12345"},
    )
    assert "place" in errors
    assert "whatsapp" in errors  # too few digits for a phone number
    assert "phone_2" not in errors  # optional
    assert cleaned["phone_2"] == ""


def test_card_fields_are_checked_one_by_one():
    section = SECTIONS["home_message"]
    pillars = [dict(p) for p in section.default["pillars"]]
    pillars[1]["title"] = ""
    _, errors = clean_section(section, {**section.default, "pillars": pillars})
    assert list(errors) == ["pillars.1.title"]


def test_a_field_added_later_falls_back_to_its_default():
    section = SECTIONS["home_radio"]
    stored = {k: v for k, v in section.default.items() if k != "button"}
    assert merged(section, stored)["button"] == section.default["button"]


# -------------------------------------------------------------- public API


@pytest.mark.django_db
def test_site_payload_with_nothing_edited():
    body = APIClient().get("/api/v1/site/").json()
    assert body["hero_slides"] == []
    assert body["gallery"] is None
    assert body["sections"] == {key: s.default for key, s in SECTIONS.items()}


@pytest.mark.django_db
def test_the_site_endpoint_is_read_only():
    client = APIClient()
    assert client.post("/api/v1/site/", {}).status_code in {403, 405}
    assert client.get("/api/v1/site/")["Cache-Control"].startswith("public")


@pytest.mark.django_db
def test_seeding_moves_the_built_in_photos_into_the_studio():
    call_command("seed_site_content", verbosity=0)
    assert HeroSlide.objects.count() == 6
    gallery = Gallery.objects.get()
    assert gallery.is_featured and gallery.photos.count() == 5
    assert gallery.heading == "The Prophet of THE LORD, **honoured**"

    body = APIClient().get("/api/v1/site/").json()
    first = body["hero_slides"][0]
    assert first["place"] == "Nakuru" and first["detail"] == "Kenya"
    assert first["frame"] == {"x": 0.5, "y": 0.3}
    assert first["alt"].startswith("Aerial view")
    assert first["width"] > 0
    assert body["gallery"]["photos"][0]["focus"] == "60% 50%"

    # Running it again changes nothing.
    call_command("seed_site_content", verbosity=0)
    assert HeroSlide.objects.count() == 6
    assert Gallery.objects.count() == 1
    assert not SiteSection.objects.exists()
