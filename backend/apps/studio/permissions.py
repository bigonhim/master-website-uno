"""
Who may do what in the Studio.

Two gates. The account must be staff to use the Studio at all; then Django's
own model permissions decide each action, so a volunteer can be trusted with
the archive without being trusted with the contact details. Superusers pass
every check. `manage.py setup_studio` creates an "Editors" group that holds
the everyday permissions.
"""

from rest_framework.permissions import BasePermission, DjangoModelPermissions


class IsStudioEditor(BasePermission):
    message = "This account can't use the Studio."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.is_staff)


class StudioModelPermissions(DjangoModelPermissions):
    """Model permissions, with reading gated too (DRF lets any signed-in user
    read by default), and with custom actions mapped to the permission they
    really exercise: publishing is a change, not an addition.

    A view sets `action_perms = {"publish": "change"}` to map its actions.
    """

    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }

    def has_permission(self, request, view):
        if not IsStudioEditor().has_permission(request, view):
            return False
        verb = getattr(view, "action_perms", {}).get(getattr(view, "action", None))
        if verb:
            model = self._queryset(view).model
            return request.user.has_perm(
                f"{model._meta.app_label}.{verb}_{model._meta.model_name}"
            )
        return super().has_permission(request, view)


def can(user, verb: str, model) -> bool:
    return user.has_perm(f"{model._meta.app_label}.{verb}_{model._meta.model_name}")
