"use client";

import { useEffect, useRef, useState } from "react";

type Branch = "prayed" | "not_yet" | null;

/**
 * Progressive enhancement, not a replacement.
 *
 * The page already contains every step in its HTML. This turns that into a
 * stepper for people with JavaScript; without it, the page stays a long,
 * readable, fully navigable document. This is the most important page on the
 * site, so it must never render blank.
 */
export function PrayerFlow({
  steps,
  totalSteps,
}: {
  steps: React.ReactNode[];
  totalSteps: number;
}) {
  const [index, setIndex] = useState(0);
  const [branch, setBranch] = useState<Branch>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => setEnhanced(true), []);

  useEffect(() => {
    if (enhanced && index > 0) headingRef.current?.focus();
  }, [index, enhanced]);

  // Without JS this renders every step as a plain document — AND the response
  // itself, as a native form. A reader who gets to the prayer and then has no
  // way to answer is the precise failure this page exists to fix, so the fork
  // cannot live behind hydration.
  if (!enhanced) {
    return (
      <div className="space-y-16">
        {steps}
        <section
          aria-labelledby="respond-nojs"
          className="rounded-sm bg-primary-50 p-7 ring-1 ring-inset ring-primary-200"
        >
          <h2 id="respond-nojs" className="text-h3 text-primary-800">
            Did you pray this prayer?
          </h2>
          <p className="mt-2 max-w-prose text-body-sm text-ink-600">
            There is no wrong answer. Every field below is optional — your prayer
            does not depend on any of them.
          </p>
          <form
            method="POST"
            action="/api/salvation/form"
            className="mt-6 max-w-xl space-y-4"
          >
            <input type="text" name="website" tabIndex={-1} aria-hidden="true" className="hidden" />
            <fieldset>
              <legend className="text-body-sm font-semibold text-ink-700">
                Your answer
              </legend>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="radio" name="decision" value="prayed" defaultChecked />
                  Yes, I prayed
                </label>
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="radio" name="decision" value="not_yet" />
                  No, but I have questions
                </label>
              </div>
            </fieldset>
            <label className="block">
              <span className="text-body-sm font-semibold text-ink-700">Name</span>
              <input name="name" className="mt-1 w-full rounded-sm border border-ink-200 px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="text-body-sm font-semibold text-ink-700">Email</span>
              <input name="email" type="email" className="mt-1 w-full rounded-sm border border-ink-200 px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="text-body-sm font-semibold text-ink-700">Country</span>
              <input name="country" className="mt-1 w-full rounded-sm border border-ink-200 px-3 py-2.5" />
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="wants_follow_up" value="yes" className="mt-1 h-4 w-4" />
              <span className="text-body-sm text-ink-700">
                Please contact me with next steps.
                <span className="mt-1 block text-caption text-ink-500">
                  We never share your details and keep them for two years at most.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="h-12 rounded-sm bg-gold-500 px-7 font-display text-body font-semibold text-primary-950"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    );
  }

  const atFork = index === totalSteps - 1;

  return (
    <div>
      <ol className="mb-10 flex flex-wrap gap-1.5" aria-label="Progress">
        {steps.map((_, step) => (
          <li key={step}>
            <button
              type="button"
              onClick={() => setIndex(step)}
              aria-current={step === index ? "step" : undefined}
              aria-label={`Step ${step + 1} of ${totalSteps}`}
              className={`h-1.5 w-10 rounded-full transition-colors ${
                step === index
                  ? "bg-primary-700"
                  : step < index
                    ? "bg-primary-300"
                    : "bg-ink-200"
              }`}
            />
          </li>
        ))}
      </ol>

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {steps[index]}
      </div>

      {atFork ? (
        <DecisionFork branch={branch} onBranch={setBranch} />
      ) : (
        <div className="mt-10 flex items-center gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="h-11 rounded-sm px-5 font-display text-body font-semibold text-primary-700 hover:bg-primary-50"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="h-11 rounded-sm bg-primary-700 px-6 font-display text-body font-semibold text-ink-0 transition-colors hover:bg-primary-600"
          >
            Continue
          </button>
          <span className="text-meta tabular-nums text-ink-500">
            {index + 1} of {totalSteps}
          </span>
        </div>
      )}
    </div>
  );
}

