from .dev import *  # noqa: F403

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Django's test client requests arrive as host "testserver". Allowed here only,
# never in dev or prod, so the real ALLOWED_HOSTS stays honest.
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

# Keep the suite off the network: the radio service talks to radio.co, and a
# test that depends on a third party is a test that fails for the wrong reason.
RADIO_STATUS_URL = "http://localhost:0/status"
