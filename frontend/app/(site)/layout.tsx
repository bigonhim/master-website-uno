import { SiteChrome } from "@/components/layout/SiteChrome";

/** The public site. The Studio (app/studio) sits outside this group, so it
 *  has none of the site's chrome and never mounts the radio. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
