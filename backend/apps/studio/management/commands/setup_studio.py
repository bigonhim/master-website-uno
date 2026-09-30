"""
Sets up who can use the Studio.

Creates (or refreshes) an "Editors" group holding everything needed for
everyday editing: the archive, videos, photos, the home page and the site's
words. Deleting archive items is left out on purpose; that stays with
superusers. With --user, that account is made staff and put in the group.

    python manage.py setup_studio --user grace
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

GROUP = "Editors"

# (app_label, model, actions)
GRANTS = [
    ("content", "contentitem", ("view", "add", "change")),
    ("content", "video", ("view", "add", "change", "delete")),
    ("content", "category", ("view",)),
    ("content", "region", ("view",)),
    ("content", "series", ("view",)),
    ("media", "mediaasset", ("view", "add", "change", "delete")),
    ("sitecontent", "heroslide", ("view", "add", "change", "delete")),
    ("sitecontent", "gallery", ("view", "add", "change", "delete")),
    ("sitecontent", "sitesection", ("view", "change")),
]


class Command(BaseCommand):
    help = 'Create the Studio "Editors" group; optionally add a user to it.'

    def add_arguments(self, parser):
        parser.add_argument("--user", help="Username to make staff and add to Editors.")

    def handle(self, *args, **options):
        query = Q(pk__in=[])
        for app_label, model, actions in GRANTS:
            query |= Q(
                content_type__app_label=app_label,
                codename__in=[f"{a}_{model}" for a in actions],
            )
        perms = Permission.objects.filter(query)
        expected = sum(len(actions) for _, _, actions in GRANTS)
        if perms.count() != expected:
            raise CommandError("Some permissions are missing. Run `manage.py migrate` first.")

        group, created = Group.objects.get_or_create(name=GROUP)
        group.permissions.set(perms)
        self.stdout.write(
            self.style.SUCCESS(f"{'Created' if created else 'Updated'} the {GROUP} group.")
        )

        if username := options.get("user"):
            User = get_user_model()
            try:
                user = User.objects.get(**{User.USERNAME_FIELD: username})
            except User.DoesNotExist:
                raise CommandError(f"No user named {username!r}.") from None
            user.is_staff = True
            user.save(update_fields=["is_staff"])
            user.groups.add(group)
            self.stdout.write(self.style.SUCCESS(f"{username} can now use the Studio."))
