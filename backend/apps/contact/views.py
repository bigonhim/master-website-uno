import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

from apps.salvation.views import hash_ip

from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)


class ContactMessageCreateView(generics.CreateAPIView):
    """Takes a message for the ministry's office.

    A CreateAPIView for the same reason the salvation endpoint is one: there is
    no list, retrieve, update or delete route to secure, because none exists.
    Messages are read in the admin and nowhere else.
    """

    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # no session auth means no CSRF/cookie surface
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    @extend_schema(
        summary="Send a message to the ministry",
        description=(
            "Records a message from the contact page. Name, email and the "
            "message are required; a phone number is optional."
        ),
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        message = serializer.save(ip_hash=hash_ip(self.request))
        # Queued after commit so an email is never sent for a rolled-back row.
        transaction.on_commit(lambda: self._notify(message))

    def _notify(self, message) -> None:
        team = getattr(settings, "CONTACT_TEAM_EMAIL", "") or ""
        if not team:
            return
        try:
            send_mail(
                # Neither the name nor the message: alert emails get forwarded
                # and screenshotted. The message is read in the admin.
                subject="New message from the website",
                message=(
                    f"About: {message.get_topic_display()}\n"
                    f"Phone number provided: {'yes' if message.phone else 'no'}\n"
                    f"Reference: {message.id}\n"
                ),
                from_email=None,
                recipient_list=[team],
                fail_silently=False,
            )
        except Exception:  # noqa: BLE001
            # A mail outage must never lose the message that was already saved.
            logger.exception("Contact notification failed for %s", message.id)
