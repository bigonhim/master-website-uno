import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailScreen, loadDetail, readAutoplay } from "@/components/content/DetailScreen";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadDetail("prophecies", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.summary || undefined,
    alternates: { canonical: `/prophecies/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.summary || undefined,
      images: item.videos[0]?.thumbnail_url
        ? [item.videos[0].thumbnail_url]
        : undefined,
    },
  };
}

export default async function ProphecyDetailPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const item = await loadDetail("prophecies", slug);
  if (!item) notFound();
  return (
    <DetailScreen
      item={item}
      backHref="/prophecies"
      backLabel="Prophecies"
      autoplay={await readAutoplay(searchParams)}
    />
  );
}
