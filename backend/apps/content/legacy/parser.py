"""
Parser for the legacy WebAcappella homepage.

Deliberately free of Django imports so it can be unit-tested against a committed
HTML fixture with no database and no network.

Three facts about the source shape everything here, all measured against the
frozen snapshot rather than assumed:

1. Only `index.html` carries content. The ~40 `crbst_N.html` pages each repeat
   the same five Translations-menu videos and nothing else.
2. A title is split across several sibling divs, one per rendered LINE, each
   wrapping the same anchor. Reading one div per item yields fragments like
   "AND THE EARTH" and is the classic way to get this wrong.
3. Some captions have no anchor at all; their video is linked from a nearby
   image instead. Those are recovered by look-back and flagged for review.
"""

from __future__ import annotations

import html
import re
import unicodedata
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

# The Translations dropdown, repeated on every page. Not content.
NAV_VIDEO_IDS = frozenset(
    {"bJPOs5i5rMI", "icfkgPCMo30", "gw9YVbZkYf4", "ovW-cD90D4Q", "MyIsLGGrV2s"}
)

VIDEO_ID_RE = re.compile(r"youtube\.com/watch\?v=([A-Za-z0-9_-]{11})")
SHORT_ID_RE = re.compile(r"youtu\.be/([A-Za-z0-9_-]{11})")
ORDINAL_RE = re.compile(r"^\s*(\d{1,3})\s*[\).]\s*")
LABEL_RE = re.compile(r"^\s*(?:video|watch|part)\s*\d+\s*$", re.I)
CLICK_TO_WATCH_RE = re.compile(r"[-–—]?\s*click\s+to\s+(?:watch|view)\s*!?\s*$", re.I)
SPEAKER_RE = re.compile(r"\s*[-–—]\s*(?:by\s+)?(prophet\s+)?dr\.?\s*owuor\s*$", re.I)
EXTENSION_RE = re.compile(r"\.(mp4|vob|wmv|flv|avi)\s*$", re.I)
KICKER_RE = re.compile(
    r"^\s*(BREAKING NEWS|PROPHECY ALERT|NEW|LATEST|UPDATE|URGENT)\s*[:!\-–—]\s*", re.I
)

# Words that must never be title-cased. Getting "LORD" wrong across hundreds of
# prophecies is a reputational problem, not a cosmetic one, so this list is
# signed off by the client before an import runs.
PROTECTED = frozenset(
    {
        "LORD",
        "GOD",
        "GOD'S",
        "JESUS",
        "CHRIST",
        "MESSIAH",
        "YAHWEH",
        "JEHOVAH",
        "HOLY",
        "SPIRIT",
        "I",
        "AM",
        "HIV",
        "AIDS",
        "TB",
        "US",
        "USA",
        "UK",
        "UAE",
        "DRC",
        "UN",
        "WHO",
        "ICC",
        "II",
        "III",
        "IV",
        "V",
        "VI",
    }
)

MINOR_WORDS = frozenset(
    {
        "a",
        "an",
        "and",
        "as",
        "at",
        "but",
        "by",
        "for",
        "in",
        "of",
        "on",
        "or",
        "the",
        "to",
        "with",
        "from",
        "into",
        "over",
        "upon",
        "&",
    }
)

