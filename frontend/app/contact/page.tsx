import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PrepareDeck } from "@/components/contact/PrepareDeck";
import { LeadIn } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Ministry of Repentance and Holiness on WhatsApp, by phone or by email — and begin with the Salvation Prayer and the steps to prepare for the coming of the Messiah.",
  alternates: { canonical: "/contact" },
};

const icon = "h-5 w-5 fill-none stroke-current stroke-[1.75]";

function Channel({
  href,
  title,
  detail,
  note,
  external = false,
  primary = false,
  children,
}: {
  href: string;
  title: string;
  detail: string;
  note: string;
  external?: boolean;
  /** The first thing to try. Navy, where the rest are outlined. */
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group flex items-center gap-4 rounded-md px-4 py-4 transition-colors ${
        primary
          ? "on-dark bg-primary-700 text-ink-0 hover:bg-primary-600"
          : "border border-ink-200 bg-ink-0 text-ink-900 hover:border-primary-300 hover:bg-primary-50"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          primary ? "bg-ink-0/15 text-ink-0" : "bg-primary-50 text-primary-700"
        }`}
      >
        {children}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-body font-semibold">{title}</span>
        <span
          className={`block break-words text-body-sm tabular-nums ${
            primary ? "text-ink-100" : "text-ink-600"
          }`}
        >
          {detail}
        </span>
      </span>
      <span
        className={`hidden text-caption font-medium sm:block ${
          primary ? "text-ink-100" : "text-ink-600"
        }`}
      >
        {note}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-hover:translate-x-0.5"
      >
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export default function ContactPage() {
  const [firstPhone, secondPhone] = CONTACT.phones;

  return (
    <Container className="py-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <LeadIn>Contact</LeadIn>
          <h1 className="mt-3 text-display-lg text-primary-900">Get in touch</h1>
          <p className="mt-4 max-w-[42ch] text-prose-lg text-ink-700">
            Reach the office straight away on WhatsApp, by phone or by email — and begin
            here with the Salvation Prayer.
          </p>

          <h2 className="mt-9 text-eyebrow uppercase text-ink-500">Reach us now</h2>
          <div className="mt-4 space-y-3">
            <Channel
              href={CONTACT.whatsapp.href}
              title="WhatsApp"
              detail={CONTACT.whatsapp.label}
              note="Message us"
              external
              primary
            >
              <svg aria-hidden viewBox="0 0 24 24" className={icon}>
                <path
                  d="M3.5 20.5l1.2-4.3A8.5 8.5 0 1 1 8 19.4l-4.5 1.1Z"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8.6c0 3 2.6 5.7 5.6 6.2l1.3-1.4-2-1-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-1-2L9 8.6Z"
                  strokeLinejoin="round"
                />
              </svg>
            </Channel>

            <Channel
              href={firstPhone.href}
              title="Call the office"
              detail={firstPhone.label}
              note="Tap to call"
            >
              <svg aria-hidden viewBox="0 0 24 24" className={icon}>
                <path
                  d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"
                  strokeLinejoin="round"
                />
              </svg>
            </Channel>

            <Channel
              href={CONTACT.email.href}
              title="Email"
              detail={CONTACT.email.label}
              note="Write to us"
            >
              <svg aria-hidden viewBox="0 0 24 24" className={icon}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
              </svg>
            </Channel>
          </div>

          <div className="mt-6 rounded-md border border-ink-200 bg-ink-0 p-5">
            <h2 className="text-eyebrow uppercase text-ink-500">The ministry</h2>
            <p className="mt-3 text-body-sm leading-relaxed text-ink-800">
              Ministry of Repentance and Holiness
              <br />
              Nakuru &amp; Nairobi, Kenya
            </p>
            <p className="mt-3 text-body-sm text-ink-600">
              A second line:{" "}
              <a
                href={secondPhone.href}
                className="font-semibold tabular-nums text-primary-700 underline underline-offset-4"
              >
                {secondPhone.label}
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-9 lg:col-span-7">
          {/* First, the steps in motion: one card's footprint, so the column
              ends beside the contact details instead of running past them. */}
          <section aria-labelledby="prepare-title">
            <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-700">
              <span aria-hidden className="h-1 w-10 bg-grad-rule" />
              Our vision &amp; mission
            </p>
            <h2 id="prepare-title" className="text-h2 mt-4 text-primary-900">
              Prepare for the coming of the Messiah
            </h2>
            <p className="mt-2 max-w-[54ch] text-body text-ink-700">
              The ministry exists to prepare the nations for the imminent and glorious
              coming of THE LORD JESUS CHRIST — like wise virgins with oil in their
              lamps. This is how you get ready.
            </p>
            <div className="mt-6">
              <PrepareDeck />
            </div>
          </section>

          {/* The prayer itself, whole. The form this column used to hold asked
              visitors to write to the office; this asks for the one response
              that matters. */}
          <section
            aria-labelledby="prayer-title"
            className="rounded-md bg-ink-25 p-6 ring-1 ring-inset ring-ink-100 sm:p-9"
          >
            <p className="text-eyebrow uppercase text-cyan-700">Begin here</p>
            <h2 id="prayer-title" className="text-h2 mt-3 text-primary-900">
              The Salvation Prayer
            </h2>
            <p className="mt-2 text-body text-ink-700">
              The words are not a formula. Say them aloud, slowly, and mean them.
            </p>
            <blockquote className="mt-6 rounded-sm border border-primary-100 bg-primary-50 p-7">
              <p className="max-w-prose font-prose text-prose-lg text-ink-800">
                Lord Jesus, I come to You today. I confess that I have sinned against
                You and gone my own way. I am sorry, and I turn from my sin now. I
                believe that You died for me and that You rose again. I ask You to
                forgive me, to wash me clean, and to come into my life. From today I
                give You my life. Be my Lord and my Saviour, and lead me in Your way of
                repentance and holiness, all the days of my life. Amen.
              </p>
            </blockquote>
            <p className="mt-5 text-body-sm text-ink-600">
              If you prayed this and meant it, God has heard you.{" "}
              <Link
                href="/salvation-prayer"
                className="font-semibold text-primary-700 underline underline-offset-4"
              >
                Walk through the six steps in full
              </Link>
              .
            </p>
          </section>

        </div>
      </div>
    </Container>
  );
}
