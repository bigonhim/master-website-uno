"""
How the Studio API knows who is asking.

Only this scheme is accepted on Studio routes: no Django session cookie, so no
CSRF surface, and no Basic auth, so a password never travels per request.
"""

from datetime import timedelta

from django.utils import timezone
from django.utils.crypto import constant_time_compare
from rest_framework import authentication, exceptions

from .models import EditorSession, hash_key

# Writing last_used_at on every request would turn every read into a write.
TOUCH_EVERY = timedelta(minutes=5)


class EditorTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("latin-1")
        if not header:
            return None
        parts = header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed("Sign in to the Studio.")

        session = (
            EditorSession.objects.select_related("user")
            .filter(key_hash=hash_key(parts[1]))
            .first()
        )
        if session is None or session.is_expired:
            raise exceptions.AuthenticationFailed("Your session has ended. Sign in again.")
        user = session.user
        if not (user.is_active and user.is_staff):
            raise exceptions.AuthenticationFailed("This account can no longer use the Studio.")
        if not constant_time_compare(session.auth_hash, user.get_session_auth_hash()):
            raise exceptions.AuthenticationFailed("The password has changed. Sign in again.")

        now = timezone.now()
        if now - session.last_used_at > TOUCH_EVERY:
            EditorSession.objects.filter(pk=session.pk).update(last_used_at=now)
        return user, session

    def authenticate_header(self, request):
        # Makes DRF answer 401 rather than 403, so the Studio can tell "sign in
        # again" apart from "you may not do that".
        return self.keyword