# Ordered most-specific first: a generic PROPHEC* match would otherwise swallow
# most of the archive before the precise rules ever run.
CLASSIFIER_RULES: list[tuple[str, str | None, re.Pattern[str], float]] = [
    (
        "healing",
        "testimony",
        re.compile(
            r"cripple|blind eye|deaf|dumb|hiv|aids|cancer|wheelchair|walked away|healed",
            re.I,
        ),
        0.75,
    ),
    (
        "prophecy",
        "fulfilled",
        re.compile(r"fulfil(?:l)?(?:ed|ment)|came to pass|accurately fulfilled", re.I),
        0.90,
    ),
    (
        "prophecy",
        "vision",
        re.compile(r"\bvision of\b|visitation|revelation of", re.I),
        0.80,
    ),
    (
        "prophecy",
        "judgement",
        re.compile(
            r"earthquake|quake|flood|fire|storm|hurricane|tsunami|drought|volcano|wrath|judgment",
            re.I,
        ),
        0.75,
    ),
    (
        "prophecy",
        "rapture",
        re.compile(
            r"rapture|messiah|snatching away|second coming|end of the age", re.I
        ),
        0.80,
    ),
    (
        "prophecy",
        "service",
        re.compile(r"healing service|conference|crusade|expo|meeting|revival in", re.I),
        0.70,
    ),
    ("prophecy", None, re.compile(r"prophec(?:y|ies)|prophesie|prophetic", re.I), 0.60),
    (
        "teaching",
        None,
        re.compile(
            r"sermon|teaching|message|preach|holiness|repentance|righteousness", re.I
        ),
        0.50,
    ),
]


@dataclass
class ParsedItem:
    """One archive entry, before it becomes a database row."""

    title_source: str
    video_ids: list[str]
    labels: list[str] = field(default_factory=list)
    ordinal: int | None = None
    kicker: str = ""
    speaker: str = ""
    needs_review: bool = False
    review_reason: str = ""


def extract_video_id(href: str) -> str | None:
    match = VIDEO_ID_RE.search(href) or SHORT_ID_RE.search(href)
    return match.group(1) if match else None


