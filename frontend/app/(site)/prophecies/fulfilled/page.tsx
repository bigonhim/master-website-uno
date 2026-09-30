import type { Metadata } from "next";

import { ArchiveScreen, readArchiveParams } from "@/components/content/ArchiveScreen";
import { ProphecyTabs } from "@/components/content/ProphecyTabs";

export const metadata: Metadata = {
  title: "Prophecies and their fulfilment",
  description:
    "Prophecies given through the Ministry of Repentance and Holiness whose fulfilment has been recorded.",
  alternates: { canonical: "/prophecies/fulfilled" },
};

export default async function FulfilledPropheciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // `fulfilled` is what this page is, not a filter a visitor may change.
  const params = readArchiveParams(await searchParams);
  delete params.fulfilled;

  return (
    <ArchiveScreen
      kind="prophecies"
      basePath="/prophecies/fulfilled"
      eyebrow="The Archive"
      title="Prophecies & their fulfilment"
      lede="Prophecies whose fulfilment has been recorded. Open one to see what was prophesied, and how it came to pass."
      emptyLabel="fulfilled prophecies"
      params={params}
      fixed={{ fulfilled: "true" }}
      tabs={<ProphecyTabs active="fulfilled" />}
      showFulfilment
    />
  );
}
