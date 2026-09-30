from django.utils.cache import patch_cache_control
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .public import site_payload


class SiteContentView(APIView):
    """Everything the site shows that the Studio edits, in one read.

    One request rather than one per section: the home page needs nearly all of
    it, and the layout needs the contact details on every page.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(summary="Site content edited in the Studio")
    def get(self, request):
        response = Response(site_payload())
        # Short: the Studio also revalidates the site's cache on every save, so
        # this only bounds how stale a page can be if that signal is lost.
        patch_cache_control(response, public=True, max_age=60, stale_while_revalidate=86400)
        return response
