"use client";

import { useEffect, useState } from "react";

import { AboutPillars, AboutSection } from "@/components/home/sections/AboutSection";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { MessageSection } from "@/components/home/sections/MessageSection";
import { RadioPanel } from "@/components/home/sections/RadioPanel";
import { RecognitionSection } from "@/components/home/sections/RecognitionSection";
import { ScriptureBand } from "@/components/home/sections/ScriptureBand";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PREVIEW_READY, PREVIEW_UPDATE, type PreviewView } from "@/lib/studio/preview";

/**
 * Renders whatever the editor beside it sends, with the site's own
 * components. Messages are only accepted from the Studio page that holds this
 * frame, on the same origin.
 */
export function PreviewFrame() {
  const [view, setView] = useState<PreviewView | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === PREVIEW_UPDATE) setView(e.data.payload as PreviewView);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Links in a preview would navigate the frame away from the preview.
  useEffect(() => {
    const stop = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) e.preventDefault();
    };
    document.addEventListener("click", stop, true);
    return () => document.removeEventListener("click", stop, true);
  }, []);

  if (!view) return null;

  switch (view.view) {
    case "hero":
      return <HeroSection data={view.hero} slides={view.slides} />;
    case "about":
      return (
        <AboutSection data={view.intro}>
          <AboutPillars data={view.pillars} />
        </AboutSection>
      );
    case "message":
      return <MessageSection data={view.data} />;
    case "scripture":
      return <ScriptureBand data={view.data} />;
    case "radio":
      return (
        <RadioPanel
          data={view.data}
          action={
            <span className="inline-flex h-11 items-center justify-center rounded-sm bg-alert-600 px-5 font-display text-body-sm font-black uppercase tracking-wide text-sun">
              {view.data.button}
            </span>
          }
        />
      );
    case "recognition":
      return <RecognitionSection gallery={view.gallery} />;
    case "footer":
      return (
        <div className="flex min-h-dvh flex-col justify-end">
          <SiteFooter contact={view.contact} />
        </div>
      );
  }
}
