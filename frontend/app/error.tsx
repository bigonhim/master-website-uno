"use client";

import { useEffect } from "react";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The last line of defence. It says something went wrong on our side and
 * offers a way forward — it never renders placeholder content to paper over
 * the failure.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-section">
      <div className="mx-auto max-w-prose rounded-sm bg-[rgb(253_236_234)] p-8 text-center ring-1 ring-inset ring-danger/25">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="text-h2 mt-4 text-ink-900">We could not load this page</h1>
        <p className="mt-3 text-body-sm text-ink-700">
          This is a problem on our side, not with your connection. Trying again
          often works.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-caption text-ink-500">
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 h-11 rounded-sm bg-primary-700 px-6 font-display text-body font-semibold text-ink-0 hover:bg-primary-600"
        >
          Try again
        </button>
      </div>
    </Container>
  );
}
