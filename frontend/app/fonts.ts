import { Montserrat, Source_Serif_4 } from "next/font/google";

/**
 * Montserrat carries everything structural — nav, buttons, eyebrows, headings,
 * metadata — so the brand reads as Montserrat wherever you look.
 */
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  adjustFontFallback: true,
});

/**
 * Source Serif takes long-form reading only: transcripts, testimonies, the
 * salvation prayer. Montserrat is a geometric sans with closed apertures and is
 * genuinely tiring across a long transcript — and transcripts are this archive's
 * core asset. The sans-chrome / serif-content split also buys a hierarchy
 * contrast that a single family cannot.
 */
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-prose",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  adjustFontFallback: true,
});
