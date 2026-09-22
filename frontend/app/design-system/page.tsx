import type { Metadata } from "next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Prose } from "@/components/ui/Prose";
import { Section } from "@/components/ui/Section";

/**
 * The design gallery.
 *
 * This exists so a developer can SEE the existing components before writing a
 * new one. The previous attempt at this project had two components total and
 * copy-pasted its search input and YouTube embed across pages; being able to
 * look at what already exists is the cheapest guard against that.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

// Written out in full, deliberately. Tailwind's JIT scans source for static
// class strings, so `bg-primary-${step}` compiles to nothing and the swatch
// renders invisible — a failure that passes the build and only shows up by eye.
const PRIMARY: Array<[string, string]> = [
  ["primary-50", "bg-primary-50"],
  ["primary-100", "bg-primary-100"],
  ["primary-200", "bg-primary-200"],
  ["primary-300", "bg-primary-300"],
  ["primary-400", "bg-primary-400"],
  ["primary-500", "bg-primary-500"],
  ["primary-600", "bg-primary-600"],
  ["primary-700", "bg-primary-700"],
  ["primary-800", "bg-primary-800"],
  ["primary-900", "bg-primary-900"],
  ["primary-950", "bg-primary-950"],
];

const INK: Array<[string, string]> = [
  ["ink-0", "bg-ink-0"],
  ["ink-25", "bg-ink-25"],
  ["ink-50", "bg-ink-50"],
  ["ink-100", "bg-ink-100"],
  ["ink-200", "bg-ink-200"],
  ["ink-300", "bg-ink-300"],
  ["ink-400", "bg-ink-400"],
  ["ink-500", "bg-ink-500"],
  ["ink-600", "bg-ink-600"],
  ["ink-700", "bg-ink-700"],
  ["ink-800", "bg-ink-800"],
  ["ink-900", "bg-ink-900"],
];

function Swatch({ label, className, note }: { label: string; className: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 rounded-sm ring-1 ring-inset ring-ink-900/10 ${className}`} />
      <span className="font-mono text-caption text-ink-600">{label}</span>
      {note ? <span className="text-caption text-ink-500">{note}</span> : null}
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink-100 py-8 first:border-t-0">
      <h3 className="text-h4 mb-5 text-ink-900">{title}</h3>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <Section tone="royal" spacing="sm">
        <Eyebrow rule>Internal reference</Eyebrow>
        <h1 className="text-display-xl mt-5 max-w-[18ch]">Design system</h1>
        <p className="mt-5 max-w-[60ch] text-body text-ink-200">
          Every token and primitive in one place. Check here before building a new
          component — if it already exists, use it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="gold">Gold on dark</Button>
          <Button variant="secondary">Secondary on dark</Button>
          <Button variant="ghost">Ghost on dark</Button>
        </div>
      </Section>

      <Container className="py-section-sm">
        <Row title="Primary ramp — built from #0F268C">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-11">
            {PRIMARY.map(([label, className]) => (
              <Swatch
                key={label}
                label={label}
                className={className}
                note={label === "primary-700" ? "brand · ~15:1 on white" : undefined}
              />
            ))}
          </div>
        </Row>

        <Row title="Ink — cooled to ~222° so surfaces share the brand's family">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-12">
            {INK.map(([label, className]) => (
              <Swatch key={label} label={label} className={className} />
            ))}
          </div>
        </Row>

        <Row title="Gold and yellow — the rule that must never be broken">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Swatch label="sun #ffff00" className="bg-sun" note="ON BLUE ONLY · 1.07:1 on white" />
            <Swatch label="gold-400" className="bg-gold-400" note="text on dark · 7.7:1" />
            <Swatch label="gold-500" className="bg-gold-500" note="fill only · 2.15:1 on white" />
            <Swatch label="gold-700" className="bg-gold-700" note="large text on white" />
            <Swatch label="gold-800" className="bg-gold-800" note="body text on white · 4.65:1" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="on-dark rounded-sm bg-primary-700 p-5">
              <p className="text-body font-semibold text-sun">Legal: #ffff00 on brand blue</p>
              <p className="mt-1 text-body-sm text-gold-400">And gold-400 alongside it.</p>
            </div>
            <div className="rounded-sm bg-ink-0 p-5 ring-1 ring-inset ring-ink-200">
              <p className="text-body font-semibold text-gold-800">
                Legal: gold-800 is the only gold for body text on white
              </p>
              <p className="mt-1 text-body-sm text-ink-600">
                Yellow on white is banned outright, and a unit test enforces it.
              </p>
            </div>
          </div>
        </Row>

        <Row title="Gradients">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Swatch label="grad-royal" className="bg-grad-royal" note="mastheads, footer" />
            <Swatch label="grad-dawn" className="bg-grad-dawn" note="light-blue transition" />
            <Swatch label="grad-azure" className="bg-grad-azure" note="primary fills" />
            <Swatch label="grad-halo" className="bg-grad-halo" note="atmospheric wash" />
            <Swatch label="grad-veil" className="bg-grad-veil" note="over video thumbnails" />
            <Swatch label="grad-rule" className="bg-grad-rule" note="red + navy broadcast rule" />
          </div>
        </Row>

        <Row title="Type scale — Montserrat for structure">
          <div className="space-y-4">
            <p className="text-display-2xl">Display 2xl</p>
            <p className="text-display-xl">Display xl</p>
            <p className="text-display-lg">Display lg</p>
            <p className="text-h2">Heading 2</p>
            <p className="text-h3">Heading 3</p>
            <p className="text-h4">Heading 4</p>
            <p className="text-eyebrow uppercase text-primary-500">Eyebrow · tracked 0.18em</p>
            <p className="text-body">Body — the default UI text size.</p>
            <p className="text-body-sm text-ink-600">Body small — secondary copy.</p>
            <p className="text-meta tabular-nums text-ink-600">Meta · 12 Sept 2026 · 47:12</p>
          </div>
        </Row>

        <Row title="Prose — Source Serif, reading column only">
          <Prose size="lg">
            <p>
              A voice of one calling: in the wilderness prepare the way for the LORD;
              make straight in the desert a highway for our God.
            </p>
            <blockquote>
              Transcripts, testimonies and the salvation prayer set in Source Serif at
              68ch. Everything structural around them stays Montserrat.
            </blockquote>
          </Prose>
        </Row>

        <Row title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="gold">Gold</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Row>

        <Row title="Badges — semantic, separate from the brand accent">
          <div className="flex flex-wrap gap-2">
            <Badge tone="draft">Draft</Badge>
            <Badge tone="published">Published</Badge>
            <Badge tone="fulfilled">Fulfilled</Badge>
            <Badge tone="pending">Pending</Badge>
            <Badge tone="danger">Video unavailable</Badge>
            <Badge tone="live" dot>
              On air
            </Badge>
            <Badge tone="offair" dot>
              Off air
            </Badge>
          </div>
          <p className="mt-3 text-body-sm text-ink-600">
            Off air is grey, never red — it is a normal state, not a fault.
          </p>
        </Row>

        <Row title="Section tones">
          <p className="text-body-sm text-ink-600">
            A page holds one dominant dark mass. The contrast between it and the milk
            ground is the whole effect; spreading colour evenly is what makes a light
            theme read as bland.
          </p>
        </Row>
      </Container>

      <Section tone="dawn" spacing="sm">
        <Eyebrow rule>tone=&quot;dawn&quot;</Eyebrow>
        <p className="mt-4 text-body text-ink-700">
          The light-blue gradient, used where a white section meets the footer.
        </p>
      </Section>
    </>
  );
}