def clean_text(raw: str) -> str:
    """Unescape entities, normalise unicode, collapse whitespace."""
    text = html.unescape(raw)
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def is_shouting(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return False
    return sum(c.isupper() for c in letters) / len(letters) > 0.8


def smart_title(text: str) -> str:
    """Case-fold ALL-CAPS titles while protecting divine names and acronyms."""
    if not is_shouting(text):
        return text

    words = []
    for index, word in enumerate(text.split()):
        core = word.strip(".,:;!?()\"'")
        if not core:
            words.append(word)
        elif core.upper() in PROTECTED:
            words.append(word.replace(core, core.upper()))
        elif "/" in core:  # HIV/AIDS
            parts = [
                p.upper() if p.upper() in PROTECTED else p.capitalize()
                for p in core.split("/")
            ]
            words.append(word.replace(core, "/".join(parts)))
        elif core.lower() in MINOR_WORDS and index > 0:
            words.append(word.lower())
        else:
            words.append(word.replace(core, core.capitalize()))
    return " ".join(words)


def normalise_title(raw: str) -> tuple[str, str, str, int | None]:
    """Return (display_title, kicker, speaker, ordinal).

    The raw string is never discarded — the caller keeps it as `title_source`.
    """
    text = clean_text(raw)
    text = CLICK_TO_WATCH_RE.sub("", text).strip()

    kicker = ""
    kicker_match = KICKER_RE.match(text)
    if kicker_match:
        kicker = kicker_match.group(1).title()
        text = KICKER_RE.sub("", text).strip()

    ordinal = None
    ordinal_match = ORDINAL_RE.match(text)
    if ordinal_match:
        ordinal = int(ordinal_match.group(1))
        text = ORDINAL_RE.sub("", text).strip()

    speaker = ""
    if SPEAKER_RE.search(text):
        speaker = "Prophet Dr. Owuor"
        text = SPEAKER_RE.sub("", text).strip()

    text = EXTENSION_RE.sub("", text).strip()
    text = smart_title(text).strip(" -,–—")
    return text, kicker, speaker, ordinal


def classify(title: str) -> tuple[str, str | None, float]:
    """Return (kind, subcategory, confidence).

    Honest about its own limits: an item announcing an upcoming healing service
    is an event, not a testimony, so "coming to"/"upcoming" suppresses the
    healing rule. Everything below 0.8 is queued for a human.
    """
    lowered = title.lower()
    announces_future = bool(re.search(r"coming to|upcoming|will be held", lowered))

    for kind, subcategory, pattern, confidence in CLASSIFIER_RULES:
        if not pattern.search(title):
            continue
        if kind == "healing" and announces_future:
            continue  # an announcement, not a testimony
        return kind, subcategory, confidence

    return "prophecy", None, 0.0


def parse_homepage(markup: str) -> list[ParsedItem]:
    """Extract archive entries from the legacy homepage."""
    soup = BeautifulSoup(markup, "lxml")
    divs = soup.find_all("div", attrs={"align": "left"})

    nodes = []
    for index, div in enumerate(divs):
        anchors = [
            a for a in div.find_all("a", href=True) if extract_video_id(a["href"])
        ]
        ids = [extract_video_id(a["href"]) for a in anchors]
        ids = [i for i in ids if i and i not in NAV_VIDEO_IDS]
        nodes.append(
            {
                "index": index,
                "ids": ids,
                "anchor_texts": [clean_text(a.get_text(" ")) for a in anchors],
                "text": clean_text(div.get_text(" ")),
            }
        )

    items: list[ParsedItem] = []
    current: ParsedItem | None = None
    current_last_index = -1

    for node in nodes:
        if not node["ids"]:
            current = None  # a caption-less div breaks the run
            continue

        unique_ids = set(node["ids"])
        labelled = node["anchor_texts"] and all(
            LABEL_RE.fullmatch(t) for t in node["anchor_texts"] if t
        )

        # One item owning several videos: "Video 1, Video 2, Video 3".
        if labelled and len(unique_ids) > 1:
            title = _preceding_caption(nodes, node["index"])
            display, kicker, speaker, ordinal = normalise_title(title)
            items.append(
                ParsedItem(
                    title_source=title,
                    video_ids=list(dict.fromkeys(node["ids"])),
                    labels=node["anchor_texts"],
                    ordinal=ordinal,
                    kicker=kicker,
                    speaker=speaker,
                    needs_review=not display,
                    review_reason="multi-video row; title taken from preceding div",
                )
            )
            current = None
            continue

        video_id = node["ids"][0]
        starts_new_number = bool(ORDINAL_RE.match(node["text"]))
        contiguous = (
            current is not None
            and current.video_ids[0] == video_id
            and node["index"] == current_last_index + 1
        )

        # A fresh ordinal always starts a new entry, even on the same video —
        # the source genuinely reuses one video for two numbered events.
        if contiguous and not (starts_new_number and current.ordinal is not None):
            current.title_source = f"{current.title_source} {node['text']}".strip()
            current_last_index = node["index"]
        else:
            # Capture the ordinal now, not in the second pass. The restart guard
            # above reads `current.ordinal`, so leaving it None until later means
            # the guard never fires and two numbered entries sharing one video
            # get silently concatenated.
            ordinal_match = ORDINAL_RE.match(node["text"])
            current = ParsedItem(
                title_source=node["text"],
                video_ids=[video_id],
                ordinal=int(ordinal_match.group(1)) if ordinal_match else None,
            )
            items.append(current)
            current_last_index = node["index"]

    # Second pass: apply normalisation now that fragments are joined.
    finalised: list[ParsedItem] = []
    for item in items:
        display, kicker, speaker, ordinal = normalise_title(item.title_source)
        item.kicker = item.kicker or kicker
        item.speaker = item.speaker or speaker
        item.ordinal = item.ordinal if item.ordinal is not None else ordinal
        if not display or len(display) < 6:
            item.needs_review = True
            item.review_reason = item.review_reason or "title too short after cleaning"
        finalised.append(item)

    return finalised


def _preceding_caption(nodes: list[dict], index: int) -> str:
    """Walk back to the nearest link-free caption div."""
    for node in reversed(nodes[:index]):
        if not node["ids"] and len(node["text"]) > 12:
            return node["text"]
    return ""


def find_orphan_ids(markup: str, claimed: set[str]) -> list[str]:
    """Video IDs present in the page but not captured by any caption group.

    These are linked from images rather than text. They are recoverable, but
    never silently — every one is flagged for a human.
    """
    all_ids = set(VIDEO_ID_RE.findall(markup)) | set(SHORT_ID_RE.findall(markup))
    return sorted(all_ids - claimed - NAV_VIDEO_IDS)
