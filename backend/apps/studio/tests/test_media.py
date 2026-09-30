from pathlib import Path

import pytest
from django.conf import settings

from apps.media.models import MediaAsset
from apps.media.tests.photos import jpeg_bytes, upload
from apps.sitecontent.models import HeroSlide
from apps.studio.models import Action, Revision

from .conftest import save

pytestmark = pytest.mark.django_db

URL = "/api/v1/studio/media/"


def add_photo(api, **fields):
    response = api.post(URL, {"file": upload(jpeg_bytes(**fields.pop("jpeg", {}))), **fields})
    assert response.status_code == 201, response.content
    return response.json()


def test_upload_stores_an_optimised_photo(api, editor):
    body = add_photo(api, alt_text="A crowd", collection="Hero")
    asset = MediaAsset.objects.get(pk=body["id"])
    assert asset.file.name.endswith(".webp")
    assert asset.uploaded_by == editor
    assert (body["alt_text"], body["collection"]) == ("A crowd", "Hero")
    assert body["url"].startswith("/media/cms/")
    assert body["usage"] == []


def test_the_same_photo_twice_is_one_photo(api):
    raw = jpeg_bytes()
    first = api.post(URL, {"file": upload(raw)})
    second = api.post(URL, {"file": upload(raw, "renamed.jpg")})
    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["duplicate"] is True
    assert second.json()["id"] == first.json()["id"]
    assert MediaAsset.objects.count() == 1


def test_a_non_photo_is_refused_with_a_reason(api):
    response = api.post(URL, {"file": upload(b"not an image", "x.jpg")})
    assert response.status_code == 400
    assert "photo" in response.json()["file"][0]


def test_upload_is_recorded_and_refreshes_the_site(api):
    response = api.post(URL, {"file": upload(jpeg_bytes())})
    assert response["X-Studio-Revalidate"] == "site"
    assert Revision.objects.get().action == Action.CREATED


def test_details_and_focal_point_can_be_edited(api):
    photo = add_photo(api)
    response = api.patch(
        f"{URL}{photo['id']}/",
        {"title": "Nakuru", "focal_x": 0.7, "focal_y": 0.2},
        format="json",
        HTTP_IF_MATCH=photo["version"],
    )
    assert response.status_code == 200
    asset = MediaAsset.objects.get()
    assert (asset.title, asset.focal_x, asset.object_position) == ("Nakuru", 0.7, "70% 20%")


def test_focal_point_must_be_inside_the_photo(api):
    photo = add_photo(api)
    response = save(api, f"{URL}{photo['id']}/", {"focal_x": 1.5})
    assert response.status_code == 400


def test_a_stale_edit_is_refused_not_lost(api, admin_api):
    photo = add_photo(api)
    save(admin_api, f"{URL}{photo['id']}/", {"title": "Theirs"})
    response = api.patch(
        f"{URL}{photo['id']}/",
        {"title": "Mine"},
        format="json",
        HTTP_IF_MATCH=photo["version"],
    )
    assert response.status_code == 409
    assert response.json()["current"]["title"] == "Theirs"
    assert MediaAsset.objects.get().title == "Theirs"


def test_a_photo_in_use_cannot_be_deleted(api):
    photo = add_photo(api)
    HeroSlide.objects.create(image_id=photo["id"], place="Nakuru", event="Revival")
    response = api.delete(f"{URL}{photo['id']}/")
    assert response.status_code == 409
    assert response.json()["usage"][0]["model"] == "sitecontent.heroslide"
    assert MediaAsset.objects.exists()


def test_deleting_an_unused_photo_removes_its_file(api, django_capture_on_commit_callbacks):
    photo = add_photo(api)
    path = Path(settings.MEDIA_ROOT) / MediaAsset.objects.get().file.name
    assert path.exists()
    with django_capture_on_commit_callbacks(execute=True):
        assert api.delete(f"{URL}{photo['id']}/").status_code == 204
    assert not path.exists()
    assert Revision.objects.filter(action=Action.DELETED).exists()


def test_library_filters(api):
    used = add_photo(api, alt_text="Described", jpeg={"colour": "blue"})
    add_photo(api, collection="Bogotá", jpeg={"colour": "green"})
    HeroSlide.objects.create(image_id=used["id"], place="Nakuru", event="Revival")

    def ids(query):
        return {row["id"] for row in api.get(f"{URL}?{query}").json()["results"]}

    assert used["id"] not in ids("unused=1")
    assert used["id"] not in ids("missing_alt=1")
    assert len(ids("collection=Bogotá")) == 1
    assert ids("q=described") == {used["id"]}
    counts = {row["id"]: row["usage_count"] for row in api.get(URL).json()["results"]}
    assert counts[used["id"]] == 1

    assert api.get(f"{URL}collections/").json() == [{"name": "Bogotá", "count": 1}]


def test_an_oversized_upload_is_refused_before_it_is_read(api):
    from apps.studio.views.media import MAX_REQUEST_BYTES

    response = api.post(URL, {"file": upload(jpeg_bytes())}, CONTENT_LENGTH=str(MAX_REQUEST_BYTES + 1))
    assert response.status_code == 413
    assert not MediaAsset.objects.exists()
