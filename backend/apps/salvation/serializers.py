from django.utils import timezone
from rest_framework import serializers

from .models import SalvationDecision

CONSENT_TEXT_VERSION = "2026-09-v1"


class SalvationDecisionSerializer(serializers.ModelSerializer):
    """Accepts only what a visitor may set. Staff workflow fields are not
    writable from the public endpoint and are not even declared here."""

    # Bots fill hidden fields; people cannot see them.
    honeypot = serializers.CharField(
        required=False, allow_blank=True, write_only=True, max_length=0
    )

    class Meta:
        model = SalvationDecision
        fields = [
            "id",
            "decision",
            "name",
            "email",
            "phone",
            "country",
            "message",
            "reason",
            "language",
            "step_reached",
            "referral_path",
            "wants_follow_up",
            "honeypot",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "email": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
            "message": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        attrs.pop("honeypot", None)
        if attrs.get("wants_follow_up") and not (
            attrs.get("email") or attrs.get("phone")
        ):
            raise serializers.ValidationError(
                {"email": "Add an email address or phone number so we can reply."}
            )
        return attrs

    def create(self, validated_data):
        if validated_data.get("wants_follow_up"):
            validated_data["consent_text_version"] = CONSENT_TEXT_VERSION
            validated_data["consented_at"] = timezone.now()
        return super().create(validated_data)
