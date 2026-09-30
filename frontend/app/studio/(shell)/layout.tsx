import { StudioShell } from "@/components/studio/StudioShell";
import { getEditor } from "@/lib/studio/server";

/** Every Studio screen but sign-in and the preview frame. */
export default async function StudioShellLayout({ children }: { children: React.ReactNode }) {
  const user = await getEditor();
  return <StudioShell user={user}>{children}</StudioShell>;
}
