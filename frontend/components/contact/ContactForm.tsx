"use client";

import { useState } from "react";

import { CONTACT_TOPICS } from "@/lib/contact";

type FieldErrors = Partial<Record<"topic" | "name" | "email" | "phone" | "message", string>>;

const FALLBACK = "We could not send your message. Please try again.";

const field =
  "mt-1.5 w-full rounded-sm border border-ink-200 bg-ink-0 px-3.5 py-3 text-body text-ink-900 " +
  "placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 " +
  "aria-[invalid=true]:border-danger";

const label = "text-body-sm font-semibold text-ink-800";

/**
 * The contact form.
 *
 * A real form first: it posts to /api/contact/form and works with no script at
 * all. With script it is sent in place instead, so a mistake is shown beside
 * the field it belongs to and nothing the person typed is lost.
 */
export function ContactForm({ issue = false }: { issue?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    issue ? "error" : "idle",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState(issue ? FALLBACK : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    setState("sending");
    setErrors({});
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: text("topic") || "other",
          name: text("name"),
          email: text("email"),
          phone: text("phone"),
          message: text("message"),
          honeypot: text("website"),
        }),
      });

      if (response.ok) {
        setState("done");
        return;
      }

      const body = await response.json().catch(() => ({}));
      const found: FieldErrors = {};
      for (const key of ["topic", "name", "email", "phone", "message"] as const) {
        if (Array.isArray(body[key]) && body[key][0]) found[key] = String(body[key][0]);
      }
      setErrors(found);
      setError(
        response.status === 429
          ? "You have sent several messages in a short time. Please try again in an hour, or reach us on WhatsApp or by phone."
          : Object.keys(found).length > 0
            ? "Please check the fields marked below."
            : (body.detail ?? FALLBACK),
      );
      setState("error");
    } catch {
      setError(FALLBACK);
      setState("error");
    }
  }

  if (state === "done") {
    return <Sent />;
  }

  return (
    <form method="POST" action="/api/contact/form" onSubmit={submit}>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset>
        <legend className={label}>What is it about?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((topic) => (
            <label key={topic.value} className="cursor-pointer">
              <input
                type="radio"
                name="topic"
                value={topic.value}
                defaultChecked={topic.value === "other"}
                className="peer sr-only"
              />
              <span className="inline-flex h-10 items-center rounded-full border border-ink-200 bg-ink-0 px-4 text-body-sm font-medium text-ink-800 transition-colors hover:border-primary-300 peer-checked:border-primary-700 peer-checked:bg-primary-700 peer-checked:text-ink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-2">
                {topic.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Your name" error={errors.name}>
          <input
            id="contact-name"
            name="name"
            required
            maxLength={200}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={field}
          />
        </Field>
        <Field id="contact-email" label="Your email" error={errors.email}>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={field}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          id="contact-phone"
          label="Phone number (optional)"
          hint="Add it if you would like to be called back."
          error={errors.phone}
        >
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="+254 ..."
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "contact-phone-error" : "contact-phone-hint"}
            className={field}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="contact-message" label="Your message" error={errors.message}>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            maxLength={5000}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className={`${field} resize-y`}
          />
        </Field>
      </div>

      {error ? (
        <p role="alert" className="mt-5 text-body-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex h-12 items-center gap-2 rounded-sm bg-primary-700 px-7 font-display text-body font-extrabold uppercase tracking-wide text-ink-0 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send message"}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current stroke-2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="max-w-[38ch] text-caption font-medium text-ink-600">
          We use what you send only to answer you, and never share it.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label: text,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-body-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-body-sm text-ink-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Sent() {
  return (
    <div
      role="status"
      className="rounded-sm bg-primary-50 p-7 ring-1 ring-inset ring-primary-200"
    >
      <h3 className="text-h3 text-primary-800">Your message has been sent</h3>
      <p className="mt-3 max-w-prose text-body-sm text-ink-700">
        Thank you for writing. The ministry&rsquo;s office has your message and will reply
        to the email address you gave.
      </p>
    </div>
  );
}
