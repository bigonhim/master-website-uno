from django.contrib.auth import authenticate
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.content.models import (
    Availability,
    Category,
    ContentItem,
    DatePrecision,
    DateSource,
    Kind,
    Region,
    Series,
    Status,
    Video,
)
from apps.media.models import MediaAsset
from apps.sitecontent.models import Gallery, HeroSlide

from .. import throttles
from ..auth import EditorTokenAuthentication
from ..history import visible_revisions
from ..models import EditorSession, Revision
from ..permissions import IsStudioEditor
from ..serializers.revisions import RevisionSerializer

# The apps whose permissions decide what the Studio shows an editor.
STUDIO_APPS = ("content", "media", "sitecontent", "studio")


def choices(enum) -> list[dict]:
    return [{"value": value, "label": label} for value, label in enum.choices]


def user_payload(user) -> dict:
    perms = sorted(p for p in user.get_all_permissions() if p.split(".")[0] in STUDIO_APPS)
    return {
        "id": user.pk,
        "username": user.get_username(),
        "name": user.get_full_name() or user.get_username(),
        "email": user.email,
        "is_superuser": user.is_superuser,
        "permissions": perms,
    }


class SignInSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=256, trim_whitespace=False)


class SignInView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(summary="Sign in to the Studio", request=SignInSerializer)
    def post(self, request):
        form = SignInSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        username = form.validated_data["username"]
        if throttles.is_locked(username):
            return Response(
                {"detail": "Too many attempts for this account. Wait a while, then try again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        user = authenticate(request, username=username, password=form.validated_data["password"])
        # One answer for every failure, so the form can't be used to find out
        # which account names exist or which of them are staff.
        if user is None or not user.is_staff:
            throttles.record_failure(username)
            return Response(
                {"detail": "That account name and password don't match a Studio account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        throttles.clear_failures(username)
        # Sessions that have run out are cleared as new ones begin.
        EditorSession.objects.filter(expires_at__lte=timezone.now()).delete()
        session, token = EditorSession.start(user, request.headers.get("User-Agent", ""))
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        return Response(
            {"token": token, "expires_at": session.expires_at, "user": user_payload(user)}
        )


class SignOutView(APIView):
    authentication_classes = [EditorTokenAuthentication]
    permission_classes = [IsStudioEditor]

    @extend_schema(summary="Sign out of the Studio", request=None, responses={204: None})
    def post(self, request):
        if isinstance(request.auth, EditorSession):
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    authentication_classes = [EditorTokenAuthentication]
    permission_classes = [IsStudioEditor]

    @extend_schema(summary="The signed-in editor")
    def get(self, request):
        return Response(user_payload(request.user))


class DashboardView(APIView):
    """What needs attention, and what changed lately."""

    authentication_classes = [EditorTokenAuthentication]
    permission_classes = [IsStudioEditor]

    @extend_schema(summary="Studio dashboard")
    def get(self, request):
        now = timezone.now()
        items = ContentItem.objects.all()
        published = items.filter(status=Status.PUBLISHED)
        live_with_dead_video = (
            published.filter(videos__video__availability=Availability.UNAVAILABLE)
            .distinct()
            .count()
        )
        slides_used_photo_ids = HeroSlide.objects.filter(is_active=True).values("image")
        missing_alt = MediaAsset.objects.filter(alt_text="", pk__in=slides_used_photo_ids)

        warnings = []
        if not HeroSlide.objects.filter(is_active=True).exists():
            warnings.append(
                {
                    "level": "info",
                    "text": "No hero slides are switched on, so the home page shows "
                    "its built-in photos.",
                    "href": "/studio/home/slides",
                }
            )
        if not Gallery.objects.filter(is_featured=True).exists():
            warnings.append(
                {
                    "level": "info",
                    "text": "No gallery is on the home page, so it shows the built-in one.",
                    "href": "/studio/home/galleries",
                }
            )
        if live_with_dead_video:
            warnings.append(
                {
                    "level": "danger",
                    "text": f"{live_with_dead_video} published item(s) play a video that "
                    "has been deleted on YouTube.",
                    "href": "/studio/archive?state=published&dead_video=1",
                }
            )
        if missing_alt.exists():
            warnings.append(
                {
                    "level": "warning",
                    "text": f"{missing_alt.count()} hero photo(s) have no description "
                    "for people who can't see them.",
                    "href": "/studio/media?missing_alt=1",
                }
            )

        return Response(
            {
                "counts": {
                    "drafts": items.exclude(status=Status.PUBLISHED).count(),
                    "needs_review": items.filter(needs_review=True).count(),
                    "published": published.exclude(published_at__gt=now).count(),
                    "scheduled": published.filter(published_at__gt=now).count(),
                    "photos": MediaAsset.objects.count(),
                    "videos": Video.objects.count(),
                    "dead_videos": Video.objects.filter(
                        availability=Availability.UNAVAILABLE
                    ).count(),
                    "slides": HeroSlide.objects.filter(is_active=True).count(),
                },
                "by_kind": {
                    kind: {
                        "published": published.filter(kind=kind).count(),
                        "drafts": items.filter(kind=kind).exclude(status=Status.PUBLISHED).count(),
                    }
                    for kind in Kind.values
                },
                "warnings": warnings,
                "recent": RevisionSerializer(
                    visible_revisions(
                        request.user, Revision.objects.select_related("user", "content_type")
                    )[:12],
                    many=True,
                ).data,
            }
        )


class TaxonomyView(APIView):
    """Everything the archive editor's pickers offer, in one read."""

    authentication_classes = [EditorTokenAuthentication]
    permission_classes = [IsStudioEditor]

    @extend_schema(summary="Choices for the archive editor")
    def get(self, request):
        return Response(
            {
                "kinds": choices(Kind),
                "categories": list(
                    Category.objects.filter(is_active=True).values("id", "name")
                ),
                "regions": list(Region.objects.values("id", "name")),
                "series": list(Series.objects.filter(is_active=True).values("id", "title")),
                "date_sources": choices(DateSource),
                "date_precisions": choices(DatePrecision),
            }
        )
