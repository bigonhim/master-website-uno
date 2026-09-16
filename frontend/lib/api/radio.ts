import type { RadioStatusPayload } from "./types";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * Fetched on the server so the bar renders the correct state in the first HTML
 * byte — no flash of "connecting", no layout shift, no client waterfall.
 *
 * This is the one place a fallback is legitimate, and it is not fake content:
 * if the backend is unreachable we cannot claim the station is live, so we say
 * "unknown" and let the bar show a retry. Everywhere else, an outage renders an
 * honest error rather than invented data.
 */
export async function getRadioStatus(): Promise<RadioStatusPayload> {
  try {
    const response = await fetch(`${API_URL}/radio/status/`, {
      next: { revalidate: 20 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Radio status ${response.status}`);
    return (await response.json()) as RadioStatusPayload;
  } catch {
    return {
      status: "unknown",
      station_name: "Jesus is LORD Radio",
      stream_url: "",
      now_playing: null,
      artwork_url: null,
      offline_message: "Station status is unavailable right now.",
      schedule_note: "",
      stale: true,
      checked_at: new Date().toISOString(),
    };
  }
}
