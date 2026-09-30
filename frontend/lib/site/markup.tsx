import { Fragment, type ReactNode } from "react";

/**
 * The one piece of formatting an editor can type into the site's words:
 *
 *   **words**  the section's highlight (yellow on the blue bands)
 *   *words*    its accent (cyan on the blue bands)
 *
 * It is parsed into text runs and rendered as React text, never as HTML, so
 * nothing typed in the Studio can reach the page as markup.
 */

export type Run = { text: string; style: "plain" | "strong" | "em" };

const PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

export function parseMarkup(source: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: source.slice(last, index), style: "plain" });
    runs.push(
      match[1] !== undefined
        ? { text: match[1], style: "strong" }
        : { text: match[2], style: "em" },
    );
    last = index + match[0].length;
  }
  if (last < source.length) runs.push({ text: source.slice(last), style: "plain" });
  return runs;
}

/** The words without their markup, for alt text and titles. */
export function plainText(source: string): string {
  return parseMarkup(source)
    .map((run) => run.text)
    .join("");
}

export function Markup({
  text,
  strong = "",
  em = "",
}: {
  text: string;
  /** Classes for **highlighted** words. */
  strong?: string;
  /** Classes for *accented* words. */
  em?: string;
}) {
  const nodes: ReactNode[] = parseMarkup(text).map((run, i) =>
    run.style === "plain" ? (
      <Fragment key={i}>{run.text}</Fragment>
    ) : (
      <span key={i} className={run.style === "strong" ? strong : em}>
        {run.text}
      </span>
    ),
  );
  return <>{nodes}</>;
}

/** Paragraphs separated by an empty line, as the Studio's text boxes ask. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
