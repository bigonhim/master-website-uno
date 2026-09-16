import Link from "next/link";

/**
 * Three genuinely distinct states, never conflated.
 *
 * An outage is not an empty result, and an empty result is not "nothing here
 * yet". The previous attempt collapsed all three into hardcoded demo content,
 * so a dead backend rendered a healthy-looking site.
 */

function Frame({
  tone,
  title,
  children,
}: {
  tone: "error" | "quiet";
  title: string;
  children: React.ReactNode;
}) {
  const ring = tone === "error" ? "ring-danger/25 bg-[rgb(253_236_234)]" : "ring-ink-200 bg-ink-0";
  return (
    <div className={`rounded-sm px-8 py-14 text-center ring-1 ring-inset ${ring}`}>
      <h2 className="text-h3 text-ink-900">{title}</h2>
      <div className="mx-auto mt-3 max-w-[52ch] text-body-sm text-ink-600">{children}</div>
    </div>
  );
}

/** The archive is unreachable. Say so plainly rather than showing a blank grid. */
export function ApiErrorState({ status }: { status?: number }) {
  return (
    <Frame tone="error" title="We couldn't reach the archive">
      <p>
        The library is temporarily unavailable
        {status ? ` (error ${status})` : ""}. This is a problem on our side, not
        with your connection. Please try again shortly.
      </p>
    </Frame>
  );
}

/** A valid search that matched nothing. */
export function NoResultsState({
  hint,
  resetHref,
}: {
  hint?: string;
  resetHref: string;
}) {
  return (
    <Frame tone="quiet" title="Nothing matches those filters">
      <p>{hint ?? "Try removing a filter to widen the search."}</p>
      <Link
        href={resetHref}
        className="mt-5 inline-block text-body-sm font-semibold text-primary-700 underline underline-offset-4"
      >
        Clear all filters
      </Link>
    </Frame>
  );
}

/** Nothing published yet — a real state while the archive is being reviewed. */
export function NotYetPublishedState({ kind }: { kind: string }) {
  return (
    <Frame tone="quiet" title={`No ${kind} published yet`}>
      <p>
        This section of the archive is still being reviewed before it goes
        public. Recordings are checked and dated before they appear here.
      </p>
    </Frame>
  );
}
