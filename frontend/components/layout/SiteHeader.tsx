"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";

/**
 * Primary navigation.
 *
 * The site had none at all until now — you could only reach the archive from a
 * card on the home page, which is most of why it felt scattered.
 *
 * Light, sticky beneath the radio bar, with the current section marked. Five
 * destinations and one action: more than that and a visitor has to read the
 * menu instead of using it.
 */

// Only routes that exist. /radio and /about were in here first and both 404 —
// a nav that lies about where it goes is worse than a shorter nav.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/prophecies", label: "Prophecies" },
  { href: "/teachings", label: "Teachings" },
  { href: "/healings", label: "Healings" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // A menu that survives navigation is a menu stuck open.
  useEffect(() => setOpen(false), [pathname]);

  // Home is exact-match only, or it would light up on every page.
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className="sticky z-40 border-b border-ink-100 bg-ink-0/95 backdrop-blur"
      style={{ top: "var(--radio-h)" }}
    >
      <div className="mx-auto flex h-nav w-full max-w-container items-center gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <Logo size={44} priority />
          {/* On phones the name is hidden, so the link still needs one. */}
          <span className="sr-only sm:hidden">Repentance &amp; Holiness — home</span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-body-sm font-bold text-primary-800">
              Repentance &amp; Holiness
            </span>
            <span className="block text-caption text-ink-500">Nakuru, Kenya</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`relative rounded-xs px-3 py-2 font-display text-body-sm font-semibold transition-colors ${
                    isActive(link.href)
                      ? "text-primary-700"
                      : "text-ink-600 hover:text-primary-700"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-700"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/salvation-prayer"
          className="ml-auto hidden h-10 shrink-0 items-center rounded-sm bg-primary-700 px-4 font-display text-body-sm font-semibold text-ink-0 transition-colors hover:bg-primary-600 lg:ml-0 lg:inline-flex"
        >
          Salvation Prayer
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-sm text-primary-800 hover:bg-ink-50 lg:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-ink-100 bg-ink-0 lg:hidden"
        >
          <ul className="mx-auto max-w-container px-5 py-3 sm:px-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block border-b border-ink-50 py-3 font-display text-body font-semibold ${
                    isActive(link.href) ? "text-primary-700" : "text-ink-700"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link
                href="/salvation-prayer"
                className="flex h-12 items-center justify-center rounded-sm bg-primary-700 font-display text-body font-semibold text-ink-0"
              >
                Salvation Prayer
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
