import pytest
from rest_framework.test import APIClient

from apps.media.processing import process_upload, store
from apps.media.tests.photos import jpeg_bytes, upload
from apps.sitecontent.models import Gallery, HeroSlide, SiteSection
from apps.sitecontent.sections import SECTIONS

from .conftest import save

pytestmark = pytest.mark.django_db


@pytest.fixture
def photo():
    return store(process_upload(upload(jpeg_bytes())), focal_x=0.7, focal_y=0.2)


@pytest.fixture
def another_photo():
    return store(process_upload(upload(jpeg_bytes(colour="blue"))))


def site():
    return APIClient().get("/api/v1/site/").json()


# ------------------------------------------------------------------ slides


def test_a_new_slide_is_framed_on_the_photos_focal_point(api, photo):
    response = api.post(
        "/api/v1/studio/slides/",
        {"image_id": photo.pk, "place": "Nakuru", "detail": "Kenya", "event": "Revival"},
        format="json",
    )
    assert response.status_code == 201, response.content
    body = response.json()
    assert (body["frame_x"], body["frame_y"], body["frame_lg_x"]) == (0.7, 0.2, 0.7)
    assert response["X-Studio-Revalidate"] == "site"

    slide = site()["hero_slides"][0]
    assert slide["place"] == "Nakuru"
    assert slide["frameLg"] == {"x": 0.7, "y": 0.2}
    assert slide["src"] == photo.url


def test_slides_reorder_and_hidden_ones_stay_off_the_site(api, photo, another_photo):
    a = HeroSlide.objects.create(image=photo, place="A", event="A", order=0)
    b = HeroSlide.objects.create(image=another_photo, place="B", event="B", order=1)
    c = HeroSlide.objects.create(image=photo, place="C", event="C", order=2, is_active=False)

    response = api.post("/api/v1/studio/slides/reorder/", {"ids": [b.pk, c.pk, a.pk]}, format="json")
    assert response.status_code == 200
    assert [s["place"] for s in response.json()] == ["B", "C", "A"]
    assert [s["place"] for s in site()["hero_slides"]] == ["B", "A"]


def test_reorder_must_name_every_slide(api, photo):
    HeroSlide.objects.create(image=photo, place="A", event="A")
    response = api.post("/api/v1/studio/slides/reorder/", {"ids": []}, format="json")
    assert response.status_code == 400


# --------------------------------------------------------------- galleries


def gallery_payload(*photos, **fields):
    return {
        "title": "Bogotá",
        "heading": "The Prophet, **honoured**",
        "place_name": "Bogotá",
        "place_detail": "Colombia",
        "photos": [{"image_id": p.pk, "title": f"Photo {i}"} for i, p in enumerate(photos)],
        **fields,
    }


def test_gallery_with_photos_can_be_featured(api, photo, another_photo):
    response = api.post(
        "/api/v1/studio/galleries/", gallery_payload(photo, another_photo), format="json"
    )
    assert response.status_code == 201, response.content
    gallery_id = response.json()["id"]
    assert site()["gallery"] is None  # not featured yet

    assert api.post(f"/api/v1/studio/galleries/{gallery_id}/feature/").status_code == 200
    shown = site()["gallery"]
    assert shown["place"] == {"name": "Bogotá", "detail": "Colombia"}
    assert [p["title"] for p in shown["photos"]] == ["Photo 0", "Photo 1"]
    assert shown["photos"][0]["focus"] == "70% 20%"


def test_featuring_one_gallery_unfeatures_the_other(api, photo):
    first = Gallery.objects.create(title="One", heading="One", is_featured=True)
    first.photos.create(image=photo, title="x")
    second = api.post("/api/v1/studio/galleries/", gallery_payload(photo), format="json").json()
    api.post(f"/api/v1/studio/galleries/{second['id']}/feature/")
    assert list(Gallery.objects.filter(is_featured=True).values_list("pk", flat=True)) == [
        second["id"]
    ]


def test_an_empty_gallery_cannot_be_featured(api):
    gallery = api.post("/api/v1/studio/galleries/", gallery_payload(), format="json").json()
    assert api.post(f"/api/v1/studio/galleries/{gallery['id']}/feature/").status_code == 400


