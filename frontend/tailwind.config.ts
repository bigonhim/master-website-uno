import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/** Tokens live as RGB channels in CSS vars so <alpha-value> modifiers survive. */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: v("--c-primary-50"),
          100: v("--c-primary-100"),
          200: v("--c-primary-200"),
          300: v("--c-primary-300"),
          400: v("--c-primary-400"),
          500: v("--c-primary-500"),
          600: v("--c-primary-600"),
          700: v("--c-primary-700"),
          800: v("--c-primary-800"),
          900: v("--c-primary-900"),
          950: v("--c-primary-950"),
          DEFAULT: v("--c-primary-700"),
        },
        ink: {
          0: v("--c-ink-0"),
          25: v("--c-ink-25"),
          50: v("--c-ink-50"),
          100: v("--c-ink-100"),
          200: v("--c-ink-200"),
          300: v("--c-ink-300"),
          400: v("--c-ink-400"),
          500: v("--c-ink-500"),
          600: v("--c-ink-600"),
          700: v("--c-ink-700"),
          800: v("--c-ink-800"),
          900: v("--c-ink-900"),
        },
        gold: {
          400: v("--c-gold-400"),
          500: v("--c-gold-500"),
          700: v("--c-gold-700"),
          800: v("--c-gold-800"),
        },
        // Banned on white (1.07:1). Legal only inside .on-dark.
        sun: v("--c-sun"),
        success: v("--c-success"),
        danger: v("--c-danger"),
        live: { 400: v("--c-live-400"), 600: v("--c-live-600") },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        prose: ["var(--font-prose)", "Georgia", "serif"],
      },
      fontSize: {
        eyebrow: ["0.75rem", { lineHeight: "1", letterSpacing: "0.18em", fontWeight: "600" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
        meta: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "prose-lg": ["1.1875rem", { lineHeight: "1.72" }],
        h4: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        h2: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": [
          "clamp(1.875rem, 1.4rem + 1.9vw, 3rem)",
          { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
        "display-xl": [
          "clamp(2.25rem, 1.5rem + 3.1vw, 4rem)",
          { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        "display-2xl": [
          "clamp(2.5rem, 1.5rem + 4.2vw, 4.75rem)",
          { lineHeight: "1", letterSpacing: "-0.035em", fontWeight: "800" },
        ],
      },
      spacing: {
        "section-xs": "3rem",
        "section-sm": "4.5rem",
        section: "6rem",
        "section-lg": "clamp(5rem, 3.5rem + 5vw, 7.5rem)",
        radio: "var(--radio-h)",
        nav: "var(--nav-h)",
      },
      borderRadius: {
        DEFAULT: "4px",
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "14px",
      },
      // Tinted with the brand navy; black shadows over cool neutrals look muddy.
      boxShadow: {
        xs: "0 1px 2px rgba(10,26,92,.06)",
        sm: "0 2px 6px -1px rgba(10,26,92,.08), 0 1px 2px rgba(10,26,92,.06)",
        md: "0 8px 24px -6px rgba(10,26,92,.12), 0 2px 6px -2px rgba(10,26,92,.08)",
        lg: "0 20px 48px -12px rgba(10,26,92,.18)",
        player: "0 1px 0 0 rgba(224,168,0,.85)",
      },
      // Re-cut for the deeper ramp. The old stops were mixed from the previous,
      // lighter blue and would read as a different brand beside it.
      backgroundImage: {
        "grad-royal": "linear-gradient(158deg,#0E2478 0%,#0A1A5C 46%,#060E33 100%)",
        "grad-dawn": "linear-gradient(180deg,#FFFFFF 0%,#EEF3FD 55%,#D6E2FA 100%)",
        "grad-halo":
          "radial-gradient(62% 58% at 50% 0%,#D6E2FA 0%,rgba(238,243,253,0) 72%)",
        "grad-azure": "linear-gradient(135deg,#1533A0 0%,#0A1A5C 100%)",
        "grad-veil":
          "linear-gradient(180deg,rgba(4,8,31,0) 0%,rgba(4,8,31,.55) 58%,rgba(4,8,31,.9) 100%)",
        "grad-rule": "linear-gradient(90deg,#E0A800 0%,#F5C542 50%,#E0A800 100%)",
      },
      maxWidth: { prose: "68ch", container: "78rem" },
      transitionTimingFunction: { emphasis: "cubic-bezier(.2,.8,.2,1)" },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    plugin(({ addUtilities }) => {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
        ".text-balance": { "text-wrap": "balance" },
        ".text-pretty": { "text-wrap": "pretty" },
      });
    }),
  ],
} satisfies Config;
