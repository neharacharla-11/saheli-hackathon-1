import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Topic {
  id: string;
  title: string;
  line: string;
  first: { title: "Usually normal" | "Signs"; points: string[] };
  good: string[];
  doctor: string[];
  link?: { href: string; label: string };
}

const TOPICS: Topic[] = [
  {
    id: "discharge",
    title: "Discharge",
    line: "What's normal changes through your cycle.",
    first: {
      title: "Usually normal",
      points: [
        "Clear or white, and a little sticky or creamy.",
        "Wetter, clear and stretchy like egg white around ovulation.",
        "Thicker before your period, more in pregnancy.",
        "A mild smell of your own.",
      ],
    },
    good: ["Discharge keeps your vagina clean and healthy. It cleans itself.", "Cotton underwear and changing out of wet clothes soon help."],
    doctor: ["A strong fishy smell", "Green, grey or yellow colour", "Thick and lumpy like cottage cheese, with itching", "Blood between periods or after sex", "Pain, fever or pelvic pain with it"],
  },
  {
    id: "uti",
    title: "Urine infections (UTI)",
    line: "Burning when you pee is common, and treatable.",
    first: { title: "Signs", points: ["Burning or stinging when you pee", "Needing to pee often, but only a little comes out", "Cloudy or smelly urine, or a little blood", "Pain low in your tummy"] },
    good: [
      "See a doctor the same day. Antibiotics usually fix it quickly.",
      "Drink plenty of water and pee after sex.",
      "Wipe from front to back.",
      "Don't hold your pee for hours.",
    ],
    doctor: ["Urgently if you have a fever, chills or pain in your back or side (it may be reaching the kidneys)", "Urgently if you're pregnant", "Urgently if you're vomiting or feel very unwell", "If it keeps coming back"],
  },
  {
    id: "thrush-bv",
    title: "Thrush and BV",
    line: "The two most common causes of itching and odd discharge.",
    first: {
      title: "Signs",
      points: [
        "Thrush: itching, soreness, and thick white discharge like cottage cheese. Usually no smell.",
        "BV (bacterial vaginosis): thin grey-white discharge with a fishy smell, often stronger after sex. Usually no itching.",
      ],
    },
    good: [
      "Neither is an STI, and neither means you're unclean.",
      "Thrush is often treated with a cream or tablet from a pharmacy.",
      "BV needs a different treatment, usually from a doctor.",
      "Antibiotics, tight clothes, perfumed soaps and douching can trigger both.",
    ],
    doctor: ["It's your first time, so you know what it is", "You're pregnant", "It comes back 4 or more times a year", "Treatment from the pharmacy didn't work"],
  },
  {
    id: "sti",
    title: "STI testing",
    line: "A normal part of looking after yourself.",
    first: { title: "Usually normal", points: ["Many STIs have no symptoms at all.", "Testing is quick: a urine sample, a swab, or a blood test.", "Most STIs are easy to treat, and all can be managed."] },
    good: [
      "Get tested with every new partner, or once a year if you're sexually active.",
      "Only condoms protect against STIs.",
      "Clinics and doctors keep your results private.",
      "The HPV vaccine protects against the virus behind most cervical cancer.",
    ],
    doctor: ["Sores, blisters or warts in your genital area", "Unusual discharge, burning, or bleeding after sex", "Pain low in your belly, especially with fever", "A partner tells you they have an STI"],
  },
  {
    id: "dryness",
    title: "Dryness and painful sex",
    line: "Common, real and treatable. You don't have to put up with it.",
    first: {
      title: "Signs",
      points: ["Dryness, burning or itching", "Pain at the entrance, or deep inside, during sex", "Small tears or bleeding after sex"],
    },
    good: [
      "Common after birth, while breastfeeding, around menopause and on some medicines.",
      "Water- or silicone-based lubricants help, and vaginal moisturisers used regularly.",
      "Deep pain during sex can be a sign of endometriosis. Log it in your Pain diary.",
    ],
    doctor: ["Pain that keeps happening or is getting worse", "Bleeding after sex", "Dryness after menopause (a low-dose vaginal treatment can help)"],
    link: { href: "/app/pain", label: "Log it in the Pain diary" },
  },
  {
    id: "pelvic-floor",
    title: "Pelvic floor",
    line: "The muscles that hold everything up, and stop leaks.",
    first: {
      title: "Usually normal",
      points: [
        "Leaking a little when you cough, sneeze or jump is common after birth and in midlife.",
        "It usually gets much better with daily exercises.",
      ],
    },
    good: [
      "How: squeeze and lift as if stopping a wee and holding in wind. Don't hold your breath or squeeze your bottom.",
      "Slow: hold for up to 10 seconds, then fully relax. Do 10.",
      "Fast: 10 quick squeezes.",
      "Do this 3 times a day. You'll notice a difference in about 3 months.",
    ],
    doctor: ["A feeling of heaviness or a bulge down below", "Leaks that are getting worse, or bowel leaks", "No change after 3 months of exercises (a pelvic physio can help)"],
  },
  {
    id: "myths",
    title: "Hygiene myths",
    line: "Your vagina cleans itself. Less is more.",
    first: {
      title: "Usually normal",
      points: ["A mild smell and some discharge are healthy.", "Pubic hair is there for a reason. Removing it or not is your choice."],
    },
    good: [
      "Never douche or wash inside your vagina. It upsets the good bacteria and causes infections.",
      "Wash the outside (vulva) with plain water, or a mild unscented soap.",
      "Skip vaginal washes, wipes, sprays and steaming.",
      "Change pads every 4-6 hours and tampons every 4-8 hours.",
    ],
    doctor: ["A smell or discharge that changes and doesn't settle", "Itching that won't go away", "A fever with a tampon in (remove it and get urgent help)"],
  },
];

export function IntimatePage() {
  return (
    <>
      <PageHeader eyebrow="INTIMATE HEALTH" title="The basics nobody told us" lead="Plain answers to private questions. Nothing here is saved, and it's never shared with your Circle." />
      <div className="flex flex-col gap-3">
        {TOPICS.map((t) => (
          <details key={t.id} className="group card">
            <summary className="flex list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{t.title}</span>
                <span className="block text-sm text-ink-soft">{t.line}</span>
              </span>
              <ChevronDown size={20} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Box tone={t.first.title === "Usually normal" ? "green" : "soft"} title={t.first.title} points={t.first.points} />
              <Box tone="soft" title="Good to know" points={t.good} />
              <Box tone="amber" title="See a doctor" points={t.doctor} />
            </div>
            {t.link && (
              <Link href={t.link.href} className="btn btn-secondary btn-sm mt-4">
                {t.link.label}
              </Link>
            )}
          </details>
        ))}
        <p className="mt-2 text-sm text-ink-soft">Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
      </div>
    </>
  );
}

function Box({ tone, title, points }: { tone: "green" | "soft" | "amber"; title: string; points: string[] }) {
  const cls =
    tone === "green"
      ? "bg-[color-mix(in_srgb,var(--accent)_20%,var(--surface))] text-ink"
      : tone === "amber"
        ? "bg-[#FEF3C7] text-[#5f2b06]"
        : "bg-surface-2 text-ink";
  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <p className="mb-2 font-semibold">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
