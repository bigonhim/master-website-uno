import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * Proxy for the contact endpoint. As with the Salvation Prayer, the browser
 * never talks to Django directly: the API origin stays server-side and CORS
 * stays out of the picture.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/contact/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The sender's address, so the API throttles each person and not
        // this server as though it were one very talkative visitor.
        ...forwarded(request),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "We could not send your message. Please try again." },
      { status: 502 },
    );
  }
}

function forwarded(request: Request): Record<string, string> {
  const address = request.headers.get("x-forwarded-for");
  return address ? { "X-Forwarded-For": address } : {};
}
