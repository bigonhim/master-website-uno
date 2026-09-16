"use client";

import { useEffect, useState } from "react";

/**
 * Nairobi time, beside the viewer's own.
 *
 * For a diaspora audience the commonest question about a live broadcast is
 * "what time is that where I am". Showing both answers it before it is asked.
 *
 * Renders nothing until mounted: the server and the viewer are in different
 * time zones, so rendering a time during SSR guarantees a hydration mismatch.
 */
export function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return <span className="text-body-sm text-ink-300">Nairobi (EAT)</span>;
  }

  const nairobi = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const local = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const sameZone = localZone === "Africa/Nairobi";

  return (
    <span className="text-body-sm text-ink-300">
      <span className="tabular-nums text-ink-100">{nairobi}</span> in Nairobi
      {sameZone ? null : (
        <>
          {" · "}
          <span className="tabular-nums text-ink-100">{local}</span> where you are
        </>
      )}
    </span>
  );
}
