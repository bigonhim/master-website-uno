import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailScreen, loadDetail } from "@/components/content/DetailScreen";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadDetail("teachings", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.summary || undefined,
    alternates: { canonical: `/teachings/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.summary || undefined,
      images: item.videos[0]?.thumbnail_url
        ? [item.videos[0].thumbnail_url]
        : undefined,
    },
  };
}

export default async function TeachingDetailPage({ params }: Params) {
  const { slug } = await params;
  const item = await loadDetail("teachings", slug);
  if (!item) notFound();
  return <DetailScreen item={item} backHref="/teachings" backLabel="Teachings" />;
}
