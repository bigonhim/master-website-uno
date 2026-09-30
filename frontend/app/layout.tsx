import type { Metadata } from "next";

import { montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ministry of Repentance and Holiness",
    template: "%s | Ministry of Repentance and Holiness",
  },
  description:
    "Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

/**
 * The document itself, shared by the public site and the Studio. Each brings
 * its own frame: app/(site)/layout.tsx the radio, header and footer;
 * app/studio/layout.tsx the editor's.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="flex min-h-dvh flex-col bg-ink-0">{children}</body>
    </html>
  );
}
