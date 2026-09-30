"""
The editable words of the site: what each section's fields are, how long they
may run, and what they say until an editor changes them.

This file is the one place a section is defined. The Studio builds its forms
from it, the API validates against it, and the site falls back to the defaults
below whenever a section has not been edited. The defaults are the site's own
copy, verbatim; keep them so. The frontend carries a copy of them for the rare
moment the API cannot be reached (frontend/lib/site/defaults.json, written by
`manage.py export_site_defaults`), and a test fails if the two drift apart.

Links and icons are not editable here on purpose: they are wiring, and a typo
in one breaks the page rather than misspelling it.

Markup, where a field allows it (`markup=True`):
    **words**  set in the section's highlight (yellow on blue)
    *words*    set in its accent (cyan on blue)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from django.core.exceptions import ValidationError
from django.core.validators import validate_email


@dataclass(frozen=True)
class Field:
    name: str
    label: str
    kind: str = "text"  # text | textarea | phone | email | items
    max_length: int = 200
    required: bool = True
    help: str = ""
    markup: bool = False
    item_fields: tuple[Field, ...] = ()
    count: int = 0  # items: how many there must be

    def schema(self) -> dict:
        out = {
            "name": self.name,
            "label": self.label,
            "kind": self.kind,
            "max_length": self.max_length,
            "required": self.required,
            "help": self.help,
            "markup": self.markup,
        }
        if self.kind == "items":
            out["count"] = self.count
            out["item_fields"] = [f.schema() for f in self.item_fields]
        return out


@dataclass(frozen=True)
class Section:
    key: str
    label: str
    group: str
    description: str
    fields: tuple[Field, ...]
    default: dict = field(default_factory=dict)
    # Where the section appears, so the Studio can open the page beside it.
    page: str = "/"

    def schema(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "group": self.group,
            "description": self.description,
            "page": self.page,
            "fields": [f.schema() for f in self.fields],
        }


PARAGRAPHS = "Leave an empty line between paragraphs."
MARKUP = "Wrap words in **double stars** for yellow, *single stars* for cyan."

SECTIONS_LIST: list[Section] = [
    Section(
        key="contact",
        label="Contact details",
        group="Site-wide",
        page="/contact",
        description="The numbers and address in the footer of every page and on "
        "the contact page. Only publish details the ministry answers.",
        fields=(
            Field("whatsapp", "WhatsApp number", kind="phone", max_length=40),
            Field("phone_1", "First phone number", kind="phone", max_length=40),
            Field("phone_2", "Second phone number", kind="phone", max_length=40, required=False),
            Field("email", "Email address", kind="email", max_length=120),
            Field("place", "Where the ministry is", max_length=120),
        ),
        default={
            "whatsapp": "+254 715 276091",
            "phone_1": "+254 715 276091",
            "phone_2": "+254 708 412344",
            "email": "repentoffice@gmail.com",
            "place": "Nakuru & Nairobi, Kenya",
        },
    ),
    Section(
        key="home_hero",
        label="The call",
        group="Home page",
        description="The words over the photos at the top of the home page.",
        fields=(
            Field("eyebrow", "Scripture reference", max_length=40),
            Field("line_1", "First line", max_length=24),
            Field("line_2", "Second line", max_length=24),
            Field("accent", "Cyan line", max_length=24),
            Field("highlight", "Yellow block", max_length=24),
            Field("quote", "Quotation", kind="textarea", max_length=200,
                  help="Shown in quotation marks; don't type them."),
            Field("button", "Button", max_length=40,
                  help="Opens the Salvation Prayer."),
            Field("link", "Link beside the button", max_length=40,
                  help="Opens the prophecies archive."),
        ),
        default={
            "eyebrow": "Revelation 16:15",
            "line_1": "Prepare",
            "line_2": "the way",
            "accent": "The Messiah",
            "highlight": "is coming",
            "quote": "Behold, I come as a thief. Blessed is he that watcheth.",
            "button": "The Salvation Prayer",
            "link": "Browse the archive",
        },
    ),
    Section(
        key="about_intro",
        label="About the ministry",
        group="Home page",
        description="The introduction, vision and mission below the photos.",
        fields=(
            Field("eyebrow", "Label", max_length=40),
            Field("heading", "Heading", max_length=120),
            Field("intro", "Introduction", kind="textarea", max_length=800),
            Field("vision_accent", "Vision: cyan line", max_length=40),
            Field("vision_highlight", "Vision: yellow block", max_length=40),
            Field("vision_text", "Vision: text", kind="textarea", max_length=300),
            Field("mission_heading", "Mission: heading", kind="textarea", max_length=160),
            Field("mission_text", "Mission: text", kind="textarea", max_length=500),
        ),
        default={
            "eyebrow": "About us",
            "heading": "The Ministry of Repentance and Holiness",
            "intro": "The Ministry of Repentance and Holiness was founded in 2005 and "
            "is led by Prophet Dr. David Edward Owuor. It is a global end-time "
            "ministry mandated by THE LORD GOD OF ISRAEL to prepare the nations "
            "for the imminent and glorious coming of THE LORD JESUS CHRIST.",
            "vision_accent": "The Messiah",
            "vision_highlight": "is coming",
            "vision_text": "This vision stands as the divine alarm to the nations and "
            "the central message of the ministry.",
            "mission_heading": "Preparing the Way for the glorious coming of the Messiah.",
            "mission_text": "Through powerful preaching, revival meetings, healing "
            "services, conferences and global broadcasts, the ministry calls the "
            "world to repentance, holiness and readiness for the return of THE "
            "LORD JESUS CHRIST.",
        },
    ),
    Section(
        key="about_pillars",
        label="Who we are & the leadership",
        group="Home page",
        description="The two cards about the ministry and its leadership, in the "
        "ministry's own words.",
        fields=(
            Field("who_title", "First card: heading", max_length=60),
            Field("who_body", "First card: text", kind="textarea", max_length=1500,
                  help=PARAGRAPHS),
            Field("leader_title", "Second card: heading", max_length=60),
            Field("leader_name", "Second card: name plate", max_length=120, required=False),
            Field("leader_body", "Second card: text", kind="textarea", max_length=1500,
                  help=PARAGRAPHS),
        ),
        default={
            "who_title": "Who we are",
            "who_body": "The Ministry of Repentance and Holiness is a prophetic ministry "
            "raised to awaken the Church to the urgency of repentance and holy "
            "living. It proclaims that salvation is found only through the finished "
            "work of the Cross and that a holy life is the evidence of true "
            "redemption.\n\nThe ministry stands firmly on the authority of the Holy "
            "Scriptures and teaches uncompromising obedience to the Word of GOD as "
            "the only way to prepare for the Kingdom of Heaven.",
            "leader_title": "The leadership",
            "leader_name": "Prophet Dr. David Edward Owuor",
            "leader_body": "The ministry is led by Prophet Dr. David Edward Owuor, the "
            "Servant of THE LORD, sent to restore repentance and holiness in the "
            "Church and to prepare the way for the coming of the Messiah.\n\nHis "
            "calling is centred on obedience to the voice of THE LORD GOD OF ISRAEL "
            "and the proclamation of righteousness, holiness and repentance, "
            "pointing all glory to GOD alone.",
        },
    ),
    Section(
        key="home_message",
        label="The message",
        group="Home page",
        description="Repent. Be holy. Prepare. The three cards and their scriptures.",
        fields=(
            Field("eyebrow", "Label", max_length=40),
            Field("heading", "Heading", max_length=80),
            Field("intro", "Introduction", kind="textarea", max_length=300),
            Field(
                "pillars",
                "Cards",
                kind="items",
                count=3,
                help="Each card keeps its icon and where its link goes.",
                item_fields=(
                    Field("title", "Heading", max_length=40),
                    Field("quote", "Scripture", kind="textarea", max_length=240,
                          help="Shown in quotation marks; don't type them."),
                    Field("reference", "Reference", max_length=40),
                    Field("body", "Text", kind="textarea", max_length=300),
                    Field("link", "Link text", max_length=60),
                ),
            ),
        ),
        default={
            "eyebrow": "The message",
            "heading": "Repent. Be holy. Prepare.",
            "intro": "Everything in this archive comes back to one call, given again "
            "and again across two decades of preaching.",
            "pillars": [
                {
                    "title": "Repent",
                    "quote": "Repent ye therefore, and be converted, that your sins "
                    "may be blotted out.",
                    "reference": "Acts 3:19",
                    "body": "Turning from sin is where every walk with God begins. It "
                    "is not a feeling but a decision, made before Him.",
                    "link": "Pray the Salvation Prayer",
                },
                {
                    "title": "Be holy",
                    "quote": "Because it is written, Be ye holy; for I am holy.",
                    "reference": "1 Peter 1:16",
                    "body": "Holiness is the life that follows repentance: set apart "
                    "in word, in conduct and in what we allow into our hearts.",
                    "link": "Hear the teachings",
                },
                {
                    "title": "Prepare",
                    "quote": "Prepare to meet thy God.",
                    "reference": "Amos 4:12",
                    "body": "The ministry exists to call the nations to be ready for "
                    "the coming of the Messiah, like wise virgins with oil in their "
                    "lamps.",
                    "link": "Read the prophecies",
                },
            ],
        },
    ),
    Section(
        key="home_scripture",
        label="Scripture band",
        group="Home page",
        description="The verse on the blue band near the foot of the home page.",
        fields=(
            Field("reference", "Reference", max_length=40),
            Field("verse", "Verse", kind="textarea", max_length=300, markup=True, help=MARKUP),
            Field("button_1", "Yellow button", max_length=40,
                  help="Opens the teachings."),
            Field("button_2", "Second button", max_length=40,
                  help="Opens the Salvation Prayer."),
        ),
        default={
            "reference": "Hebrews 12:14",
            "verse": "*Follow* peace with all men, and **holiness**, without which no "
            "man shall **see the Lord**.",
            "button_1": "Teachings on holiness",
            "button_2": "Begin with prayer",
        },
    ),
    Section(
        key="home_radio",
        label="Radio panel",
        group="Home page",
        description="The panel inviting visitors to listen to the station.",
        fields=(
            Field("eyebrow", "Station name", max_length=60),
            Field("heading", "Heading", max_length=80),
            Field("body", "Text", kind="textarea", max_length=300),
            Field("button", "Button", max_length=30),
        ),
        default={
            "eyebrow": "Jesus is LORD Radio",
            "heading": "Preparing the way, around the clock",
            "body": "The ministry broadcasts from Nakuru. When the station is on air "
            "you can listen from the bar at the top of any page, and it keeps "
            "playing while you read.",
            "button": "Listen live",
        },
    ),
]

SECTIONS: dict[str, Section] = {s.key: s for s in SECTIONS_LIST}

PHONE = re.compile(r"^\+?[\d\s().-]+$")


def _clean_value(f: Field, value, path: str, errors: dict) -> object:
    if f.kind == "items":
        if not isinstance(value, list) or len(value) != f.count:
            errors[path] = [f"Exactly {f.count} are needed."]
            return []
        items = []
        for index, item in enumerate(value):
            if not isinstance(item, dict):
                errors[f"{path}.{index}"] = ["Not a valid entry."]
                continue
            items.append(
                {
                    sub.name: _clean_value(
                        sub, item.get(sub.name, ""), f"{path}.{index}.{sub.name}", errors
                    )
                    for sub in f.item_fields
                }
            )
        return items

    if value is None:
        value = ""
    if not isinstance(value, str):
        errors[path] = ["Must be text."]
        return ""
    # Windows line endings from a pasted document would count double.
    value = value.replace("\r\n", "\n").replace("\r", "\n").strip()
    if f.kind == "textarea":
        # At most one empty line between paragraphs.
        value = re.sub(r"\n{3,}", "\n\n", value)
    else:
        # Ordinary spaces only: a non-breaking space ("THE LORD") is kept,
        # because it is there to stop a line breaking in the wrong place.
        value = re.sub(r"[ \t\n]+", " ", value)

    if not value:
        if f.required:
            errors[path] = ["This can't be empty."]
        return ""
    if len(value) > f.max_length:
        errors[path] = [f"Keep this to {f.max_length} characters (it has {len(value)})."]
    elif f.kind == "phone":
        if not PHONE.match(value) or sum(c.isdigit() for c in value) < 7:
            errors[path] = ["Enter a phone number, e.g. +254 715 276091."]
    elif f.kind == "email":
        try:
            validate_email(value)
        except ValidationError:
            errors[path] = ["Enter an email address."]
    return value


def clean_section(section: Section, data) -> tuple[dict, dict]:
    """Returns (cleaned data, errors keyed by dotted field path)."""
    if not isinstance(data, dict):
        return {}, {"data": ["Expected the section's fields."]}
    errors: dict[str, list[str]] = {}
    cleaned = {
        f.name: _clean_value(f, data.get(f.name, section.default.get(f.name)), f.name, errors)
        for f in section.fields
    }
    return cleaned, errors


def merged(section: Section, stored: dict | None) -> dict:
    """What the site shows: stored words over the defaults, so a field added to
    a section later is never missing from a section edited before it."""
    data = {**section.default}
    if stored:
        data.update({k: v for k, v in stored.items() if k in data})
    return data
