from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.content.models import (
    Availability,
    Category,
    ContentItem,
    DateSource,
    Kind,
    Status,
    Video,
)

from .conftest import save

pytestmark = pytest.mark.django_db

URL = "/api/v1/studio/items/"


def new_item(api, **fields):
    payload = {"kind": "prophecy", "title": "Earthquake coming to Kenya", **fields}
    response = api.post(URL, payload, format="json")
    assert response.status_code == 201, response.content
    return response.json()


def test_new_items_start_as_drafts_with_a_web_address(api):
    body = new_item(api)
    assert (body["status"], body["state"]) == ("draft", "draft")
    assert body["slug"] == "earthquake-coming-to-kenya"
    assert body["public_path"] == "/prophecies/earthquake-coming-to-kenya"
    # Titles repeat; web addresses must not.
    assert new_item(api)["slug"] == "earthquake-coming-to-kenya-2"


def test_status_cannot_be_written_directly(api):
    body = new_item(api, status="published")
    assert body["status"] == "draft"


def test_a_typed_date_is_recorded_as_entered_by_staff(api):
    body = new_item(api, prophecy_date="2015-04-26")
    item = ContentItem.objects.get(pk=body["id"])
    assert item.date_source == DateSource.MANUAL
    assert item.date_precision == "day"


def test_editing_keeps_every_field_and_videos_in_order(api):
    body = new_item(api)
    a = Video.objects.create(youtube_id="aaaaaaaaaaa", availability=Availability.AVAILABLE)
    b = Video.objects.create(youtube_id="bbbbbbbbbbb", availability=Availability.AVAILABLE)
    category = Category.objects.create(name="Earthquake", slug="earthquake")
    payload = {
        **body,
        "summary": "A summary",
        "category": category.pk,
        "videos": [{"video": b.pk, "label": "Part 1"}, {"video": a.pk, "label": "Part 2"}],
    }
    response = api.put(f"{URL}{body['id']}/", payload, format="json", HTTP_IF_MATCH=body["version"])
    assert response.status_code == 200, response.content
    saved = response.json()
    assert [v["youtube_id"] for v in saved["videos"]] == ["bbbbbbbbbbb", "aaaaaaaaaaa"]
    # With no primary chosen, the first is primary.
    assert [v["is_primary"] for v in saved["videos"]] == [True, False]
    assert saved["category"] == category.pk
    assert response["X-Studio-Revalidate"] == "healings,prophecies,teachings,writings"


def test_the_same_video_twice_is_refused(api):
    body = new_item(api)
    a = Video.objects.create(youtube_id="aaaaaaaaaaa")
    response = save(api, f"{URL}{body['id']}/", {"videos": [{"video": a.pk}, {"video": a.pk}]})
    assert response.status_code == 400


def test_publishing_puts_it_on_the_public_site(api):
    body = new_item(api)
    public = APIClient()
    assert public.get(f"/api/v1/prophecies/{body['slug']}/").status_code == 404

    response = api.post(f"{URL}{body['id']}/publish/", {}, format="json")
    assert response.status_code == 200
    assert response.json()["state"] == "published"
    assert public.get(f"/api/v1/prophecies/{body['slug']}/").status_code == 200

    api.post(f"{URL}{body['id']}/unpublish/")
    assert public.get(f"/api/v1/prophecies/{body['slug']}/").status_code == 404


def test_an_item_with_a_deleted_video_cannot_be_published(api):
    body = new_item(api)
    dead = Video.objects.create(youtube_id="deaddeaddea", availability=Availability.UNAVAILABLE)
    save(api, f"{URL}{body['id']}/", {"videos": [{"video": dead.pk}]})
    response = api.post(f"{URL}{body['id']}/publish/", {}, format="json")
    assert response.status_code == 409
    assert ContentItem.objects.get(pk=body["id"]).status == Status.DRAFT


