from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    """Accepts only what a visitor may set. The office's workflow fields are
    not writable from the public endpoint and are not declared here."""

    # Bots fill hidden fields; people cannot see them.
    honeypot = serializers.CharField(
        required=False, allow_blank=True, write_only=True, max_length=0
    )

    class Meta:
        model = ContactMessage
        fields = ["id", "topic", "name", "email", "phone", "message", "honeypot"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "topic": {"required": False},
            "phone": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        attrs.pop("honeypot", None)
        return attrs
