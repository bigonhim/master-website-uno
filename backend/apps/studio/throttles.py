"""
Limits on guessing a Studio password.

Failed sign-ins are counted per account name, not per address: every request
reaches Django from the site's own server, so the caller's address is the
same for everyone. After ten failures in fifteen minutes the account refuses
sign-ins until the window passes. A successful sign-in clears the count, and
only failures are counted, so an editor signing in often is never stopped.

Someone who knows an account name can still hold it shut by failing on
purpose, for fifteen minutes at a time; that is the price of stopping a
password being guessed from many addresses at once.

The counts live in Django's cache. With several server processes, set
CACHE_URL to a shared cache (see settings) so they are counted together.
"""

import hashlib

from django.core.cache import cache

FAILURE_LIMIT = 10
WINDOW_SECONDS = 15 * 60


def _key(username: str) -> str:
    name = str(username).strip().lower()[:150]
    return "studio-signin-failures:" + hashlib.sha256(name.encode()).hexdigest()


def is_locked(username: str) -> bool:
    return cache.get(_key(username), 0) >= FAILURE_LIMIT


def record_failure(username: str) -> None:
    key = _key(username)
    cache.add(key, 0, WINDOW_SECONDS)
    try:
        cache.incr(key)
    except ValueError:  # expired between the two calls
        cache.set(key, 1, WINDOW_SECONDS)


def clear_failures(username: str) -> None:
    cache.delete(_key(username))
