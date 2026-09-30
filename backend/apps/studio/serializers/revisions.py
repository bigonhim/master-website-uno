from rest_framework import serializers

from ..models import Revision


class RevisionSerializer(serializers.ModelSerializer):
    model = serializers.SerializerMethodField()
    action_label = serializers.CharField(source="get_action_display", read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = Revision
        fields = [
            "id",
            "model",
            "object_id",
            "object_repr",
            "action",
            "action_label",
            "changed_fields",
            "user",
            "created_at",
        ]
        read_only_fields = fields

    def get_model(self, obj) -> str:
        ct = obj.content_type
        return f"{ct.app_label}.{ct.model}"

    def get_user(self, obj) -> str:
        user = obj.user
        return (user.get_full_name() or user.get_username()) if user else "Someone"


class RevisionDetailSerializer(RevisionSerializer):
    class Meta(RevisionSerializer.Meta):
        fields = RevisionSerializer.Meta.fields + ["data"]
        read_only_fields = fields
