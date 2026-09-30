import { notFound } from "next/navigation";

import { PageHeader } from "@/components/studio/ui";
import { getSiteContent } from "@/lib/api/site";
import { can } from "@/lib/studio/client";
import { StudioApiError, getEditor, studioGet } from "@/lib/studio/server";
import type { Section } from "@/lib/studio/types";

import { SectionEditor } from "./SectionEditor";

export const metadata = { title: "Words" };

export default async function SectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-z_]+$/.test(key)) notFound();

  let section: Section;
  try {
    section = await studioGet<Section>(`sections/${key}/`);
  } catch (error) {
    if (error instanceof StudioApiError && error.status === 404) notFound();
    throw error;
  }
  const [user, site] = await Promise.all([getEditor(), getSiteContent()]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: section.group === "Home page" ? "/studio/home" : "/studio/text", label: section.group === "Home page" ? "Home page" : "Words & contact" }}
        eyebrow={section.group}
        title={section.label}
        description={section.description}
      />
      <SectionEditor
        initial={section}
        site={{ sections: site.sections, heroSlides: site.heroSlides }}
        canChange={can(user, "sitecontent.change_sitesection")}
      />
    </div>
  );
}
