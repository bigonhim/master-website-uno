import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The Studio's building blocks. Same typeface and colours as the site, set as
 * a working tool: sentence-case buttons, quiet panels, one strong colour for
 * the action that matters on each screen.
 */

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ----------------------------------------------------------------- layout */

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-ink-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1 text-meta text-ink-600 hover:text-primary-700"
          >
            <span aria-hidden>←</span> {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="text-eyebrow uppercase text-cyan-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-h2 text-primary-900">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-[70ch] text-body-sm text-ink-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx("rounded-lg bg-ink-0 shadow-xs ring-1 ring-ink-100", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-body font-extrabold text-primary-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-meta font-medium text-ink-600">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-ink-200 bg-ink-0 px-6 py-12 text-center">
      <p className="text-body font-extrabold text-primary-900">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-[48ch] text-body-sm text-ink-600">{children}</div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- buttons */

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-display font-bold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<Variant, string> = {
  primary: "bg-primary-700 text-ink-0 hover:bg-primary-600",
  success: "bg-success text-ink-0 hover:bg-[rgb(9_100_71)]",
  secondary: "bg-ink-0 text-primary-700 ring-1 ring-inset ring-ink-200 hover:bg-primary-50 hover:ring-primary-200",
  danger: "bg-ink-0 text-danger ring-1 ring-inset ring-danger/30 hover:bg-[rgb(253_236_234)]",
  ghost: "text-primary-700 hover:bg-primary-50",
};

const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3 text-meta",
  md: "h-10 px-4 text-body-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size], extra);
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  busy = false,
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
} & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      disabled={busy || props.disabled}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: { variant?: Variant; size?: Size } & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cx("animate-spin", className)}>
      <circle cx="12" cy="12" r="9" className="fill-none stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="fill-none stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------- inputs */

export const inputClass =
  "block w-full rounded-md border border-ink-200 bg-ink-0 px-3 py-2 text-body-sm font-medium text-ink-900 " +
  "placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 " +
  "disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

export function Field({
  label,
  htmlFor,
  help,
  error,
  count,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: string;
  /** [used, limit] shown at the end of the label row. */
  count?: [number, number];
  children: ReactNode;
  className?: string;
}) {
  const over = count ? count[0] > count[1] : false;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-meta font-bold text-ink-800">
          {label}
        </label>
        {count ? (
          <span
            className={cx(
              "text-caption tabular-nums",
              over ? "text-danger" : count[0] > count[1] * 0.9 ? "text-gold-800" : "text-ink-500",
            )}
          >
            {count[0]}/{count[1]}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-meta font-semibold text-danger">
          {error}
        </p>
      ) : help ? (
        <p className="mt-1.5 text-meta font-medium text-ink-600">{help}</p>
      ) : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx("flex items-start gap-3", disabled ? "opacity-60" : "cursor-pointer")}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-5 w-9 rounded-full bg-ink-200 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-ink-0 shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="block text-body-sm font-bold text-ink-800">{label}</span>
        {description ? (
          <span className="block text-meta font-medium text-ink-600">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

/* ----------------------------------------------------------------- badges */

const tones = {
  neutral: "bg-ink-100 text-ink-700",
  info: "bg-primary-50 text-primary-700",
  success: "bg-[rgb(230_245_239)] text-success",
  warning: "bg-[rgb(253_246_220)] text-gold-800",
  danger: "bg-[rgb(253_236_234)] text-danger",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StateBadge({ state }: { state: "draft" | "scheduled" | "published" }) {
  const map = {
    draft: { tone: "neutral", label: "Draft" },
    scheduled: { tone: "warning", label: "Scheduled" },
    published: { tone: "success", label: "Published" },
  } as const;
  const { tone, label } = map[state];
  return (
    <Badge tone={tone}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === "available") return <Badge tone="success">On YouTube</Badge>;
  if (availability === "unavailable") return <Badge tone="danger">Deleted on YouTube</Badge>;
  return <Badge tone="neutral">Not checked</Badge>;
}

export function Notice({
  tone = "info",
  children,
  className = "",
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-primary-50 text-primary-800 ring-primary-100",
    warning: "bg-[rgb(253_246_220)] text-[rgb(110_76_0)] ring-gold-400/40",
    danger: "bg-[rgb(253_236_234)] text-danger ring-danger/20",
    success: "bg-[rgb(230_245_239)] text-success ring-success/20",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("rounded-md px-4 py-3 text-body-sm font-semibold ring-1 ring-inset", styles[tone], className)}
    >
      {children}
    </div>
  );
}
