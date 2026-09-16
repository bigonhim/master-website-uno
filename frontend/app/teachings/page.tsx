import type { Metadata } from "next";

import { ArchiveScreen, readArchiveParams } from "@/components/content/ArchiveScreen";

export const metadata: Metadata = {
  title: "Teachings",
  description:
    "Messages on repentance, holiness and preparing for the coming of the Messiah.",
};

export default async function TeachingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ArchiveScreen
      kind="teachings"
      basePath="/teachings"
      eyebrow="The Archive"
      title="Teachings"
      lede="Messages on repentance, holiness and preparing the way for the coming of the Messiah."
      emptyLabel="teachings"
      params={readArchiveParams(await searchParams)}
    />
  );
}
