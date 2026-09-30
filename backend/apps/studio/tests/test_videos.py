import pytest

from apps.content.models import Availability, ContentItem, Kind, Video
from apps.studio import youtube
from apps.studio.youtube import parse_youtube_id

URL = "/api/v1/studio/videos/"


@pytest.mark.parametrize(
    "value",
    [
        "dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ&t=42s",
        "https://youtu.be/dQw4w9WgXcQ?si=abc",
        "youtu.be/dQw4w9WgXcQ",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/live/dQw4w9WgXcQ?feature=share",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        "  https://youtu.be/dQw4w9WgXcQ  ",
    ],
)
def test_every_kind_of_youtube_link_names_the_video(value):
    assert parse_youtube_id(value) == "dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "value",
    [
        "https://vimeo.com/123456",
        "https://www.youtube.com/@repentancechannel1",
        "https://evil.example/watch?v=dQw4w9WgXcQ",
        "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
        "not a link",
        "dQw4w9WgXc",
    ],
)
def test_anything_else_is_not_a_video(value):
    assert parse_youtube_id(value) is None


@pytest.fixture
def probe(monkeypatch):
    calls = []

    def fake(youtube_id):
        calls.append(youtube_id)
        return Availability.AVAILABLE, "Prophecy of a great earthquake"

    monkeypatch.setattr(youtube, "probe", fake)
    return calls


@pytest.mark.django_db
def test_adding_a_video_by_link_fetches_its_title(api, probe):
    response = api.post(URL, {"url": "https://youtu.be/dQw4w9WgXcQ"}, format="json")
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["title"] == "Prophecy of a great earthquake"
    assert body["availability"] == "available"
    assert body["duplicate"] is False


@pytest.mark.django_db
def test_adding_a_video_twice_returns_the_first(api, probe):
    api.post(URL, {"url": "dQw4w9WgXcQ"}, format="json")
    again = api.post(URL, {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}, format="json")
    assert again.status_code == 200
    assert again.json()["duplicate"] is True
    assert Video.objects.count() == 1
    assert probe == ["dQw4w9WgXcQ"]


@pytest.mark.django_db
def test_a_link_that_is_not_youtube_is_refused(api, probe):
    response = api.post(URL, {"url": "https://vimeo.com/1"}, format="json")
    assert response.status_code == 400
    assert probe == []


@pytest.mark.django_db
def test_a_video_in_use_cannot_be_deleted(api):
    video = Video.objects.create(youtube_id="dQw4w9WgXcQ")
    item = ContentItem.objects.create(kind=Kind.TEACHING, title="Holiness", slug="holiness")
    item.videos.create(video=video)
    response = api.delete(f"{URL}{video.pk}/")
    assert response.status_code == 409
    assert response.json()["usage"][0]["label"] == "Holiness"


@pytest.mark.django_db
def test_checking_again_updates_availability(api, monkeypatch):
    video = Video.objects.create(youtube_id="dQw4w9WgXcQ", availability=Availability.AVAILABLE)
    monkeypatch.setattr(youtube, "probe", lambda _id: (Availability.UNAVAILABLE, ""))
    response = api.post(f"{URL}{video.pk}/check/")
    assert response.status_code == 200
    assert response.json()["availability"] == "unavailable"
    assert response["X-Studio-Revalidate"] == "healings,prophecies,teachings,writings"
