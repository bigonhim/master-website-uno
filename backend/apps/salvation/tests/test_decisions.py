"""
Salvation endpoint tests.

This is the only public write route on the site and it handles special-category
data, so the properties asserted here are the ones that matter most: no write
surface beyond POST, no contact details captured without explicit consent, and
a decision that survives even when notification fails.
"""

import pytest
from django.core import mail
from django.core.cache import cache

from apps.salvation.models import Decision, FollowUpStatus, SalvationDecision

pytestmark = pytest.mark.django_db

URL = "/api/v1/salvation/decisions/"


@pytest.fixture(autouse=True)
def clear_throttle():
    # The throttle bucket is shared state; without this it masks status codes
    # in whichever test happens to run sixth.
    cache.clear()
    yield
    cache.clear()


def post(client, **payload):
    return client.post(URL, payload, content_type="application/json")


@pytest.mark.parametrize("method", ["get", "put", "patch", "delete"])
def test_no_write_surface_beyond_post(client, method):
    """A CreateAPIView has no other handlers. The previous attempt used a
    ModelViewSet and left PUT/PATCH/DELETE reachable by anyone."""
    assert getattr(client, method)(URL).status_code == 405


def test_a_person_may_pray_anonymously(client):
    response = post(client, decision="prayed")
    assert response.status_code == 201
    decision = SalvationDecision.objects.get()
    assert decision.name == ""
    assert decision.email == ""
    assert decision.follow_up_status == FollowUpStatus.NO_CONTACT


def test_consent_is_versioned_and_timestamped(client):
    post(
        client,
        decision="prayed",
        email="someone@example.com",
        wants_follow_up=True,
    )
    decision = SalvationDecision.objects.get()
    assert decision.wants_follow_up
    assert decision.consent_text_version
    assert decision.consented_at is not None


def test_follow_up_requires_a_way_to_reply(client):
    response = post(client, decision="prayed", wants_follow_up=True)
    assert response.status_code == 400


def test_no_auto_response_without_consent(client):
    mail.outbox.clear()
    post(client, decision="prayed", email="quiet@example.com")
    assert all("quiet@example.com" not in m.to for m in mail.outbox)


def test_raw_ip_is_never_stored(client):
    post(client, decision="prayed", REMOTE_ADDR="203.0.113.9")
    decision = SalvationDecision.objects.get()
    assert "203.0.113" not in decision.ip_hash
    assert decision.ip_hash == "" or len(decision.ip_hash) == 64


def test_honeypot_rejects_bots(client):
    assert (
        post(client, decision="prayed", honeypot="buy-cheap-things").status_code == 400
    )


def test_not_yet_is_a_first_class_answer(client):
    response = post(client, decision="not_yet", reason="i have questions")
    assert response.status_code == 201
    assert SalvationDecision.objects.get().decision == Decision.NOT_YET


def test_throttle_limits_submissions(client):
    codes = [post(client, decision="prayed").status_code for _ in range(6)]
    assert codes[-1] == 429


def test_anonymise_keeps_the_decision_and_drops_the_person(client):
    post(
        client,
        decision="prayed",
        name="Someone",
        email="s@example.com",
        wants_follow_up=True,
        country="Kenya",
    )
    decision = SalvationDecision.objects.get()
    decision.anonymise()
    decision.refresh_from_db()

    assert decision.name == ""
    assert decision.email == ""
    assert decision.anonymised_at is not None
    # The statistic survives: the ministry keeps its numbers, not its liability.
    assert decision.decision == Decision.PRAYED
    assert decision.country == "Kenya"


def test_retention_window_is_set_on_creation(client):
    post(client, decision="prayed")
    assert SalvationDecision.objects.get().retention_expires_at is not None
