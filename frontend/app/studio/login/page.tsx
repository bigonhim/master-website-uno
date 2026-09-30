import type { Metadata } from "next";

import { Logo } from "@/components/brand/Logo";

import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const { next, expired } = await searchParams;
  // Only ever back into the Studio: an open redirect would let a link to this
  // page send an editor anywhere after signing in.
  const destination = next && /^\/studio(\/|$|\?)/.test(next) && !next.startsWith("//") ? next : "/studio";

  return (
    <main className="on-dark grid min-h-dvh flex-1 place-items-center bg-grad-sapphire px-4 py-12 grad-dither">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3 text-ink-0">
          <Logo size={48} onDark />
          <div>
            <p className="font-display text-body font-extrabold">Repentance &amp; Holiness</p>
            <p className="text-eyebrow uppercase text-cyan-400">Studio</p>
          </div>
        </div>
        <div className="rounded-lg bg-ink-0 p-6 shadow-lg sm:p-8">
          <h1 className="text-h3 text-primary-900">Sign in</h1>
          <p className="mt-1 text-body-sm text-ink-600">
            Edit the site&rsquo;s photos, videos, archive and words.
          </p>
          <SignInForm destination={destination} expired={expired === "1"} />
        </div>
        <p className="mt-6 text-center text-meta font-medium text-ink-0/70">
          Accounts are given by the site&rsquo;s administrator.
        </p>
      </div>
    </main>
  );
}
