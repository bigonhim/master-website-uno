import { PageHeader } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { getEditor } from "@/lib/studio/server";

import { VideoLibrary } from "./VideoLibrary";

export const metadata = { title: "Videos" };

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ availability?: string; video?: string }>;
}) {
  const [user, params] = await Promise.all([getEditor(), searchParams]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Videos"
        description="The YouTube recordings the archive plays. Paste a link to add one; YouTube does the streaming. A video deleted on YouTube is flagged here, and an item that plays it can't be published."
      />
      <VideoLibrary
        initialAvailability={params.availability ?? ""}
        initialOpen={params.video ? Number(params.video) : null}
        canAdd={can(user, "content.add_video")}
        canChange={can(user, "content.change_video")}
        canDelete={can(user, "content.delete_video")}
      />
    </div>
  );
}
