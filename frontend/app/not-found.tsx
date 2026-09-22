import Link from "next/link";

import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <>
      <div className="border-b border-ink-100 bg-gradient-to-b from-primary-50 to-ink-0">
        <Container className="pb-12 pt-14">
          <p className="text-eyebrow uppercase text-cyan-700">404</p>
          <div aria-hidden className="mt-3 h-1 w-12 bg-grad-rule" />
          <h1 className="text-display-lg mt-6 max-w-[18ch] text-primary-900">
            That page is not here
          </h1>
          <p className="mt-5 max-w-[52ch] text-body text-ink-600">
            The link may be old, or the entry may still be under review before it
            is published.
          </p>
        </Container>
      </div>

      <Container className="py-section-sm">
        <ul className="grid gap-5 sm:grid-cols-3">
          {[
            { href: "/prophecies", label: "Prophecies", body: "The prophetic archive" },
            { href: "/teachings", label: "Teachings", body: "Messages and series" },
            {
              href: "/salvation-prayer",
              label: "Begin here",
              body: "The Salvation Prayer",
            },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-sm border border-ink-100 bg-ink-0 p-6 transition-shadow duration-300 ease-emphasis hover:shadow-md"
              >
                <span className="text-h4 text-primary-800">{link.label}</span>
                <span className="mt-1 block text-body-sm text-ink-600">{link.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
