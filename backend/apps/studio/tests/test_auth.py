"""
Who can reach the Studio API.

The Studio is the site's only write surface beyond the two public forms, so
these tests pin down every way in: the token, and nothing else.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.studio.models import EditorSession, hash_key

from .conftest import PASSWORD, client_for

pytestmark = pytest.mark.django_db

LOGIN = "/api/v1/studio/auth/login/"
ME = "/api/v1/studio/auth/me/"

# One GET per Studio area: each must refuse a caller with no token.
PROTECTED = [
    ME,
    "/api/v1/studio/dashboard/",
    "/api/v1/studio/taxonomy/",
    "/api/v1/studio/media/",
    "/api/v1/studio/videos/",
    "/api/v1/studio/items/",
    "/api/v1/studio/slides/",
    "/api/v1/studio/galleries/",
    "/api/v1/studio/sections/",
    "/api/v1/studio/revisions/",
]


def sign_in(username, password=PASSWORD):
    return APIClient().post(LOGIN, {"username": username, "password": password}, format="json")


def test_editor_signs_in_and_the_token_works(editor):
    response = sign_in("grace")
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["username"] == "grace"
    assert "content.change_contentitem" in body["user"]["permissions"]

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['token']}")
    assert client.get(ME).json()["username"] == "grace"


def test_only_a_hash_of_the_token_is_stored(editor):
    token = sign_in("grace").json()["token"]
    session = EditorSession.objects.get()
    assert session.key_hash == hash_key(token)
    assert token not in session.key_hash


@pytest.mark.parametrize("username,password", [("grace", "wrong"), ("nobody", PASSWORD)])
def test_bad_credentials_are_refused(editor, username, password):
    response = sign_in(username, password)
    assert response.status_code == 400
    assert "token" not in response.json()


def test_non_staff_get_the_same_answer_as_a_wrong_password(make_user, editor):
    make_user("visitor", staff=False)
    wrong = sign_in("grace", "wrong").json()
    not_staff = sign_in("visitor").json()
    assert wrong == not_staff


@pytest.mark.parametrize("url", PROTECTED)
def test_every_area_refuses_anonymous_callers(url):
    assert APIClient().get(url).status_code == 401


@pytest.mark.parametrize("url", PROTECTED)
def test_a_django_admin_session_is_not_enough(admin_user, url):
    # Session cookies are not accepted here at all: that is what keeps CSRF
    # out of the picture.
    client = APIClient()
    client.force_login(admin_user)
    assert client.get(url).status_code == 401


def test_a_made_up_token_is_refused():
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")
    assert client.get(ME).status_code == 401


def test_an_expired_session_is_refused(editor):
    client = client_for(editor)
    EditorSession.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
    assert client.get(ME).status_code == 401


def test_a_deactivated_or_demoted_account_loses_access(editor):
    client = client_for(editor)
    editor.is_staff = False
    editor.save()
    assert client.get(ME).status_code == 401


def test_sign_out_ends_the_session(editor):
    client = client_for(editor)
    assert client.post("/api/v1/studio/auth/logout/").status_code == 204
    assert client.get(ME).status_code == 401
    assert not EditorSession.objects.exists()


def test_guessing_a_password_is_stopped_per_account(editor, admin_user):
    codes = [sign_in("grace", f"guess-{n}").status_code for n in range(10)]
    assert codes == [400] * 10
    # Locked now, even with the right password, however the name is typed.
    assert sign_in("grace").status_code == 429
    assert sign_in(" GRACE ").status_code == 429
    # Another account is unaffected.
    assert sign_in("root").status_code == 200


def test_signing_in_often_is_never_stopped(editor):
    assert all(sign_in("grace").status_code == 200 for _ in range(15))


def test_a_successful_sign_in_clears_earlier_failures(editor):
    for n in range(9):
        sign_in("grace", f"guess-{n}")
    assert sign_in("grace").status_code == 200
    assert all(sign_in("grace", f"again-{n}").status_code == 400 for n in range(9))
    assert sign_in("grace").status_code == 200


def test_staff_without_permissions_can_sign_in_but_not_read(make_user):
    bare = client_for(make_user("intern"))
    assert bare.get(ME).status_code == 200
    assert bare.get("/api/v1/studio/items/").status_code == 403
    assert bare.get("/api/v1/studio/media/").status_code == 403


def test_editors_cannot_delete_archive_items(api):
    from apps.content.models import Prophecy

    item = Prophecy.objects.create(title="Keep me", slug="keep-me")
    assert api.delete(f"/api/v1/studio/items/{item.pk}/").status_code == 403


def test_changing_the_password_ends_studio_sessions(editor):
    client = client_for(editor)
    assert client.get(ME).status_code == 200
    editor.set_password("a-brand-new-password")
    editor.save()
    assert client.get(ME).status_code == 401
