import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: true },
};

/** Where the no-JavaScript form lands. */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hadIssue = (await searchParams).issue === "1";

  return (
    <>
      <div className="on-dark grad-dither bg-grad-royal">
        <Container className="py-section-sm">
          <Eyebrow rule>Your response</Eyebrow>
          <h1 className="text-display-lg mt-6 max-w-[18ch]">
            {hadIssue ? "We could not record that" : "Welcome home"}
          </h1>
        </Container>
      </div>

      <Container width="prose" className="py-section-sm">
        <Prose size="lg">
          {hadIssue ? (
            <>
              <p>
                Something went wrong on our side and your response was not saved.
                Your prayer stands regardless — it was never dependent on this
                form.
              </p>
              <p>
                Please try again, or contact the ministry directly on{" "}
                <a href="tel:+254715276091">+254 715 276091</a>.
              </p>
            </>
          ) : (
            <>
              <p>
                Your response has been recorded. If you asked us to contact you,
                someone from the ministry will be in touch.
              </p>
              <p>
                Begin with the teachings on repentance and holiness, and if the
                radio is on air you can listen from the bar at the top of any
                page.
              </p>
            </>
          )}
        </Prose>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/teachings"
            className="font-display text-body font-semibold text-primary-700 underline underline-offset-4"
          >
            Go to the teachings →
          </Link>
          <Link
            href="/salvation-prayer"
            className="font-display text-body font-semibold text-ink-600 underline underline-offset-4"
          >
            Back to the prayer
          </Link>
        </div>
      </Container>
    </>
  );
}
