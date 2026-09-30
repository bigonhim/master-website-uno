import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Prepare the Way",
  description:
    "What the ministry preaches to the nations awaiting the Messiah: repentance, holiness, righteousness, new birth, watchfulness — each on the scripture it is drawn from.",
  alternates: { canonical: "/salvation-prayer" },
};

/**
 * The ministry's call, on the watching colours — the sapphire and the video
 * yellow of "THE MESSIAH IS COMING". The page once carried a six-step guided
 * prayer as well; the ministry asked for the call alone.
 */
export default function SalvationPrayerPage() {
  return (
    <section
      aria-labelledby="prepare-way-heading"
      className="on-dark relative overflow-hidden bg-grad-sapphire text-ink-0"
    >
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <Container className="relative py-section-sm">
        <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
          <span aria-hidden className="h-1 w-10 bg-grad-rule" />
          The ministry&apos;s call
        </p>
        <h1
          id="prepare-way-heading"
          className="mt-5 text-[clamp(2rem,1.2rem+2vw,2.75rem)] font-black uppercase leading-[1.05] tracking-[-0.03em] text-ink-0"
        >
          Prepare the way —{" "}
          <span className="whitespace-nowrap bg-sun px-[0.18em] pb-[0.04em] pt-[0.1em] text-primary-950">
            the Messiah is coming
          </span>
        </h1>
        <p className="mt-5 max-w-[58ch] text-body text-ink-0/80">
          What the ministry preaches to the nations is the road of readiness: the life
          that stays prepared for the glorious coming of THE LORD JESUS CHRIST.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PREPARE_THE_WAY.map((card) => (
            <li
              key={card.title}
              className="flex flex-col rounded-lg bg-primary-950/45 p-6 ring-1 ring-inset ring-ink-0/10 backdrop-blur-[2px] transition-all duration-300 ease-emphasis hover:-translate-y-1 hover:ring-cyan-400/50 sm:p-7"
            >
              <p className="text-eyebrow uppercase text-cyan-400">{card.eyebrow}</p>
              <h2 className="mt-3 text-h4 text-ink-0">{card.title}</h2>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-0/80">
                {card.body}
              </p>
              <blockquote className="mt-auto border-l-2 border-gold-400 pl-4 pt-5">
                <p className="font-prose text-body-sm italic text-ink-0/90">
                  &ldquo;{card.scripture}&rdquo;
                </p>
                <cite className="mt-2 block text-meta not-italic text-cyan-400">
                  {card.reference}
                </cite>
              </blockquote>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// The road the ministry preaches for the nations awaiting the Messiah, each
// standing on the scripture it is drawn from.
const PREPARE_THE_WAY = [
  {
    eyebrow: "Turn",
    title: "Repentance",
    body: "The ministry's first cry, and the beginning of readiness: turn from sin and return to GOD, that your sins may be wiped out.",
    scripture:
      "Repent, then, and turn to God, so that your sins may be wiped out, that times of refreshing may come from the Lord.",
    reference: "Acts 3:19",
  },
  {
    eyebrow: "Be set apart",
    title: "Holiness",
    body: "Holiness is not optional for those awaiting THE LORD — it is the garment in which the Church meets Him.",
    scripture:
      "Make every effort to live in peace with everyone and to be holy; without holiness no one will see the Lord.",
    reference: "Hebrews 12:14",
  },
  {
    eyebrow: "Sow now",
    title: "Righteousness",
    body: "Right living sown today is reaped at His appearing; it is time to seek THE LORD while He may be found.",
    scripture:
      "Sow righteousness for yourselves, reap the fruit of unfailing love, and break up your unplowed ground; for it is time to seek the LORD.",
    reference: "Hosea 10:12",
  },
  {
    eyebrow: "Be made new",
    title: "Be born again",
    body: "Salvation is the doorway onto the road: receive THE LORD JESUS CHRIST and be made a new creation.",
    scripture:
      "Very truly I tell you, no one can see the kingdom of God unless they are born again.",
    reference: "John 3:3",
  },
  {
    eyebrow: "Keep oil in your lamp",
    title: "Watchfulness",
    body: "Like the wise virgins, the ready keep their lamps burning — prayer, the word and fellowship, while the hour is unknown.",
    scripture: "Therefore keep watch, because you do not know the day or the hour.",
    reference: "Matthew 25:13",
  },
  {
    eyebrow: "The vision",
    title: "Prepare the way",
    body: "The vision over the ministry: a voice calling the nations to make the way straight for the coming of THE LORD.",
    scripture:
      "A voice of one calling: 'In the wilderness prepare the way for the LORD; make straight in the desert a highway for our God.'",
    reference: "Isaiah 40:3",
  },
];
