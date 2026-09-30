import type { Metadata } from "next";

import { ToastProvider } from "@/components/studio/Toaster";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: { index: false, follow: false },
};

/** The Studio: where the site is edited. Outside the (site) group, so none of
 *  the public site's chrome, and never indexed. */
export default function StudioRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-1 flex-col bg-ink-25">{children}</div>
    </ToastProvider>
  );
}
