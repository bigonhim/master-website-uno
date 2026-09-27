import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * The no-JavaScript path for the contact form: a native form POST, so a
 * message can still be sent from a feature phone or over a connection on
 * which the script never arrived.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const value = (key: string) => String(form.get(key) ?? "").trim();

  const payload = {
    topic: value("topic") || "other",
    name: value("name"),
    email: value("email"),
    phone: value("phone"),
    message: value("message"),
    honeypot: value("website"),
  };

  const origin = new URL(request.url).origin;
  const address = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(`${API_URL}/contact/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(address ? { "X-Forwarded-For": address } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // 303 so the browser follows with GET and a refresh cannot resubmit.
    return NextResponse.redirect(
      `${origin}/contact?${response.ok ? "sent=1" : "issue=1"}#message`,
      303,
    );
  } catch {
    return NextResponse.redirect(`${origin}/contact?issue=1#message`, 303);
  }
}
