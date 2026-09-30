import { PageHeader } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { getEditor, studioGet } from "@/lib/studio/server";

import { MediaLibrary } from "./MediaLibrary";

export const metadata = { title: "Photos" };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ photo?: string; missing_alt?: string }>;
}) {
  const [user, collections, params] = await Promise.all([
    getEditor(),
    studioGet<{ name: string; count: number }[]>("media/collections/"),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Photos"
        description="Every photo the site can show. Upload once, use anywhere: a photo in use can't be deleted by accident, and each one is cropped around the point you choose."
      />
      <MediaLibrary
        collections={collections}
        initialPhoto={params.photo ? Number(params.photo) : null}
        initialMissingAlt={params.missing_alt === "1"}
        canAdd={can(user, "media.add_mediaasset")}
        canChange={can(user, "media.change_mediaasset")}
        canDelete={can(user, "media.delete_mediaasset")}
      />
    </div>
  );
}
