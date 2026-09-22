import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-display font-semibold " +
  "transition-colors duration-200 ease-emphasis disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary-700 text-ink-0 hover:bg-primary-600 active:bg-primary-800",
  secondary:
    "border border-ink-200 bg-ink-0 text-primary-700 hover:border-primary-300 hover:bg-primary-50 " +
    "[.on-dark_&]:border-ink-0/25 [.on-dark_&]:bg-transparent [.on-dark_&]:text-ink-0 " +
    "[.on-dark_&]:hover:bg-ink-0/10",
  ghost:
    "text-primary-700 hover:bg-primary-50 [.on-dark_&]:text-ink-0 [.on-dark_&]:hover:bg-ink-0/10",
  // Gold fill takes near-black text, never white: #E0A800 is a fill colour and
  // fails contrast against light text.
  gold: "bg-gold-500 text-primary-950 hover:bg-gold-400 active:bg-gold-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-body-sm",
  md: "h-11 px-5 text-body",
  // h-13 is not in Tailwind's default scale, so it compiled to nothing and
  // large buttons collapsed to the height of their text.
  lg: "h-12 px-7 text-body",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Common & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Same visual language for navigation. A link that looks like a button must
 *  still be a link, so it keeps middle-click, copy-address and prefetch. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Common & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
