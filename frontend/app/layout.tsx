import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { RadioBar } from "@/components/radio/RadioBar";
import { RadioProvider } from "@/components/radio/RadioProvider";
import { getRadioStatus } from "@/lib/api/radio";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fetched on the server so the bar renders the correct live/off-air state in
  // the first HTML byte.
  const initialStatus = await getRadioStatus();

  return (
    <html lang="en" className={`${montserrat.variable} ${sourceSerif.variable}`}>
      <body className="flex min-h-dvh flex-col bg-ink-25">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary-700 focus:px-4 focus:py-2 focus:text-ink-0"
        >
          Skip to content
        </a>
        {/*
          The provider wraps everything and is mounted here, in the root layout,
          because the root layout does not remount on App Router navigation.
          That is the entire mechanism keeping the stream alive between pages —
          so it must never be keyed on pathname or moved into a route group.
        */}
        <RadioProvider initialStatus={initialStatus}>
          <RadioBar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </RadioProvider>
      </body>
    </html>
  );
}
