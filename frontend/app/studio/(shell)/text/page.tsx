import Link from "next/link";

import { Badge, PageHeader, Panel } from "@/components/studio/ui";
import { formatDate } from "@/lib/studio/format";
import { studioGet } from "@/lib/studio/server";
import type { Section } from "@/lib/studio/types";

export const metadata = { title: "Words & contact" };

export default async function TextPage() {
  const sections = await studioGet<Section[]>("sections/");
  // Site-wide first: the contact details are what changes most.
  const groups = [...new Set(sections.map((s) => s.group))].sort(
    (a, b) => Number(b === "Site-wide") - Number(a === "Site-wide"),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The site"
        title="Words & contact"
        description="The site's own words, section by section, and the contact details on every page. Each keeps its original wording on file, so any section can be put back as it was."
      />
      {groups.map((group) => (
        <Panel key={group} title={group} padded={false}>
          <ul className="divide-y divide-ink-100">
            {sections
              .filter((s) => s.group === group)
              .map((section) => (
                <li key={section.key}>
                  <Link
                    href={`/studio/text/${section.key}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary-50/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-sm font-bold text-primary-900">{section.label}</span>
                      <span className="block text-meta text-ink-600">{section.description}</span>
                    </span>
                    {section.is_default ? (
                      <Badge>Original words</Badge>
                    ) : (
                      <span className="shrink-0 text-right text-caption text-ink-500">
                        Edited {formatDate(section.updated_at)}
                        {section.updated_by ? <span className="block">by {section.updated_by}</span> : null}
                      </span>
                    )}
                    <span aria-hidden className="text-ink-400">→</span>
                  </Link>
                </li>
              ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
