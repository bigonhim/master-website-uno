"use client";

import { useSyncExternalStore } from "react";

/**
 * The light/dark switch in the navbar.
 *
 * The theme lives as `data-theme` on <html>: absent means light, "dark" means
 * dark, and globals.css keys every token off it. The choice is replayed
 * before paint by the inline script in the root layout, so this button treats
 * the document itself as the store — it watches the attribute and flips it.
 * The server snapshot says light, and the first client render corrects that
 * after the page is already painted dark, so nothing flashes.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function isDark() {
  return document.documentElement.dataset.theme === "dark";
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    if (dark) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("theme", dark ? "light" : "dark");
    } catch {
      // Private windows still get the theme, just not remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-primary-800 transition-colors hover:bg-ink-50"
    >
      {dark ? (
        // The sun: pressing it brings the light back.
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-none stroke-current stroke-2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      ) : (
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M20.6 14.6A8.5 8.5 0 0 1 9.4 3.4a.6.6 0 0 0-.8-.74 9.5 9.5 0 1 0 12.74 12.74.6.6 0 0 0-.74-.8Z" />
        </svg>
      )}
    </button>
  );
}
