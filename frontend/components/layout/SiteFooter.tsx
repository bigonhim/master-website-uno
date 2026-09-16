import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

import { LocalTime } from "./LocalTime";

/**
 * Three tiers.
 *
 * The test for "genuinely useful" is whether someone landing here from a search
 * result finds what they need without scrolling back up — so this carries real
 * addresses, dialable numbers and every way into the archive, rather than a row
 * of social icons.
 */

const archiveLinks = [
  { href: "/teachings", label: "Teachings" },
  { href: "/prophecies", label: "Prophecies" },
  { href: "/healings", label: "Healings" },
  { href: "/library", label: "Books & booklets" },
  { href: "/prophecies?dated=true", label: "Browse by year" },
  { href: "/search", label: "Search the archive" },
];

const listenLinks = [
  { href: "/radio", label: "Jesus is LORD Radio" },
  { href: "https://www.youtube.com/@repentpreparetheway", label: "YouTube channel", external: true },
  { href: "/feed.xml", label: "RSS feed" },
];

const nextStepLinks = [
  { href: "/salvation-prayer", label: "The Salvation Prayer" },
  { href: "/prayer-request", label: "Request prayer" },
  { href: "/testimony", label: "Share a testimony" },
  { href: "/contact", label: "Contact the ministry" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-eyebrow uppercase text-gold-400">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-body-sm text-ink-200 underline-offset-4 transition-colors hover:text-ink-0 hover:underline"
            >
              {link.label}
              {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark mt-auto">
      {/* Tier 0 — the one action that matters most on the site. */}
      <div className="grad-dither bg-grad-royal">
        <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div aria-hidden className="h-0.5 w-16 bg-grad-rule" />
            <p className="mt-4 text-h3 text-ink-0">Begin here</p>
            <p className="mt-1 max-w-[46ch] text-body-sm text-ink-200">
              If you want to make peace with God, start with the prayer.
            </p>
          </div>
          <ButtonLink href="/salvation-prayer" variant="gold" size="lg">
            The Salvation Prayer
          </ButtonLink>
        </Container>
      </div>

      {/* Tier 1 — the substance. */}
      <div className="bg-primary-900">
        <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="text-eyebrow uppercase text-gold-400">The Ministry</h2>
            <p className="mt-4 text-body-sm leading-relaxed text-ink-200">
              Ministry of Repentance and Holiness
              <br />
              Nakuru &amp; Nairobi, Kenya
            </p>
            <ul className="mt-4 space-y-1.5 text-body-sm">
              <li>
                <a
                  href="tel:+254715276091"
                  className="tabular-nums text-ink-200 transition-colors hover:text-ink-0"
                >
                  +254 715 276091
                </a>
              </li>
              <li>
                <a
                  href="tel:+254708412344"
                  className="tabular-nums text-ink-200 transition-colors hover:text-ink-0"
                >
                  +254 708 412344
                </a>
              </li>
            </ul>
          </div>

          <FooterColumn title="Explore the archive" links={archiveLinks} />
          <FooterColumn title="Listen &amp; watch" links={listenLinks} />
          <FooterColumn title="Next steps" links={nextStepLinks} />
        </Container>
      </div>

      {/* Tier 2 — utility. */}
      <div className="bg-primary-950">
        <Container className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-body-sm text-ink-300">
            © {year} Ministry of Repentance and Holiness
          </p>
          <LocalTime />
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/accessibility", label: "Accessibility" },
              { href: "/sitemap.xml", label: "Sitemap" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-ink-300 underline-offset-4 transition-colors hover:text-ink-0 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
