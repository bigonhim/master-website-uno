import { notFound } from "next/navigation";

import { PageHeader } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { StudioApiError, getEditor, studioGet } from "@/lib/studio/server";
import type { Gallery } from "@/lib/studio/types";

import { GalleryEditor } from "./GalleryEditor";

export const metadata = { title: "Gallery" };

const EMPTY: Omit<Gallery, "id" | "created_at" | "updated_at" | "version"> = {
  title: "",
  eyebrow: "Recognition",
  heading: "",
  place_name: "",
  place_detail: "",
  summary: "",
  photos: [],
  is_featured: false,
};

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getEditor();
  let gallery: Gallery | null = null;
  if (id !== "new") {
    if (!/^\d+$/.test(id)) notFound();
    try {
      gallery = await studioGet<Gallery>(`galleries/${id}/`);
    } catch (error) {
      if (error instanceof StudioApiError && error.status === 404) notFound();
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/studio/home/galleries", label: "Galleries" }}
        eyebrow="Gallery"
        title={gallery?.title || "New gallery"}
      />
      <GalleryEditor
        initial={gallery ?? { ...EMPTY, id: 0, created_at: "", updated_at: "", version: "" }}
        canChange={can(user, gallery ? "sitecontent.change_gallery" : "sitecontent.add_gallery")}
        canDelete={can(user, "sitecontent.delete_gallery")}
      />
    </div>
  );
}
