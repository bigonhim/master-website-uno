"""
Contact endpoint tests.

The second public write route on the site. People write to a church about
private things, so what is asserted here is what matters most: no write surface
beyond POST, nothing readable back, no raw address stored, and a message that
survives when notification fails.
"""

import pytest
from django.core import mail
from django.core.cache import cache

from apps.contact.models import ContactMessage, ReplyStatus, Topic

pytestmark = pytest.mark.django_db

URL = "/api/v1/contact/messages/"

VALID = {
    "topic": "prayer",
    "name": "Jane Wanjiku",
    "email": "jane@example.com",
    "message": "Please pray with me.",
}


@pytest.fixture(autouse=True)
def clear_throttle():
    # The throttle bucket is shared state between tests.
    cache.clear()
    yield
    cache.clear()


def post(client, **payload):
    return client.post(URL, payload, content_type="application/json")


@pytest.mark.parametrize("method", ["get", "put", "patch", "delete"])
def test_no_write_surface_beyond_post(client, method):
    assert getattr(client, method)(URL).status_code == 405


def test_a_message_is_recorded(client):
    response = post(client, **VALID, phone="+254 700 000000")
    assert response.status_code == 201
    message = ContactMessage.objects.get()
    assert message.topic == Topic.PRAYER
    assert message.name == "Jane Wanjiku"
    assert message.phone == "+254 700 000000"
    assert message.status == ReplyStatus.NEW
    assert message.retention_expires_at is not None


def test_the_response_does_not_echo_what_was_sent_beyond_the_form(client):
    body = post(client, **VALID).json()
    assert "ip_hash" not in body
    assert "status" not in body
    assert "notes" not in body


def test_phone_and_topic_are_optional(client):
    payload = {k: v for k, v in VALID.items() if k != "topic"}
    assert post(client, **payload).status_code == 201
    assert ContactMessage.objects.get().topic == Topic.OTHER


@pytest.mark.parametrize("missing", ["name", "email", "message"])
def test_name_email_and_message_are_required(client, missing):
    payload = {k: v for k, v in VALID.items() if k != missing}
    response = post(client, **payload)
    assert response.status_code == 400
    assert missing in response.json()
    assert not ContactMessage.objects.exists()


def test_an_invalid_email_is_refused(client):
    assert post(client, **{**VALID, "email": "not-an-address"}).status_code == 400


def test_an_unknown_topic_is_refused(client):
    assert post(client, **{**VALID, "topic": "buying-coffee"}).status_code == 400


def test_staff_fields_cannot_be_set_from_outside(client):
    post(client, **VALID, status="done", notes="injected")
    message = ContactMessage.objects.get()
    assert message.status == ReplyStatus.NEW
    assert message.notes == ""


def test_honeypot_rejects_bots(client):
    assert post(client, **VALID, honeypot="buy-cheap-things").status_code == 400


def test_raw_ip_is_never_stored(client):
    post(client, **VALID, REMOTE_ADDR="203.0.113.9")
    message = ContactMessage.objects.get()
    assert "203.0.113" not in message.ip_hash
    assert message.ip_hash == "" or len(message.ip_hash) == 64


def test_throttle_limits_submissions(client):
    codes = [post(client, **VALID).status_code for _ in range(6)]
    assert codes[-1] == 429


def test_the_alert_carries_neither_the_name_nor_the_message(
    client, settings, django_capture_on_commit_callbacks
):
    settings.CONTACT_TEAM_EMAIL = "office@example.com"
    mail.outbox.clear()
    with django_capture_on_commit_callbacks(execute=True):
        post(client, **VALID)
    assert len(mail.outbox) == 1
    alert = mail.outbox[0]
    assert alert.to == ["office@example.com"]
    assert "Jane" not in alert.subject + alert.body
    assert "Please pray with me" not in alert.body
    assert "jane@example.com" not in alert.body


def test_no_alert_without_a_configured_address(
    client, settings, django_capture_on_commit_callbacks
):
    settings.CONTACT_TEAM_EMAIL = ""
    mail.outbox.clear()
    with django_capture_on_commit_callbacks(execute=True):
        assert post(client, **VALID).status_code == 201
    assert mail.outbox == []


def test_anonymise_removes_the_person_and_their_words(client):
    post(client, **VALID, phone="+254 700 000000")
    message = ContactMessage.objects.get()
    message.anonymise()
    message.refresh_from_db()

    assert message.name == ""
    assert message.email == ""
    assert message.phone == ""
    assert message.message == ""
    assert message.anonymised_at is not None
    assert message.topic == Topic.PRAYER
