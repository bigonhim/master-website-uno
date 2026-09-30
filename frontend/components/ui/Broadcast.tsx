import type { ReactNode } from "react";

import type { ContentKind } from "@/lib/api/types";

/**
 * The ministry's broadcast graphics, as components.
 *
 * Taken from its own video packaging (e.g. "PROPHECY ALERT! / AUGUST 29, 2026 /
 * A BIG DISEASE OF DIARRHOEA"), where every colour has a single job:
 *
 *   navy bar   carries the title
 *   cyan       the lead-in ("PROPHECY OF")
 *   yellow     the date, and the words being stressed
 *   red        urgency — the alert tag
 *   white box  the date or place, in navy
 *
 * Keeping those jobs fixed is what makes the site feel like the same ministry
 * as the videos embedded in it. Yellow and bright cyan only ever sit on navy
 * or red; tests/tokens.test.ts holds that line.
 */

/** Each content kind owns one colour from the palette, used for its tag. */
const KIND: Record<ContentKind, { label: string; className: string }> = {
  // Yellow on red is the video's own "PROPHECY ALERT!" tag; 4.75:1.
  prophecy: { label: "Prophecy", className: "bg-alert-600 text-sun" },
  teaching: { label: "Teaching", className: "bg-cyan-400 text-primary-900" },
  healing: { label: "Healing", className: "bg-sun text-primary-900" },
  writing: { label: "Writing", className: "bg-primary-900 text-cyan-400" },
};

const segment = "inline-flex items-center px-2.5 py-1 text-caption font-black uppercase tracking-wide";

export function KindTag({
  kind,
  children,
  className = "",
}: {
  kind: ContentKind;
  /** Overrides the default label, e.g. "Prophecy alert!". */
  children?: ReactNode;
  className?: string;
}) {
  const { label, className: tone } = KIND[kind];
  return <span className={`${segment} ${tone} ${className}`}>{children ?? label}</span>;
}

/**
 * The lower third: kind tag, then the date on a navy bar, butted together with
 * no gap, as the video lays them out.
 */
export function LowerThird({
  kind,
  date,
  tag,
  className = "",
}: {
  kind: ContentKind;
  date: string;
  tag?: ReactNode;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-stretch ${className}`}>
      <KindTag kind={kind}>{tag}</KindTag>
      <span className={`${segment} bg-primary-700 tabular-nums text-ink-0`}>{date}</span>
    </p>
  );
}

/** "GABORONE | BOTSWANA": yellow block, navy block, pin first. */
export function PlaceTag({ name, detail }: { name: string; detail?: string }) {
  return (
    <span className="inline-flex items-stretch">
      <span className={`${segment} gap-1.5 bg-sun text-primary-900`}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3 fill-current">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        {name}
      </span>
      {detail ? <span className={`${segment} bg-primary-700 text-ink-0`}>{detail}</span> : null}
    </span>
  );
}

/**
 * The lead-in above a title — "PROPHECY OF". Cyan on navy; on a light surface
 * it drops to cyan-700, the only cyan that reads on white.
 */
export function LeadIn({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <p
      className={`text-eyebrow font-black uppercase text-cyan-700 [.on-dark_&]:text-cyan-400 ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * A title set in navy bars, one bar per line (box-decoration-clone), the way
 * the video stacks "A BIG DISEASE OF DIARRHOEA" and "COMING TO HIT THE EARTH".
 * `tone="alert"` is the white bar with red type, for the line that warns.
 */
export function Bar({
  tone = "navy",
  className = "",
  children,
}: {
  tone?: "navy" | "gold" | "alert";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    navy: "bg-primary-700 text-ink-0",
    gold: "bg-primary-700 text-sun",
    alert: "bg-ink-0 text-alert-600 ring-1 ring-inset ring-ink-100",
  } as const;
  return <span className={`bar ${tones[tone]} ${className}`}>{children}</span>;
}
