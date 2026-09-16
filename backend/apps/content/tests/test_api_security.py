"""
Security regression tests.

The previous attempt at this project shipped a public ModelViewSet whose
get_queryset blanked list/retrieve but left PUT, PATCH and DELETE reachable by
anyone. These tests are the memorial to that bug: they assert the write surface
does not exist, so it cannot come back unnoticed.
"""

import pytest

from apps.content.models import Category, Prophecy, Status

pytestmark = pytest.mark.django_db

# An anonymous write is refused either as 403 (permission checked first) or 405
# (no handler for the method). Both are refusals; which one you get depends on
# ordering inside DRF, so asserting a single code would make this test brittle
# without making it stricter.
REFUSED = {403, 405}


@pytest.fixture
def published():
    return Prophecy.objects.create(
        title="Quake coming to Kenya", slug="quake-kenya", status=Status.PUBLISHED
    )


@pytest.fixture
def draft():
    return Prophecy.objects.create(title="Unreviewed draft", slug="draft-item")


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_write_methods_are_refused_on_detail(client, published, method):
    response = getattr(client, method)(f"/api/v1/prophecies/{published.slug}/")
    assert response.status_code in REFUSED


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_write_methods_are_refused_on_list(client, method):
    response = getattr(client, method)("/api/v1/prophecies/")
    assert response.status_code in REFUSED


def test_drafts_are_not_listed(client, published, draft):
    body = client.get("/api/v1/prophecies/").json()
    slugs = {row["slug"] for row in body["results"]}
    assert published.slug in slugs
    assert draft.slug not in slugs


def test_draft_detail_is_not_reachable(client, draft):
    assert client.get(f"/api/v1/prophecies/{draft.slug}/").status_code == 404


def test_radio_status_is_200_even_when_upstream_is_unreachable(client):
    # Test settings point the station at a dead local port. Off air is a state
    # the player renders, never an error the client has to handle.
    response = client.get("/api/v1/radio/status/")
    assert response.status_code == 200
    assert response.json()["status"] in {"live", "offline", "unknown"}


def test_now_playing_is_never_a_bare_dash(client):
    # radio.co sends the literal string " - " when idle.
    assert client.get("/api/v1/radio/status/").json()["now_playing"] != " - "


def test_facets_exclude_their_own_filter(client):
    """Without this, one click traps the visitor with every other option at 0."""
    quake = Category.objects.create(name="Earthquake", slug="earthquake")
    vision = Category.objects.create(name="Vision", slug="vision")
    Prophecy.objects.create(
        title="A", slug="a", status=Status.PUBLISHED, category=quake
    )
    Prophecy.objects.create(
        title="B", slug="b", status=Status.PUBLISHED, category=vision
    )

    body = client.get("/api/v1/prophecies/?category=earthquake").json()
    assert body["count"] == 1
    values = {facet["value"] for facet in body["facets"]["category"]}
    assert "vision" in values, "the other category must stay reachable while filtered"


def test_list_payload_excludes_body(client, published):
    """Card payloads must not carry full transcripts; that is how an archive
    page ends up weighing megabytes."""
    row = client.get("/api/v1/prophecies/").json()["results"][0]
    assert "body" not in row
    assert "body" in client.get(f"/api/v1/prophecies/{published.slug}/").json()
