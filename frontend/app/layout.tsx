import type { Metadata } from "next";

import { montserrat, sourceSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ministry of Repentance and Holiness",
    template: "%s | Ministry of Repentance and Holiness",
  },
  description:
    "Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${sourceSerif.variable}`}>
      {/*
        The radio provider mounts here in Phase 2, wrapping everything. The root
        layout does not remount on App Router navigation, which is the whole
        mechanism that keeps the stream playing between pages.
      */}
      <body className="flex min-h-dvh flex-col bg-ink-25">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
