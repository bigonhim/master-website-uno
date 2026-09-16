import { NextResponse } from "next/server";

import { getRadioStatus } from "@/lib/api/radio";

/**
 * The browser polls this, not Django directly. Keeping the API origin
 * server-side removes CORS from the picture entirely and lets us cache the
 * response at our own edge.
 */
export const revalidate = 20;

export async function GET() {
  const payload = await getRadioStatus();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" },
  });
}
