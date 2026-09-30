from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.account import DashboardView, MeView, SignInView, SignOutView, TaxonomyView
from .views.items import ItemViewSet
from .views.media import MediaAssetViewSet
from .views.revisions import RevisionViewSet
from .views.site import GalleryViewSet, HeroSlideViewSet, SectionViewSet
from .views.videos import VideoViewSet

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("media", MediaAssetViewSet, basename="studio-media")
router.register("videos", VideoViewSet, basename="studio-video")
router.register("items", ItemViewSet, basename="studio-item")
router.register("slides", HeroSlideViewSet, basename="studio-slide")
router.register("galleries", GalleryViewSet, basename="studio-gallery")
router.register("sections", SectionViewSet, basename="studio-section")
router.register("revisions", RevisionViewSet, basename="studio-revision")

urlpatterns = [
    path("auth/login/", SignInView.as_view(), name="studio-login"),
    path("auth/logout/", SignOutView.as_view(), name="studio-logout"),
    path("auth/me/", MeView.as_view(), name="studio-me"),
    path("dashboard/", DashboardView.as_view(), name="studio-dashboard"),
    path("taxonomy/", TaxonomyView.as_view(), name="studio-taxonomy"),
    path("", include(router.urls)),
]
