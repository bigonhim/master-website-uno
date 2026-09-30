import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RadioBar } from "@/components/radio/RadioBar";
import { RadioProvider } from "@/components/radio/RadioProvider";
import { getRadioStatus } from "@/lib/api/radio";
import { getSiteContent } from "@/lib/api/site";

/**
 * Everything around a public page: the radio bar, the header and the footer.
 *
 * The provider wraps everything and is mounted in the (site) layout, which
 * does not remount on navigation between public pages. That is the entire
 * mechanism keeping the stream alive from page to page.
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [initialStatus, site] = await Promise.all([getRadioStatus(), getSiteContent()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary-700 focus:px-4 focus:py-2 focus:text-ink-0"
      >
        Skip to content
      </a>
      <RadioProvider initialStatus={initialStatus}>
        <RadioBar />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter contact={site.sections.contact} />
      </RadioProvider>
    </>
  );
}