def test_a_future_date_schedules_the_item(api):
    body = new_item(api)
    when = timezone.now() + timedelta(days=2)
    response = api.post(f"{URL}{body['id']}/publish/", {"published_at": when.isoformat()}, format="json")
    assert response.json()["state"] == "scheduled"
    public = APIClient()
    assert public.get(f"/api/v1/prophecies/{body['slug']}/").status_code == 404
    assert body["slug"] not in {r["slug"] for r in public.get("/api/v1/prophecies/").json()["results"]}

    ContentItem.objects.filter(pk=body["id"]).update(published_at=timezone.now() - timedelta(minutes=1))
    assert public.get(f"/api/v1/prophecies/{body['slug']}/").status_code == 200


def test_filters(api):
    new_item(api, title="Draft prophecy")
    teaching = new_item(api, kind="teaching", title="Holiness")
    api.post(f"{URL}{teaching['id']}/publish/", {}, format="json")
    ContentItem.objects.filter(title="Draft prophecy").update(needs_review=True)

    def titles(query):
        return {r["title"] for r in api.get(f"{URL}?{query}").json()["results"]}

    assert titles("kind=teaching") == {"Holiness"}
    assert titles("state=draft") == {"Draft prophecy"}
    assert titles("state=published") == {"Holiness"}
    assert titles("needs_review=1") == {"Draft prophecy"}
    assert titles("q=holi") == {"Holiness"}


def test_superusers_can_delete(admin_api):
    item = ContentItem.objects.create(kind=Kind.HEALING, title="Gone", slug="gone")
    assert admin_api.delete(f"{URL}{item.pk}/").status_code == 204
    assert not ContentItem.objects.exists()


def test_taxonomy_lists_the_pickers(api):
    Category.objects.create(name="Vision", slug="vision")
    body = api.get("/api/v1/studio/taxonomy/").json()
    assert {"value": "prophecy", "label": "Prophecy"} in body["kinds"]
    assert body["categories"][0]["name"] == "Vision"


def test_a_save_must_name_the_version_it_edits(api):
    body = new_item(api)
    response = api.patch(f"{URL}{body['id']}/", {"title": "No version"}, format="json")
    assert response.status_code == 428
    assert ContentItem.objects.get(pk=body["id"]).title != "No version"


def test_a_published_item_never_gains_a_deleted_video(api):
    body = new_item(api)
    api.post(f"{URL}{body['id']}/publish/", {}, format="json")
    dead = Video.objects.create(youtube_id="deaddeaddea", availability=Availability.UNAVAILABLE)
    response = save(api, f"{URL}{body['id']}/", {"videos": [{"video": dead.pk}]})
    assert response.status_code == 400
    assert "deleted on YouTube" in response.json()["videos"][0]


def test_a_published_item_whose_video_died_can_still_be_edited(api):
    body = new_item(api)
    video = Video.objects.create(youtube_id="aaaaaaaaaaa", availability=Availability.AVAILABLE)
    save(api, f"{URL}{body['id']}/", {"videos": [{"video": video.pk}]})
    api.post(f"{URL}{body['id']}/publish/", {}, format="json")
    Video.objects.filter(pk=video.pk).update(availability=Availability.UNAVAILABLE)
    response = save(api, f"{URL}{body['id']}/", {"summary": "Fixing a typo",
                                                "videos": [{"video": video.pk}]})
    assert response.status_code == 200


def test_restoring_cannot_bring_back_a_deleted_video_to_a_live_item(api):
    body = new_item(api)
    video = Video.objects.create(youtube_id="aaaaaaaaaaa", availability=Availability.AVAILABLE)
    save(api, f"{URL}{body['id']}/", {"videos": [{"video": video.pk}]})
    with_video = api.get(
        f"/api/v1/studio/revisions/?model=content.contentitem&object_id={body['id']}"
    ).json()["results"][0]
    save(api, f"{URL}{body['id']}/", {"videos": []})
    api.post(f"{URL}{body['id']}/publish/", {}, format="json")
    Video.objects.filter(pk=video.pk).update(availability=Availability.UNAVAILABLE)
    response = api.post(f"/api/v1/studio/revisions/{with_video['id']}/restore/")
    assert response.status_code == 400
    assert not ContentItem.objects.get(pk=body["id"]).videos.exists()
