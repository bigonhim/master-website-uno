import Link from "next/link";

const TABS = [
  { key: "all", href: "/prophecies", label: "Prophecies" },
  {
    key: "fulfilled",
    href: "/prophecies/fulfilled",
    label: "Prophecies & their fulfilment",
  },
] as const;

/**
 * The two halves of the prophetic record: everything that was prophesied, and
 * the prophecies whose fulfilment has been recorded beside them. Links, not
 * buttons, so each half has its own address to share.
 */
export function ProphecyTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Prophecies" className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`inline-flex h-10 items-center rounded-full px-4 font-display text-body-sm font-semibold transition-colors ${
            tab.key === active
              ? "bg-primary-700 text-ink-0"
              : "border border-ink-200 bg-ink-0 text-ink-700 hover:border-primary-300 hover:text-primary-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
