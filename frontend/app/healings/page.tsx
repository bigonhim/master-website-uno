import type { Metadata } from "next";

import { ArchiveScreen, readArchiveParams } from "@/components/content/ArchiveScreen";

export const metadata: Metadata = {
  title: "Healings",
  description:
    "Testimonies of healing recorded at services and crusades across the nations.",
};

export default async function HealingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ArchiveScreen
      kind="healings"
      basePath="/healings"
      eyebrow="The Archive"
      title="Healings"
      lede="Testimonies of healing recorded at services and crusades across the nations."
      emptyLabel="healing testimonies"
      params={readArchiveParams(await searchParams)}
    />
  );
}
