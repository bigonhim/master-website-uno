import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.studio.models import EditorSession

PASSWORD = "a-long-test-password"


@pytest.fixture(autouse=True)
def _clear_throttles():
    # The sign-in throttle counts in the cache, which outlives a test.
    from django.core.cache import cache

    cache.clear()


@pytest.fixture
def make_user(db):
    User = get_user_model()

    def make(username, *, staff=True, superuser=False, editor=False, active=True):
        user = User.objects.create_user(
            username=username,
            password=PASSWORD,
            is_staff=staff,
            is_superuser=superuser,
            is_active=active,
        )
        if editor:
            call_command("setup_studio", verbosity=0)
            user.groups.add(Group.objects.get(name="Editors"))
        return user

    return make


@pytest.fixture
def editor(make_user):
    return make_user("grace", editor=True)


@pytest.fixture
def admin_user(make_user):
    return make_user("root", superuser=True)


def client_for(user) -> APIClient:
    _, token = EditorSession.start(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.fixture
def api(editor):
    return client_for(editor)


@pytest.fixture
def admin_api(admin_user):
    return client_for(admin_user)


def save(client, url, payload, method="patch"):
    """An edit as the Studio makes it: naming the version being edited."""
    version = client.get(url).json()["version"]
    return getattr(client, method)(url, payload, format="json", HTTP_IF_MATCH=version)
