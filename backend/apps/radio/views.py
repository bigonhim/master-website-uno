from django.utils.cache import patch_cache_control
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import CACHE_SECONDS, get_primary_station, get_radio_status


class RadioStatusView(APIView):
    """Current station state.

    Always returns HTTP 200. Off air is a state the player renders, not an
    error the client has to handle — and the station has been off air since
    March 2023, so it is the normal case.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "radio"

    @extend_schema(
        summary="Radio station status",
        description=(
            "Returns live/offline/unknown with now-playing metadata. "
            "`now_playing` is null when nothing is playing. Always 200."
        ),
        responses={200: dict},
    )
    def get(self, request):
        payload = get_radio_status(get_primary_station())
        response = Response(payload)
        patch_cache_control(
            response,
            public=True,
            max_age=CACHE_SECONDS,
            stale_while_revalidate=60,
        )
        return response