def test_replacing_a_gallerys_photos(api, photo, another_photo):
    gallery = api.post("/api/v1/studio/galleries/", gallery_payload(photo), format="json").json()
    response = api.put(
        f"/api/v1/studio/galleries/{gallery['id']}/",
        gallery_payload(another_photo, photo),
        format="json",
        HTTP_IF_MATCH=gallery["version"],
    )
    assert response.status_code == 200
    assert [p["image"]["id"] for p in response.json()["photos"]] == [another_photo.pk, photo.pk]


# ---------------------------------------------------------------- sections


def test_sections_start_on_their_original_words():
    assert site()["sections"]["contact"]["email"] == "repentoffice@gmail.com"


def test_editing_a_section(api):
    section = api.get("/api/v1/studio/sections/contact/").json()
    assert section["is_default"] is True
    data = {**section["data"], "email": "office@example.org"}
    response = api.put(
        "/api/v1/studio/sections/contact/",
        {"data": data},
        format="json",
        HTTP_IF_MATCH=section["version"],
    )
    assert response.status_code == 200, response.content
    assert response.json()["is_default"] is False
    assert response["X-Studio-Revalidate"] == "site"
    assert site()["sections"]["contact"]["email"] == "office@example.org"


def test_invalid_words_are_refused_field_by_field(api):
    data = {
        **SECTIONS["contact"].default,
        "email": "not an email",
        "whatsapp": "call me",
        "place": "",
    }
    response = save(api, "/api/v1/studio/sections/contact/", {"data": data}, "put")
    assert response.status_code == 400
    assert set(response.json()["errors"]) == {"email", "whatsapp", "place"}
    assert not SiteSection.objects.exists()


def test_a_list_section_keeps_its_three_cards(api):
    data = {**SECTIONS["home_message"].default}
    data["pillars"] = data["pillars"][:2]
    response = save(api, "/api/v1/studio/sections/home_message/", {"data": data}, "put")
    assert response.status_code == 400
    assert "pillars" in response.json()["errors"]


def test_resetting_returns_the_original_words(api):
    data = {**SECTIONS["home_hero"].default, "line_1": "Repent"}
    save(api, "/api/v1/studio/sections/home_hero/", {"data": data}, "put")
    assert site()["sections"]["home_hero"]["line_1"] == "Repent"
    response = api.delete("/api/v1/studio/sections/home_hero/")
    assert response.json()["is_default"] is True
    assert site()["sections"]["home_hero"]["line_1"] == "Prepare"


def test_a_stale_section_edit_is_refused(api, admin_api):
    section = api.get("/api/v1/studio/sections/home_radio/").json()
    theirs = {**section["data"], "heading": "Theirs"}
    save(admin_api, "/api/v1/studio/sections/home_radio/", {"data": theirs}, "put")
    mine = {**section["data"], "heading": "Mine"}
    response = api.put(
        "/api/v1/studio/sections/home_radio/",
        {"data": mine},
        format="json",
        HTTP_IF_MATCH=section["version"],
    )
    assert response.status_code == 409
    assert response.json()["current"]["data"]["heading"] == "Theirs"


def test_unknown_section_is_404(api):
    assert api.get("/api/v1/studio/sections/nope/").status_code == 404


def test_dashboard_reports_what_needs_attention(api):
    body = api.get("/api/v1/studio/dashboard/").json()
    assert body["counts"]["slides"] == 0
    assert any("hero slides" in w["text"] for w in body["warnings"])


@pytest.mark.parametrize(
    "url,body",
    [
        ("/api/v1/studio/slides/reorder/", {"ids": [1, "a"]}),
        ("/api/v1/studio/slides/reorder/", ["not", "an", "object"]),
    ],
)
def test_malformed_reorders_are_refused_not_crashed(api, url, body):
    assert api.post(url, body, format="json").status_code == 400


def test_a_malformed_section_save_is_refused_not_crashed(api):
    section = api.get("/api/v1/studio/sections/contact/").json()
    response = api.put("/api/v1/studio/sections/contact/", ["x"], format="json",
                       HTTP_IF_MATCH=section["version"])
    assert response.status_code == 400


def test_featured_false_as_text_takes_a_gallery_off(api, photo):
    gallery = Gallery.objects.create(title="One", heading="One", is_featured=True)
    gallery.photos.create(image=photo, title="x")
    api.post(f"/api/v1/studio/galleries/{gallery.pk}/feature/", {"featured": "false"}, format="json")
    assert not Gallery.objects.get(pk=gallery.pk).is_featured
