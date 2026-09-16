"""
Seed the curated facet axes.

The Region gazetteer is not decoration: dozens of legacy titles read
"<EVENT> COMING TO <NATION>", so this list is what the Phase 3 importer matches
against to populate the archive's most useful filter. For a diaspora audience,
"prophecies about my country" is the single most valuable way in.

Idempotent — safe to re-run after adding entries.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.content.models import Category, Region

# Themes, with the occurrence counts measured across the legacy archive.
CATEGORIES = [
    ("Earthquake", "Earthquakes and seismic events.", 10),
    ("Judgement", "Floods, fire, storms and other declared judgements.", 20),
    ("Prophecy", "General prophetic words.", 30),
    ("Vision", "Visions and heavenly visitations.", 40),
    ("Rapture", "The rapture and the second coming.", 50),
    ("Messiah", "The coming of the Messiah.", 60),
    ("Healing", "Healing testimonies and healing services.", 70),
    ("Glory", "Manifestations of the glory of God.", 80),
    ("Revival", "Revival and repentance campaigns.", 90),
    ("Repentance", "Calls to repentance and holiness.", 100),
    ("Service", "Conferences, crusades and services.", 110),
    ("Other", "Uncategorised — needs staff review.", 999),
]

# Nations observed in, or plausible for, the archive. Continent aids grouping.
REGIONS = [
    ("Kenya", "KE", "Africa"),
    ("Uganda", "UG", "Africa"),
    ("Tanzania", "TZ", "Africa"),
    ("Rwanda", "RW", "Africa"),
    ("Burundi", "BI", "Africa"),
    ("Ethiopia", "ET", "Africa"),
    ("Somalia", "SO", "Africa"),
    ("South Sudan", "SS", "Africa"),
    ("Sudan", "SD", "Africa"),
    ("Djibouti", "DJ", "Africa"),
    ("Eritrea", "ER", "Africa"),
    ("Nigeria", "NG", "Africa"),
    ("Ghana", "GH", "Africa"),
    ("South Africa", "ZA", "Africa"),
    ("Zimbabwe", "ZW", "Africa"),
    ("Zambia", "ZM", "Africa"),
    ("Malawi", "MW", "Africa"),
    ("Mozambique", "MZ", "Africa"),
    ("Angola", "AO", "Africa"),
    ("Namibia", "NA", "Africa"),
    ("Botswana", "BW", "Africa"),
    ("Cameroon", "CM", "Africa"),
    ("Congo", "CD", "Africa"),
    ("Madagascar", "MG", "Africa"),
    ("Mauritius", "MU", "Africa"),
    ("Egypt", "EG", "Africa"),
    ("Libya", "LY", "Africa"),
    ("Israel", "IL", "Asia"),
    ("Iran", "IR", "Asia"),
    ("Iraq", "IQ", "Asia"),
    ("Turkey", "TR", "Asia"),
    ("India", "IN", "Asia"),
    ("Pakistan", "PK", "Asia"),
    ("Bangladesh", "BD", "Asia"),
    ("Nepal", "NP", "Asia"),
    ("Sri Lanka", "LK", "Asia"),
    ("China", "CN", "Asia"),
    ("Japan", "JP", "Asia"),
    ("Korea", "KR", "Asia"),
    ("Taiwan", "TW", "Asia"),
    ("Thailand", "TH", "Asia"),
    ("Vietnam", "VN", "Asia"),
    ("Myanmar", "MM", "Asia"),
    ("Indonesia", "ID", "Asia"),
    ("Philippines", "PH", "Asia"),
    ("United Kingdom", "GB", "Europe"),
    ("Ireland", "IE", "Europe"),
    ("France", "FR", "Europe"),
    ("Germany", "DE", "Europe"),
    ("Italy", "IT", "Europe"),
    ("Spain", "ES", "Europe"),
    ("Portugal", "PT", "Europe"),
    ("Netherlands", "NL", "Europe"),
    ("Belgium", "BE", "Europe"),
    ("Switzerland", "CH", "Europe"),
    ("Austria", "AT", "Europe"),
    ("Sweden", "SE", "Europe"),
    ("Norway", "NO", "Europe"),
    ("Denmark", "DK", "Europe"),
    ("Finland", "FI", "Europe"),
    ("Poland", "PL", "Europe"),
    ("Greece", "GR", "Europe"),
    ("Russia", "RU", "Europe"),
    ("Ukraine", "UA", "Europe"),
    ("United States", "US", "Americas"),
    ("Canada", "CA", "Americas"),
    ("Mexico", "MX", "Americas"),
    ("Brazil", "BR", "Americas"),
    ("Argentina", "AR", "Americas"),
    ("Chile", "CL", "Americas"),
    ("Peru", "PE", "Americas"),
    ("Colombia", "CO", "Americas"),
    ("Ecuador", "EC", "Americas"),
    ("Haiti", "HT", "Americas"),
    ("Jamaica", "JM", "Americas"),
    ("Caribbean", "", "Americas"),
    ("Australia", "AU", "Oceania"),
    ("New Zealand", "NZ", "Oceania"),
    ("Papua New Guinea", "PG", "Oceania"),
    ("Fiji", "FJ", "Oceania"),
    ("Samoa", "WS", "Oceania"),
]


class Command(BaseCommand):
    help = "Seed categories and the region gazetteer. Idempotent."

    @transaction.atomic
    def handle(self, *args, **options):
        cat_new = cat_seen = 0
        for name, description, order in CATEGORIES:
            _, created = Category.objects.update_or_create(
                slug=slugify(name),
                defaults={"name": name, "description": description, "order": order},
            )
            cat_new += created
            cat_seen += 1

        reg_new = reg_seen = 0
        for name, iso2, continent in REGIONS:
            _, created = Region.objects.update_or_create(
                slug=slugify(name),
                defaults={"name": name, "iso2": iso2, "continent": continent},
            )
            reg_new += created
            reg_seen += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Categories: {cat_new} created, {cat_seen - cat_new} updated. "
                f"Regions: {reg_new} created, {reg_seen - reg_new} updated."
            )
        )
