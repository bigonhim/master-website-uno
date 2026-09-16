import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * Proxy for the decision endpoint.
 *
 * The browser never talks to Django directly, which keeps the API origin
 * server-side and removes CORS from the picture. It also means no third party
 * ever sees this request: nothing on the Salvation Prayer page is instrumented.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/salvation/decisions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "We could not record your response. Please try again." },
      { status: 502 },
    );
  }
}
