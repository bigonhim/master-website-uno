"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { can } from "@/lib/studio/client";
import type { StudioUser } from "@/lib/studio/types";

import { cx } from "./ui";

type NavItem = { href: string; label: string; icon: ReactNode; perm?: string };

const icon = (d: string) => (
  <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-none stroke-current stroke-[1.9]" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV: { heading?: string; items: NavItem[] }[] = [
  {
    items: [{ href: "/studio", label: "Overview", icon: icon("M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-4H4v4Zm10-12h6V4h-6v4Z") }],
  },
  {
    heading: "The site",
    items: [
      { href: "/studio/home", label: "Home page", icon: icon("M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z"), perm: "sitecontent.view_heroslide" },
      { href: "/studio/text", label: "Words & contact", icon: icon("M5 6h14M5 12h14M5 18h9"), perm: "sitecontent.view_sitesection" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/studio/archive", label: "Archive", icon: icon("M4 6h16v4H4zM6 10v9h12v-9M10 14h4"), perm: "content.view_contentitem" },
      { href: "/studio/media", label: "Photos", icon: icon("M4 6h16v12H4zM4 15l4-4 4 4 3-3 5 5M15 9.5h.01"), perm: "media.view_mediaasset" },
      { href: "/studio/videos", label: "Videos", icon: icon("M4 6h16v12H4zM10 9.5v5l4.5-2.5L10 9.5Z"), perm: "content.view_video" },
    ],
  },
  {
    heading: "Team",
    items: [{ href: "/studio/history", label: "History", icon: icon("M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5M3.5 4v4.5H8") }],
  },
];

export function StudioShell({ user, children }: { user: StudioUser; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const active = (href: string) =>
    href === "/studio" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  async function signOut() {
    await fetch("/api/studio/session", { method: "DELETE" }).catch(() => undefined);
    // A full load, so nothing of the session lingers in memory.
    window.location.assign(new URL("/studio/login", window.location.origin));
  }

  const nav = (
    <nav aria-label="Studio" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV.map((group, i) => {
        const items = group.items.filter((item) => !item.perm || can(user, item.perm));
        if (!items.length) return null;
        return (
          <div key={group.heading ?? i}>
            {group.heading ? (
              <p className="mb-2 px-3 text-eyebrow uppercase text-cyan-400/90">{group.heading}</p>
            ) : null}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    className={cx(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-semibold transition-colors",
                      active(item.href)
                        ? "bg-ink-0/15 text-ink-0"
                        : "text-ink-0/75 hover:bg-ink-0/10 hover:text-ink-0",
                    )}
                  >
                    {active(item.href) ? (
                      <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-sun" />
                    ) : null}
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-ink-0/10 p-3">
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-semibold text-ink-0/75 hover:bg-ink-0/10 hover:text-ink-0"
      >
        {icon("M14 4h6v6M20 4l-9 9M18 14v6H4V6h6")}
        View the site
        <span className="sr-only"> (opens in a new tab)</span>
      </Link>
      <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun font-display text-meta font-black uppercase text-primary-900">
          {user.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-meta font-bold text-ink-0">{user.name}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-caption text-cyan-400 underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      {/* Sidebar: always there from lg, a drawer below it. */}
      <aside className="on-dark sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-grad-sapphire text-ink-0 lg:flex">
        <Brand />
        {nav}
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="on-dark sticky top-0 z-30 flex h-14 items-center gap-3 bg-grad-sapphire px-4 text-ink-0 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="studio-drawer"
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-ink-0/10"
          >
            <span className="sr-only">Open menu</span>
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display text-body-sm font-extrabold">Studio</span>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-primary-950/60"
            />
            <aside
              id="studio-drawer"
              className="on-dark relative flex h-full w-72 max-w-[85vw] flex-col bg-grad-sapphire text-ink-0 shadow-lg"
            >
              <Brand />
              {nav}
              {footer}
            </aside>
          </div>
        ) : null}

        <main id="main" className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/studio" className="flex items-center gap-3 border-b border-ink-0/10 px-5 py-4">
      <Logo size={36} onDark />
      <span className="leading-tight">
        <span className="block font-display text-body-sm font-extrabold text-ink-0">
          Repentance &amp; Holiness
        </span>
        <span className="block text-eyebrow uppercase text-cyan-400">Studio</span>
      </span>
    </Link>
  );
}
