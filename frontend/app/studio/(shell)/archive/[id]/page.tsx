import { notFound } from "next/navigation";

import { PageHeader } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { KIND_LABELS } from "@/lib/studio/format";
import { StudioApiError, getEditor, studioGet } from "@/lib/studio/server";
import type { Item, ItemFields, Kind, Taxonomy } from "@/lib/studio/types";

import { ItemEditor } from "./ItemEditor";

export const metadata = { title: "Archive item" };

function blank(kind: Kind): ItemFields {
  return {
    kind,
    title: "",
    slug: "",
    kicker: "",
    speaker: "",
    summary: "",
    body: "",
    category: null,
    regions: [],
    series: null,
    position_in_series: null,
    published_at: null,
    prophecy_date: null,
    date_source: "unknown",
    date_precision: "unknown",
    is_fulfilled: false,
    fulfillment_summary: "",
    condition: "",
    is_anonymous: true,
    is_featured: false,
    needs_review: false,
    videos: [],
  };
}

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const [{ id }, { kind }] = await Promise.all([params, searchParams]);
  const [user, taxonomy] = await Promise.all([getEditor(), studioGet<Taxonomy>("taxonomy/")]);

  let item: Item | null = null;
  if (id !== "new") {
    if (!/^\d+$/.test(id)) notFound();
    try {
      item = await studioGet<Item>(`items/${id}/`);
    } catch (error) {
      if (error instanceof StudioApiError && error.status === 404) notFound();
      throw error;
    }
  }
  const newKind: Kind = kind && kind in KIND_LABELS ? (kind as Kind) : "prophecy";
  const label = KIND_LABELS[item?.kind ?? newKind];

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/studio/archive?kind=${item?.kind ?? newKind}`, label: label.many }}
        eyebrow={label.one}
        title={item ? item.title : `New ${label.one.toLowerCase()}`}
      />
      <ItemEditor
        key={item?.id ?? "new"}
        item={item}
        initial={item ?? blank(newKind)}
        taxonomy={taxonomy}
        canChange={can(user, item ? "content.change_contentitem" : "content.add_contentitem")}
        canDelete={can(user, "content.delete_contentitem")}
      />
    </div>
  );
}
