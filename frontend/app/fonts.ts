import { Montserrat } from "next/font/google";

/**
 * Montserrat is the only typeface on the site, including long-form reading.
 *
 * It runs heavy: 500 is the reading weight, 800–900 the heading weights. The
 * ministry's own video graphics set everything in thick uppercase sans, and
 * the site now speaks in that same voice rather than a lighter cousin of it.
 * 400 stays loaded for the rare place a lighter step is needed for contrast
 * of weight, not for body copy.
 */
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  adjustFontFallback: true,
});
