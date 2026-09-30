import { PageHeader } from "@/components/studio/ui";
import { getSiteContent } from "@/lib/api/site";
import { can } from "@/lib/studio/client";
import { getEditor, studioGet } from "@/lib/studio/server";
import type { Slide } from "@/lib/studio/types";

import { SlidesManager } from "./SlidesManager";

export const metadata = { title: "Hero slides" };

export default async function SlidesPage() {
  const [user, slides, site] = await Promise.all([
    getEditor(),
    studioGet<Slide[]>("slides/"),
    getSiteContent(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/studio/home", label: "Home page" }}
        eyebrow="Home page"
        title="Hero slides"
        description="The photos behind the call at the top of the home page. They turn every few seconds, in this order. The words sit over the left half on wide screens, so choose photos whose subject stands right of centre."
      />
      <SlidesManager
        initial={slides}
        hero={site.sections.home_hero}
        canAdd={can(user, "sitecontent.add_heroslide")}
        canChange={can(user, "sitecontent.change_heroslide")}
        canDelete={can(user, "sitecontent.delete_heroslide")}
      />
    </div>
  );
}
