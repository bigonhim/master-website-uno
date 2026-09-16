import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * The no-JavaScript path for the Salvation Prayer.
 *
 * A native form POST, so the response works on a feature phone, behind a
 * corporate proxy that strips scripts, or when the JS bundle simply fails to
 * arrive on a poor connection. For this page in particular, "it works when
 * everything loads" is not good enough.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const value = (key: string) => String(form.get(key) ?? "");

  const payload = {
    decision: value("decision") || "prayed",
    name: value("name"),
    email: value("email"),
    country: value("country"),
    message: value("message"),
    wants_follow_up: form.get("wants_follow_up") === "yes",
    honeypot: value("website"),
  };

  const origin = new URL(request.url).origin;

  try {
    const response = await fetch(`${API_URL}/salvation/decisions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // 303 so the browser follows with GET and a refresh cannot resubmit.
    return NextResponse.redirect(
      `${origin}/salvation-prayer/thank-you${response.ok ? "" : "?issue=1"}`,
      303,
    );
  } catch {
    return NextResponse.redirect(`${origin}/salvation-prayer/thank-you?issue=1`, 303);
  }
}
