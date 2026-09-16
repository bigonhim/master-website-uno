import type { Metadata } from "next";

import { ArchiveScreen, readArchiveParams } from "@/components/content/ArchiveScreen";

export const metadata: Metadata = {
  title: "Prophecies",
  description:
    "The prophetic archive of the Ministry of Repentance and Holiness, browsable by theme and nation.",
};

export default async function PropheciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ArchiveScreen
      kind="prophecies"
      basePath="/prophecies"
      eyebrow="The Archive"
      title="Prophecies"
      lede="Prophetic words given through the Ministry of Repentance and Holiness, gathered from two decades of recordings."
      emptyLabel="prophecies"
      params={readArchiveParams(await searchParams)}
    />
  );
}
