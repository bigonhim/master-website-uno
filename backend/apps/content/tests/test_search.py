import pytest

from apps.content.models import Category, Prophecy, Status

pytestmark = pytest.mark.django_db


@pytest.fixture
def archive():
    quake = Category.objects.create(name="Earthquake", slug="earthquake")
    Prophecy.objects.create(
        title="Quake coming to Kenya", slug="quake-kenya", status=Status.PUBLISHED,
        category=quake,
    )
    Prophecy.objects.create(
        title="A word for Brazil", slug="brazil", status=Status.PUBLISHED,
        summary="Floods in the south.",
    )
    Prophecy.objects.create(title="Kenya draft", slug="kenya-draft")


def slugs(client, q):
    body = client.get("/api/v1/prophecies/", {"q": q}).json()
    return {row["slug"] for row in body["results"]}


def test_search_matches_title_case_insensitively(client, archive):
    assert slugs(client, "kenya") == {"quake-kenya"}, "drafts must stay hidden"


def test_search_matches_summary_and_category(client, archive):
    assert slugs(client, "floods") == {"brazil"}
    assert slugs(client, "earthquake") == {"quake-kenya"}


def test_every_word_must_match(client, archive):
    assert slugs(client, "quake kenya") == {"quake-kenya"}
    assert slugs(client, "quake brazil") == set()


def test_facets_respect_the_search(client, archive):
    body = client.get("/api/v1/prophecies/", {"q": "brazil"}).json()
    assert body["facets"]["category"] == []
