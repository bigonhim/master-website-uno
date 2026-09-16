import type { Metadata } from "next";

import { PrayerFlow } from "@/components/prayer/PrayerFlow";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "The Salvation Prayer",
  description:
    "How to make peace with God: what He offers, why we are separated, what He has done, and how to respond.",
  alternates: { canonical: "/salvation-prayer" },
};

/**
 * Every step is rendered into the HTML on the server. PrayerFlow turns it into
 * a stepper where JavaScript is available; where it is not, the page stays a
 * complete, readable document with a working response form.
 *
 * The old site's Salvation Prayer page contained no prayer at all — only a
 * verse and two phone numbers. That is the thing this page exists to fix.
 */

function Step({
  number,
  title,
  scripture,
  reference,
  children,
}: {
  number: string;
  title: string;
  scripture: string;
  reference: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${number}`}>
      <p className="text-eyebrow uppercase text-primary-500">{number}</p>
      <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
      <h2 id={`step-${number}`} className="text-h2 mt-5 max-w-[20ch] text-primary-900">
        {title}
      </h2>
      <Prose className="mt-5">
        <p>{children}</p>
      </Prose>
      <blockquote className="mt-6 border-l-2 border-gold-500 pl-5">
        <p className="max-w-prose font-prose text-prose-lg italic text-ink-700">
          {scripture}
        </p>
        <cite className="mt-2 block text-meta not-italic text-ink-500">{reference}</cite>
      </blockquote>
    </section>
  );
}

export default function SalvationPrayerPage() {
  const steps = [
    <Step
      key="1"
      number="Step one"
      title="God offers peace, and a life that does not end"
      scripture="For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
      reference="John 3:16"
    >
      God is not distant and He is not indifferent. He offers peace with Himself
      and a life that outlasts this one. That offer is the beginning of
      everything else on this page.
    </Step>,
    <Step
      key="2"
      number="Step two"
      title="But we are separated from Him"
      scripture="For all have sinned and fall short of the glory of God."
      reference="Romans 3:23"
    >
      Every person has gone their own way. That is what sin is — not merely
      breaking rules, but turning from the One who made us. It leaves a
      separation none of us can close from our side.
    </Step>,
    <Step
      key="3"
      number="Step three"
      title="God Himself closed the gap"
      scripture="For there is one God and one mediator between God and mankind, the man Christ Jesus, who gave himself as a ransom for all people."
      reference="1 Timothy 2:5–6"
    >
      Jesus Christ died in our place and rose again. He is the bridge: not a
      teacher pointing at a way, but the way itself, and the only one who has
      crossed from death back into life.
    </Step>,
    <Step
      key="4"
      number="Step four"
      title="Each of us must respond"
      scripture="Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God."
      reference="John 1:12"
    >
      Knowing this is not the same as receiving it. Repentance means turning —
      away from sin and towards Christ — and asking Him to be Lord of your life.
      It is a decision, and it is yours to make.
    </Step>,
    <section key="5" aria-labelledby="step-prayer">
      <p className="text-eyebrow uppercase text-primary-500">Step five</p>
      <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
      <h2 id="step-prayer" className="text-h2 mt-5 max-w-[20ch] text-primary-900">
        Pray this, and mean it
      </h2>
      <p className="mt-4 max-w-prose text-body-sm text-ink-600">
        The words are not a formula. Say them aloud, slowly, and mean them.
      </p>
      <blockquote className="mt-7 rounded-sm border border-primary-100 bg-primary-50 p-7">
        <p className="max-w-prose font-prose text-prose-lg text-ink-800">
          Lord Jesus, I come to You today. I confess that I have sinned against
          You and gone my own way. I am sorry, and I turn from my sin now. I
          believe that You died for me and that You rose again. I ask You to
          forgive me, to wash me clean, and to come into my life. From today I
          give You my life. Be my Lord and my Saviour, and lead me in Your way of
          repentance and holiness, all the days of my life. Amen.
        </p>
      </blockquote>
    </section>,
    <section key="6" aria-labelledby="step-decision">
      <p className="text-eyebrow uppercase text-primary-500">Step six</p>
      <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
      <h2 id="step-decision" className="text-h2 mt-5 max-w-[20ch] text-primary-900">
        What happens now
      </h2>
      <Prose className="mt-5">
        <p>
          If you prayed that prayer and meant it, God has heard you. Scripture
          says you can know it, not merely hope it.
        </p>
      </Prose>
      <blockquote className="mt-6 border-l-2 border-gold-500 pl-5">
        <p className="max-w-prose font-prose text-prose-lg italic text-ink-700">
          I write these things to you who believe in the name of the Son of God
          so that you may know that you have eternal life.
        </p>
        <cite className="mt-2 block text-meta not-italic text-ink-500">1 John 5:13</cite>
      </blockquote>
    </section>,
  ];

  return (
    <>
      <div className="border-b border-ink-100 bg-gradient-to-b from-primary-50 to-ink-0">
        <Container className="pb-12 pt-14 lg:pt-16">
          <p className="text-eyebrow uppercase text-primary-500">Begin here</p>
          <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
          <h1 className="text-display-xl mt-6 max-w-[15ch] text-primary-900">
            Make your peace with God
          </h1>
          <p className="mt-6 max-w-[54ch] font-prose text-prose-lg text-ink-600">
            Six short steps: what God offers, why we are separated from Him, what
            He has done about it, and how to respond.
          </p>
        </Container>
      </div>

      <Container width="prose" className="py-section-sm">
        <PrayerFlow steps={steps} totalSteps={steps.length} />
      </Container>
    </>
  );
}
