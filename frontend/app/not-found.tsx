import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function NotFound() {
  return (
    <>
      <div className="on-dark grad-dither bg-grad-royal">
        <Container className="py-section-sm">
          <Eyebrow rule>404</Eyebrow>
          <h1 className="text-display-lg mt-6 max-w-[18ch]">
            That page is not here
          </h1>
          <p className="mt-5 max-w-[52ch] text-body text-ink-200">
            The link may be old, or the entry may still be under review before it
            is published.
          </p>
        </Container>
      </div>

      <Container className="py-section-sm">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/prophecies", label: "Prophecies", body: "The prophetic archive" },
            { href: "/teachings", label: "Teachings", body: "Messages and series" },
            { href: "/salvation-prayer", label: "Begin here", body: "The Salvation Prayer" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-sm bg-ink-0 p-5 ring-1 ring-inset ring-ink-100 transition-shadow hover:shadow-md"
              >
                <span className="text-h4 text-primary-700">{link.label}</span>
                <span className="mt-1 block text-body-sm text-ink-600">{link.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
