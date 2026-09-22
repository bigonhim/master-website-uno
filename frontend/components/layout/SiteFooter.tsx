import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

import { LocalTime } from "./LocalTime";

/**
 * Three tiers: one call to action, the substance, then utility.
 *
 * Every link here points at something that exists. The first version linked to
 * nine routes that were never built — books, search, radio, prayer requests,
 * testimonies, contact, privacy, terms, accessibility — so the footer on every
 * page was a list of 404s. A shorter footer that tells the truth beats a longer
 * one that doesn't. Add a link back when its page is built, not before.
 */

type FooterLink = { href: string; label: string; external?: boolean };

const archiveLinks: FooterLink[] = [
  { href: "/prophecies", label: "Prophecies" },
  { href: "/teachings", label: "Teachings" },
  { href: "/healings", label: "Healings" },
];

const listenLinks: FooterLink[] = [
  // The archive's recordings live on this channel, not @repentpreparetheway.
  {
    href: "https://www.youtube.com/@repentancechannel1",
    label: "YouTube channel",
    external: true,
  },
  { href: "/feed.xml", label: "RSS feed" },
];

const nextStepLinks: FooterLink[] = [
  { href: "/salvation-prayer", label: "The Salvation Prayer" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-eyebrow uppercase text-cyan-400">{title}</h2>
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
      <div className="grad-dither bg-grad-royal">
        <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div aria-hidden className="h-1 w-16 bg-grad-rule" />
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

      <div className="bg-primary-900">
        <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size={64} onDark className="mb-5" />
            <h2 className="text-eyebrow uppercase text-cyan-400">The Ministry</h2>
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

      <div className="bg-primary-950">
        <Container className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-body-sm text-ink-300">
            © {year} Ministry of Repentance and Holiness
          </p>
          <LocalTime />
          <Link
            href="/sitemap.xml"
            className="text-body-sm text-ink-300 underline-offset-4 transition-colors hover:text-ink-0 hover:underline"
          >
            Sitemap
          </Link>
        </Container>
      </div>
    </footer>
  );
}
