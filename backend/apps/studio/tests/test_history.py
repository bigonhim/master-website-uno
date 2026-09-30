import pytest
from django.contrib.auth.models import Permission

from apps.content.models import ContentItem
from apps.sitecontent.models import SiteSection
from apps.sitecontent.sections import SECTIONS
from apps.studio.models import Action, Revision

from .conftest import client_for, save

pytestmark = pytest.mark.django_db

ITEMS = "/api/v1/studio/items/"
REVISIONS = "/api/v1/studio/revisions/"


def history(api, model, object_id):
    return api.get(f"{REVISIONS}?model={model}&object_id={object_id}").json()["results"]


def test_every_save_is_recorded_with_what_changed(api):
    item = api.post(ITEMS, {"kind": "teaching", "title": "First"}, format="json").json()
    save(api, f"{ITEMS}{item['id']}/", {"title": "Second", "summary": "Now with a summary"})

    rows = history(api, "content.contentitem", item["id"])
    assert [r["action"] for r in rows] == ["updated", "created"]
    assert rows[0]["changed_fields"] == ["summary", "title"]
    assert rows[0]["user"] == "grace"


def test_restoring_an_earlier_version(api):
    item = api.post(ITEMS, {"kind": "teaching", "title": "First"}, format="json").json()
    save(api, f"{ITEMS}{item['id']}/", {"title": "Second"})
    created = history(api, "content.contentitem", item["id"])[-1]

    response = api.post(f"{REVISIONS}{created['id']}/restore/")
    assert response.status_code == 200, response.content
    assert response.json()["action"] == Action.RESTORED
    assert response["X-Studio-Revalidate"] == "healings,prophecies,teachings,writings"
    assert ContentItem.objects.get(pk=item["id"]).title == "First"


def test_restoring_a_section(api):
    section = SECTIONS["home_radio"]
    url = "/api/v1/studio/sections/home_radio/"
    save(api, url, {"data": {**section.default, "heading": "One"}}, "put")
    save(api, url, {"data": {**section.default, "heading": "Two"}}, "put")
    first = history(api, "sitecontent.sitesection", "home_radio")[-1]
    # Even the first edit says what it changed: against the original words.
    assert first["changed_fields"] == ["heading"]
    assert api.post(f"{REVISIONS}{first['id']}/restore/").status_code == 200
    assert SiteSection.objects.get(key="home_radio").data["heading"] == "One"


def test_a_deleted_item_cannot_be_restored(admin_api):
    item = admin_api.post(ITEMS, {"kind": "healing", "title": "Gone"}, format="json").json()
    admin_api.delete(f"{ITEMS}{item['id']}/")
    created = Revision.objects.get(action=Action.CREATED)
    assert admin_api.post(f"{REVISIONS}{created.pk}/restore/").status_code == 404


def test_restoring_needs_permission_to_change_it(api, make_user):
    item = api.post(ITEMS, {"kind": "teaching", "title": "First"}, format="json").json()
    revision = history(api, "content.contentitem", item["id"])[0]
    # Can view the archive, can't change it.
    viewer_user = make_user("viewer")
    viewer_user.user_permissions.add(
        Permission.objects.get(codename="view_contentitem", content_type__app_label="content")
    )
    viewer = client_for(viewer_user)
    assert viewer.get(f"{REVISIONS}{revision['id']}/").status_code == 200
    assert viewer.post(f"{REVISIONS}{revision['id']}/restore/").status_code == 403


def test_a_revision_shows_the_full_saved_version(api):
    item = api.post(ITEMS, {"kind": "teaching", "title": "First"}, format="json").json()
    revision = history(api, "content.contentitem", item["id"])[0]
    data = api.get(f"{REVISIONS}{revision['id']}/").json()["data"]
    assert data["title"] == "First"
    assert "version" not in data  # only what an editor wrote


def test_the_first_studio_edit_of_an_imported_item_names_its_changes(api):
    from apps.content.models import Kind

    item = ContentItem.objects.create(kind=Kind.TEACHING, title="Imported", slug="imported")
    save(api, f"{ITEMS}{item.pk}/", {"summary": "Written in the Studio"})
    assert history(api, "content.contentitem", item.pk)[0]["changed_fields"] == ["summary"]


def test_history_shows_only_what_the_account_may_view(api, make_user):
    """A revision holds the full text, drafts included, so it is gated by the
    same view permission as the thing itself."""
    item = api.post(ITEMS, {"kind": "prophecy", "title": "Unpublished draft",
                            "body": "Not yet public"}, format="json").json()
    revision = history(api, "content.contentitem", item["id"])[0]
    staff_only = client_for(make_user("intern"))
    assert staff_only.get(f"{REVISIONS}{revision['id']}/").status_code == 404
    assert staff_only.get(REVISIONS).json()["count"] == 0
    assert staff_only.get("/api/v1/studio/dashboard/").json()["recent"] == []