/** The explicit "Did you pray?" fork. Neither answer is a dead end. */
function DecisionFork({
  branch,
  onBranch,
}: {
  branch: Branch;
  onBranch: (branch: Branch) => void;
}) {
  if (branch === "prayed") return <DecisionForm decision="prayed" />;
  if (branch === "not_yet") return <NotYetPanel />;

  return (
    <fieldset className="mt-10 rounded-sm bg-primary-50 p-7 ring-1 ring-inset ring-primary-200">
      <legend className="px-2 text-h3 text-primary-800">
        Did you pray this prayer?
      </legend>
      <p className="mt-2 text-body-sm text-ink-600">
        There is no wrong answer here.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onBranch("prayed")}
          className="h-12 rounded-sm bg-primary-700 px-7 font-display text-body font-semibold text-ink-0 hover:bg-primary-600"
        >
          Yes, I prayed
        </button>
        <button
          type="button"
          onClick={() => onBranch("not_yet")}
          className="h-12 rounded-sm border border-ink-300 px-7 font-display text-body font-semibold text-ink-700 hover:bg-ink-0"
        >
          No, but I have questions
        </button>
      </div>
    </fieldset>
  );
}

function NotYetPanel() {
  return (
    <div className="mt-10 rounded-sm bg-ink-0 p-7 ring-1 ring-inset ring-ink-200">
      <h3 className="text-h3 text-ink-900">That is honest, and it is welcome</h3>
      <p className="mt-3 max-w-prose text-body-sm text-ink-600">
        Nobody should pray words they do not mean. If something is holding you
        back, you can read more first — or tell us what the question is and
        somebody will write back.
      </p>
      <div className="mt-6">
        <DecisionForm decision="not_yet" />
      </div>
    </div>
  );
}

function DecisionForm({ decision }: { decision: "prayed" | "not_yet" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [error, setError] = useState<string>("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/salvation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          name: form.get("name") || "",
          email: form.get("email") || "",
          country: form.get("country") || "",
          message: form.get("message") || "",
          wants_follow_up: wantsFollowUp,
          honeypot: form.get("website") || "",
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(
          body.email?.[0] ??
            body.detail ??
            "We could not record your response. Please try again.",
        );
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("We could not record your response. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-10 rounded-sm bg-primary-50 p-7 ring-1 ring-inset ring-primary-200">
        <h3 className="text-h3 text-primary-800">
          {decision === "prayed" ? "Welcome home" : "Thank you"}
        </h3>
        <p className="mt-3 max-w-prose text-body-sm text-ink-700">
          {decision === "prayed"
            ? "Your response has been recorded. If you asked us to, someone from the ministry will be in touch. Begin with the teachings on repentance and holiness."
            : "Your question has been recorded. Someone will write back if you left an address."}
        </p>
        <a
          href="/teachings"
          className="mt-5 inline-block font-display text-body-sm font-semibold text-primary-700 underline underline-offset-4"
        >
          Go to the teachings →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 max-w-xl">
      <h3 className="text-h3 text-ink-900">
        {decision === "prayed" ? "Tell us, if you would like to" : "Ask your question"}
      </h3>
      <p className="mt-2 text-body-sm text-ink-600">
        Every field is optional. You can leave this page without filling anything
        in — your prayer does not depend on it.
      </p>

      <div className="mt-6 space-y-4">
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <label className="block">
          <span className="text-body-sm font-semibold text-ink-700">Name</span>
          <input
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded-sm border border-ink-200 bg-ink-0 px-3 py-2.5 text-body"
          />
        </label>
        <label className="block">
          <span className="text-body-sm font-semibold text-ink-700">Country</span>
          <input
            name="country"
            autoComplete="country-name"
            className="mt-1 w-full rounded-sm border border-ink-200 bg-ink-0 px-3 py-2.5 text-body"
          />
        </label>
        <label className="block">
          <span className="text-body-sm font-semibold text-ink-700">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-sm border border-ink-200 bg-ink-0 px-3 py-2.5 text-body"
          />
        </label>
        <label className="block">
          <span className="text-body-sm font-semibold text-ink-700">
            {decision === "prayed" ? "Anything you want to say" : "Your question"}
          </span>
          <textarea
            name="message"
            rows={4}
            className="mt-1 w-full rounded-sm border border-ink-200 bg-ink-0 px-3 py-2.5 text-body"
          />
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={wantsFollowUp}
            onChange={(event) => setWantsFollowUp(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span className="text-body-sm text-ink-700">
            Please contact me with next steps.
            <span className="mt-1 block text-caption text-ink-500">
              We will never share your details, and we keep them for two years at
              most. Leave this unticked and nothing is sent to you.
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-body-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 h-12 rounded-sm bg-gold-500 px-7 font-display text-body font-semibold text-primary-950 transition-colors hover:bg-gold-400 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
