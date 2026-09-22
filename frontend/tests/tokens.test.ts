import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The yellow-on-white bug is the single most likely regression on this project.
 * A failing test prevents it; a style guide does not.
 *
 * This parses the real token values out of globals.css, so changing a token
 * without checking its contrast fails the build rather than shipping.
 */

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

function token(name: string): [number, number, number] {
  const match = css.match(new RegExp(`--${name}:\\s*([\\d]+)\\s+([\\d]+)\\s+([\\d]+)\\s*;`));
  if (!match) throw new Error(`Token --${name} not found in globals.css`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(token(a)), luminance(token(b))];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "c-ink-0";
const BRAND = "c-primary-700";

describe("brand colour on white", () => {
  it("primary-700 is AAA at every size", () => {
    expect(contrast(BRAND, WHITE)).toBeGreaterThanOrEqual(12.5);
  });

  it("primary-500 passes AA for links", () => {
    expect(contrast("c-primary-500", WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("yellow — the rule that must never be broken", () => {
  it("pure #ffff00 is AAA on the brand blue", () => {
    expect(contrast("c-sun", BRAND)).toBeGreaterThanOrEqual(7);
  });

  it("pure #ffff00 is ILLEGAL on white and must stay that way", () => {
    // Guarding the ban itself: if someone 'fixes' this by darkening --c-sun,
    // the assertion above breaks instead, forcing a deliberate decision.
    expect(contrast("c-sun", WHITE)).toBeLessThan(3);
  });

  it("gold-500 is a FILL only — it fails even the 3:1 non-text bar on white", () => {
    expect(contrast("c-gold-500", WHITE)).toBeLessThan(3);
  });

  it("gold-800 is the only gold allowed for body text on white", () => {
    expect(contrast("c-gold-800", WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("gold-400 is legible on the brand blue", () => {
    expect(contrast("c-gold-400", BRAND)).toBeGreaterThanOrEqual(7);
  });
});

describe("broadcast palette — the colours from the ministry's video graphics", () => {
  it("cyan-400 is ILLEGAL on white, like yellow: navy surfaces only", () => {
    expect(contrast("c-cyan-400", WHITE)).toBeLessThan(3);
    expect(contrast("c-cyan-400", BRAND)).toBeGreaterThanOrEqual(7);
  });

  it("cyan-700 is the only cyan allowed for text on white", () => {
    expect(contrast("c-cyan-700", WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("alert-600 is AA text on white", () => {
    expect(contrast("c-alert-600", WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("the video's yellow-on-red tag (KindTag prophecy, LIVE) passes AA", () => {
    expect(contrast("c-sun", "c-alert-600")).toBeGreaterThanOrEqual(4.5);
  });

  it("alert-500 is a fill or large type only — it fails AA body text on white", () => {
    const ratio = contrast("c-alert-500", WHITE);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });

  it("navy type on the teaching (cyan) and healing (yellow) tags is AAA", () => {
    expect(contrast("c-primary-900", "c-cyan-400")).toBeGreaterThanOrEqual(7);
    expect(contrast("c-primary-900", "c-sun")).toBeGreaterThanOrEqual(7);
  });
});

describe("text neutrals on white", () => {
  it("ink-800 body text is AAA", () => {
    expect(contrast("c-ink-800", WHITE)).toBeGreaterThanOrEqual(12);
  });

  it("ink-600 secondary text is AA", () => {
    expect(contrast("c-ink-600", WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("ink-500 is large-text/placeholder only, never body copy", () => {
    const ratio = contrast("c-ink-500", WHITE);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });
});

describe("live indicator", () => {
  it("live-600 reads on white", () => {
    expect(contrast("c-live-600", WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it("live-400 reads on the blue radio bar", () => {
    expect(contrast("c-live-400", BRAND)).toBeGreaterThanOrEqual(3);
  });
});

describe("token integrity", () => {
  it("declares color-scheme: light so browsers do not auto-darken form controls", () => {
    expect(css).toMatch(/color-scheme:\s*light/);
  });

  it("exposes --radio-h, which every sticky offset derives from", () => {
    expect(css).toMatch(/--radio-h:/);
  });
});
