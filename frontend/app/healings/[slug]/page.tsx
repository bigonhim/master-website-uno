import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailScreen, loadDetail } from "@/components/content/DetailScreen";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadDetail("healings", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.summary || undefined,
    alternates: { canonical: `/healings/${item.slug}` },
  };
}

export default async function HealingDetailPage({ params }: Params) {
  const { slug } = await params;
  const item = await loadDetail("healings", slug);
  if (!item) notFound();
  return <DetailScreen item={item} backHref="/healings" backLabel="Healings" />;
}
