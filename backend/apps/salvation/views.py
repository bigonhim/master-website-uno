import hashlib
import hmac
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

from .serializers import SalvationDecisionSerializer

logger = logging.getLogger(__name__)


def hash_ip(request) -> str:
    """Keyed hash of the caller's address.

    Enough to correlate abuse, never enough to identify a person — the raw
    address is never stored.
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    address = forwarded.split(",")[0].strip() or request.META.get("REMOTE_ADDR", "")
    if not address:
        return ""
    return hmac.new(
        settings.SECRET_KEY.encode(), address.encode(), hashlib.sha256
    ).hexdigest()


class SalvationDecisionCreateView(generics.CreateAPIView):
    """The only public write endpoint on the site.

    Deliberately a CreateAPIView and not a ModelViewSet: there is no list,
    retrieve, update or delete route to secure, because none exists. The
    previous attempt at this project used a ModelViewSet and left PUT, PATCH
    and DELETE reachable by anyone.
    """

    serializer_class = SalvationDecisionSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # no session auth means no CSRF/cookie surface
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "salvation"

    @extend_schema(
        summary="Record a salvation decision",
        description=(
            "Records a decision from the Salvation Prayer flow. Name, email and "
            "phone are all optional — a person may pray anonymously. Contact "
            "details are only used when follow-up is explicitly consented to."
        ),
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        decision = serializer.save(ip_hash=hash_ip(self.request))
        # Queued after commit so an email is never sent for a rolled-back row.
        transaction.on_commit(lambda: self._notify(decision))

    def _notify(self, decision) -> None:
        team = getattr(settings, "SALVATION_TEAM_EMAIL", "") or ""
        try:
            if team:
                send_mail(
                    # No name in the subject: alert emails get forwarded and
                    # screenshotted.
                    subject="New response recorded",
                    message=(
                        f"Decision: {decision.get_decision_display()}\n"
                        f"Country: {decision.country or 'not given'}\n"
                        f"Contact details provided: "
                        f"{'yes' if decision.has_contact_details else 'no'}\n"
                        f"Follow-up consented: "
                        f"{'yes' if decision.wants_follow_up else 'no'}\n"
                        f"Reference: {decision.id}\n"
                    ),
                    from_email=None,
                    recipient_list=[team],
                    fail_silently=False,
                )
            if decision.wants_follow_up and decision.email:
                send_mail(
                    subject="Welcome — your next steps",
                    message=(
                        "Thank you for taking this step.\n\n"
                        "Someone from the Ministry of Repentance and Holiness will "
                        "be in touch. In the meantime you can begin with the "
                        "teachings on repentance and holiness on our website.\n\n"
                        "If you would rather we deleted your details, reply to this "
                        "message and we will remove them.\n"
                    ),
                    from_email=None,
                    recipient_list=[decision.email],
                    fail_silently=False,
                )
        except Exception:  # noqa: BLE001
            # A mail outage must never lose the decision that was already saved.
            logger.exception("Salvation notification failed for %s", decision.id)
