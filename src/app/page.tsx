import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Brain,
  CalendarHeart,
  Check,
  Dumbbell,
  Flower2,
  HeartHandshake,
  HeartPulse,
  Lock,
  Mail,
  Plus,
  Salad,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/BrandIcons";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { LanguagePicker, TrySampleButton } from "@/components/landing/LandingClient";

/* ---------------- Content ---------------- */

const PHASES = [
  { name: "Period", days: "Days 1–5", color: "var(--ph-period)", line: "Rest, iron-rich food and gentle movement. Saheli goes softer with you." },
  { name: "Follicular", days: "Days 6–11", color: "var(--ph-follicular)", line: "Energy rises. A good time to try new workouts and plan big things." },
  { name: "Ovulation", days: "Days 12–15", color: "var(--ph-ovulation)", line: "You're at your strongest and most social. Lift heavier, say yes." },
  { name: "Luteal", days: "Days 16–28", color: "var(--ph-luteal)", line: "A little more food, steadier sugar and calmer evenings help most." },
];

const FEATURE_GROUPS: { name: string; icon: LucideIcon; features: [string, string][] }[] = [
  {
    name: "Every day",
    icon: Sun,
    features: [
      ["10-second check-in", "Mood, energy and body in three taps."],
      ["Daily checklist", "Supplements and medicines, ticked off in a tap."],
      ["Phone reminders", "Gentle nudges for pills, water and medicines."],
      ["Get help", "Call, WhatsApp or text your people in one tap."],
      ["Works offline", "Opens even with no signal."],
    ],
  },
  {
    name: "Cycle",
    icon: CalendarHeart,
    features: [
      ["Cycle ring and Body Weather", "How today will likely feel, before it starts."],
      ["Predictions that learn", "Built on your own cycle length, not an average."],
      ["Weight calendar", "Read alongside your cycle, so water weight doesn't scare you."],
      ["Calendar sync", "Add your cycle to your phone's calendar."],
    ],
  },
  {
    name: "Food",
    icon: Salad,
    features: [
      ["Build your thali", "150 foods, Indian first, plus a search of thousands more."],
      ["Snap your plate", "A photo of your meal becomes a logged meal."],
      ["Eat for your phase", "Meals and simple recipes for each week of your cycle."],
      ["Grocery list", "Share it on WhatsApp in one tap."],
    ],
  },
  {
    name: "Movement",
    icon: Dumbbell,
    features: [
      ["Workouts for your phase", "Home or gym, 15 to 45 minutes."],
      ["Steps from your health app", "Import from Apple Health or Android."],
      ["A plan from your coach", "Ask for a workout plan made for you."],
    ],
  },
  {
    name: "Mind",
    icon: Brain,
    features: [
      ["Your companion", "A friend you name, who knows how your day is going."],
      ["Breathe and calm sounds", "Box breathing, 4-7-8 and sounds you can mix."],
      ["Journal", "Write, or speak in English, Hindi or Marathi."],
      ["PMDD check", "For strong premenstrual feelings. A flag, not a diagnosis."],
    ],
  },
  {
    name: "Health",
    icon: Stethoscope,
    features: [
      ["Health check", "Patterns in your logs worth taking to your doctor."],
      ["Report reading", "Upload a PDF or photo and see what each value means."],
      ["Sugar log", "Fasting and after-meal readings in mg/dL or mmol/L."],
      ["Body measurements", "Waist, hips and more. Inches lost tell the real story."],
      ["Health app import", "Steps, sleep and weight from your phone."],
      ["Doctor summary", "One printable page for your next appointment."],
    ],
  },
  {
    name: "Pregnancy",
    icon: Baby,
    features: [
      ["Week by week", "Baby's size, your body and what to ask at each scan."],
      ["Kick counter and contraction timer", "Simple, calm and one tap each."],
      ["Blood pressure and weight gain", "With clear signs to call your doctor."],
      ["Baby book and birth plan", "Keep the moments, print the plan."],
    ],
  },
  {
    name: "Every stage",
    icon: Sprout,
    features: [
      ["PCOS care", "Insulin-friendly food and steady movement."],
      ["Temperature and ovulation tests", "See your fertile window take shape."],
      ["Baby tracker", "Feeds, nappies and sleep for the first months."],
      ["Menopause score", "11 symptoms tracked week by week."],
      ["First periods", "Explained kindly, with no weight or calories."],
    ],
  },
  {
    name: "Care",
    icon: HeartPulse,
    features: [
      ["Contraception", "Pill reminders and what to do if you miss one."],
      ["Screenings", "The checks for your age, with due dates."],
      ["Pain diary", "Spots patterns worth a doctor's look. A flag, not a diagnosis."],
      ["Intimate health", "Plain answers to private questions."],
      ["Talk to an expert", "Ask Neha for a personal diet or workout plan."],
    ],
  },
  {
    name: "Family and privacy",
    icon: HeartHandshake,
    features: [
      ["Family profiles", "One phone, every woman in the family."],
      ["Circle", "Your people get support cues, never your logs."],
      ["Encrypted backup", "Locked on your phone before it leaves. Only you hold the key."],
      ["PIN lock and discreet mode", "For a shared phone."],
    ],
  },
];

const STAGES = [
  { name: "First periods", line: "Gentle answers, a period kit list and when to tell a trusted adult." },
  { name: "Regular cycle", line: "Food, movement and mood that follow your four phases." },
  { name: "PCOS / PCOD", line: "Steady energy, insulin-friendly meals and kind tracking." },
  { name: "Trying to conceive", line: "Your fertile window, temperatures and ovulation tests." },
  { name: "Pregnancy", line: "Week by week, scans, kicks and a birth plan." },
  { name: "Postpartum", line: "Recovery, feeding, your feelings and a baby tracker." },
  { name: "Menopause", line: "Hot flashes, sleep, bones and heart, with a symptom score." },
  { name: "Thyroid, diabetes and more", line: "Medicine reminders, sugar logs and plans set by your coach." },
];

const FAMILY = [
  { name: "Sunita", relation: "Mother", stage: "Perimenopause" },
  { name: "Anaya", relation: "Daughter", stage: "First periods" },
  { name: "Meera", relation: "Daughter", stage: "PCOS" },
];

const CONTACT_LINKS = [
  {
    label: "WhatsApp",
    href: `https://wa.me/918767327311?text=${encodeURIComponent("Hi Neha, I found Saheli")}`,
    icon: <WhatsAppIcon size={18} />,
  },
  { label: "Instagram", href: "https://www.instagram.com/neha.racharla/", icon: <InstagramIcon size={18} /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/neha-racharla-a9467b259/", icon: <LinkedInIcon size={18} /> },
  { label: "Email", href: "mailto:neharacharla0011@gmail.com", icon: <Mail size={18} /> },
];

/* ---------------- Page ---------------- */

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <HealthCheck />
        <CircleSection />
        <Stages />
        <Family />
        <PrivacyBand />
        <ComingNext />
        <OurStory />
      </main>
      <Footer />
    </div>
  );
}

function Section({ id, eyebrow, title, lead, children, className = "" }: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-[1152px] px-5 sm:px-8">
        {eyebrow && <p className="label">{eyebrow}</p>}
        {title && <h2 className="font-display mt-2 max-w-3xl text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">{title}</h2>}
        {lead && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="relative z-10 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1152px] items-center justify-between gap-3 px-5 sm:px-8 md:h-28">
        <Link href="/" aria-label="Saheli home" className="shrink-0">
          <span className="md:hidden">
            <Logo size="sm" />
          </span>
          <span className="hidden md:inline">
            <Logo size="lg" tagline />
          </span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-6" aria-label="Site">
          <span className="hidden sm:inline-flex">
            <LanguagePicker />
          </span>
          <span className="sm:hidden">
            <LanguagePicker compact />
          </span>
          <a href="#how" className="hidden text-[15px] text-ink-soft hover:text-ink md:inline">
            How it works
          </a>
          <a href="#story" className="hidden text-[15px] text-ink-soft hover:text-ink md:inline">
            Our story
          </a>
          <Link href="/app" className="btn btn-primary btn-sm md:hidden">
            Open
          </Link>
          <Link href="/app" className="btn btn-primary hidden md:inline-flex">
            Open Saheli
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,var(--bg))] md:-right-24 md:-top-32 md:h-[680px] md:w-[680px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1152px] items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-[55fr_45fr] md:py-24">
        <div>
          <p className="label">Made for every version of her</p>
          <h1 className="font-display mt-4 text-[2.9rem] leading-[1.05] text-ink sm:text-[3.6rem] lg:text-[4.2rem]">
            Every app tracks her cycle. <span className="text-primary">None of them understand her.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-lg text-ink-soft">
            Saheli is a caring companion that reads her cycle and stage of life, then adapts her food, movement, mind and
            health care to how her body feels today.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/welcome" className="btn btn-primary btn-lg">
              Meet Saheli <ArrowRight size={18} />
            </Link>
            <TrySampleButton />
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
            <Lock size={15} className="text-accent-ink" />
            Your health data stays on your device.
          </p>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Your body changes four times a month. Saheli changes with it."
      lead="Hormones shift through your cycle, and so do your energy, hunger, sleep and mood. Saheli knows where you are and adjusts every suggestion to match."
    >
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PHASES.map((p) => (
          <article key={p.name} className="overflow-hidden rounded-[20px] border border-line bg-surface">
            <div className="h-8" style={{ background: p.color }} aria-hidden="true" />
            <div className="p-5">
              <h3 className="font-display text-2xl text-ink">{p.name}</h3>
              <p className="label mt-1">{p.days}</p>
              <p className="mt-3 text-[15px] text-ink-soft">{p.line}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-sm text-ink-soft">Day ranges shown for a 28-day cycle. Saheli uses your own cycle length.</p>
    </Section>
  );
}

function Features() {
  return (
    <Section id="features" eyebrow="One app, not five" title="Everything she needs, connected.">
      <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {FEATURE_GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <article key={g.name} className="card mb-5 break-inside-avoid">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-primary-ink">
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-[1.45rem] text-ink">{g.name}</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {g.features.map(([name, line]) => (
                  <li key={name} className="text-[15px] leading-snug">
                    <span className="font-semibold text-ink">{name}</span>
                    <span className="block text-ink-soft">{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function HealthCheck() {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="label">Health check</p>
          <h2 className="font-display mt-2 text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
            What your body keeps telling you.
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Saheli quietly connects your logs and reports, and tells you when a pattern is worth a conversation with your
            doctor.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Heavy periods and tiredness: ask about iron and ferritin.",
              "Cycles longer than 35 days with acne: ask about PCOS tests.",
              "Painful periods that stop your day: ask about endometriosis.",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-ink">
                <Check size={18} className="mt-1 shrink-0 text-accent-ink" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-ink-soft">Suggestions to discuss with your doctor, never a diagnosis.</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink">
            <Stethoscope size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">Saheli noticed a pattern</p>
            <p className="text-[15px] text-ink-soft">
              Severe pain on days 1 and 2 of your last 3 periods. Worth showing your pain diary to a gynaecologist.
            </p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-ink-soft" />
        </div>
      </div>
    </Section>
  );
}

function CircleSection() {
  return (
    <Section id="family" className="bg-surface/60">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="label">Circle</p>
          <h2 className="font-display mt-2 text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
            Help the people who love you understand you.
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Share a private link with your partner, mother or best friend. They see how you may be feeling and how to help,
            never your logs, moods, food or journal.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-[28px] border border-line bg-surface p-4">
            <p className="label">Her phone</p>
            <p className="font-display mt-2 text-lg leading-tight text-ink">How are you feeling?</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Calm", "Tired", "Low", "Great"].map((m) => (
                <span key={m} className="chip chip-sm" data-selected={m === "Tired"}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-line bg-surface p-4">
            <p className="label">Arjun&apos;s phone</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-ink">Support cue</p>
            <p className="mt-1 text-sm leading-snug text-ink">
              Neha might feel more tired this week. Her favourite snack and a calm evening would really help.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Stages() {
  return (
    <Section
      eyebrow="Every stage of her life"
      title="From first period to menopause."
      lead="Pregnancy, PCOS and postpartum plans are reviewed personally by a coach, never automated."
    >
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s, i) => (
          <article key={s.name} className="card">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-primary-ink">
              {i === 7 ? <Plus size={18} /> : <Flower2 size={18} />}
            </span>
            <h3 className="font-display mt-3 text-xl leading-tight text-ink">{s.name}</h3>
            <p className="mt-1.5 text-[15px] text-ink-soft">{s.line}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Family() {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="label">One phone, every woman in the family</p>
          <h2 className="font-display mt-2 text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
            Not every girl has her own phone. Saheli is still hers.
          </h2>
          <ul className="mt-6 space-y-3">
            {[
              "A separate private profile for each woman.",
              "Mother, daughters and grandmother on one phone.",
              "Each profile adapts to her own stage of life.",
              "A PIN keeps each profile to herself.",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-ink">
                <Check size={18} className="mt-1 shrink-0 text-accent-ink" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card shadow-[var(--shadow-soft)]">
          <p className="font-display text-2xl text-ink">Who&apos;s using Saheli?</p>
          <ul className="mt-4 space-y-2.5">
            {FAMILY.map((f) => (
              <li key={f.name} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <span className="font-display grid h-10 w-10 place-items-center rounded-full bg-primary text-lg text-on-primary">
                  {f.name[0]}
                </span>
                <span>
                  <span className="block font-semibold text-ink">{f.name}</span>
                  <span className="block text-sm text-ink-soft">
                    {f.relation} · {f.stage}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-primary/50 p-3 font-semibold text-primary-ink">
            <Plus size={18} /> Add a family member
          </p>
        </div>
      </div>
    </Section>
  );
}

function PrivacyBand() {
  return (
    <section id="privacy" className="scroll-mt-24 bg-surface-2 py-16 text-center md:py-24">
      <div className="mx-auto max-w-2xl px-5">
        <ShieldCheck size={32} className="mx-auto text-accent-ink" />
        <h2 className="font-display mt-4 text-[2.1rem] leading-tight text-ink sm:text-[2.75rem]">Private by design.</h2>
        <p className="mt-4 text-lg text-ink-soft">
          Your health data stays on your device. No accounts, no ads, nothing sold. Backups are locked on your phone before
          they leave it, so only you can read them.
        </p>
      </div>
    </section>
  );
}

function ComingNext() {
  return (
    <Section>
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="label">Coming next</p>
            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#92400E]">
              In development
            </span>
          </div>
          <h2 className="font-display mt-2 text-[1.9rem] leading-tight text-ink">Saheli and Suraksha, together.</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Saheli&apos;s SOS already reaches your Circle on WhatsApp and SMS. Next, Saheli will connect with Suraksha, our
            separate women&apos;s safety app.
          </p>
        </div>
        <ShieldCheck size={56} className="hidden shrink-0 text-primary/60 md:block" />
      </div>
    </Section>
  );
}

function OurStory() {
  return (
    <Section id="story" className="pt-0 md:pt-0">
      <div className="mx-auto max-w-3xl text-center">
        <p className="label">Our story</p>
        <h2 className="font-display mt-2 text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
          We always believed something like this should exist. So we built it.
        </h2>
        <p className="mt-5 text-lg text-ink-soft">
          Women kept telling us the same thing: their apps counted the days but never asked how they felt. Saheli was built
          by a women&apos;s nutritionist and fitness coach who studied AI, to be the friend every woman deserves: one that
          understands her cycle, her stage of life, her food and her family, and keeps all of it private on her own phone.
        </p>
        <p className="mt-5 text-[15px] text-ink">
          <span className="font-semibold">Neha Racharla</span>, Founder · <span className="font-semibold">Rakshitha Srinivasa</span>, Co-founder
        </p>
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1152px] gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.3fr_1.2fr_1fr_0.9fr]">
        <div>
          <Logo size="lg" tagline outline="var(--surface)" />
          <p className="mt-5 max-w-xs text-[15px] text-ink-soft">
            A caring friend for every woman&apos;s health: her cycle, food, movement, mind, reports and the people who love
            her, in one private place.
          </p>
        </div>
        <div>
          <p className="label">Founders</p>
          <p className="font-display mt-3 text-xl text-ink">Neha Racharla</p>
          <p className="text-[15px] font-semibold text-ink">Founder, Saheli</p>
          <ul className="mt-2 space-y-1 text-[15px] text-ink-soft">
            <li>Certified Nutritionist and Fitness Coach</li>
            <li>(Specialised in Women&apos;s Nutrition)</li>
            <li>M.S. Artificial Intelligence, Santa Clara University, Silicon Valley</li>
          </ul>
          <p className="font-display mt-5 text-xl text-ink">Rakshitha Srinivasa</p>
          <p className="text-[15px] font-semibold text-ink">Co-founder, Saheli</p>
          <ul className="mt-2 space-y-1 text-[15px] text-ink-soft">
            <li>MS Computer Science and Engineering, Santa Clara University</li>
          </ul>
        </div>
        <div>
          <p className="label">Contact</p>
          <p className="mt-3 text-[15px] text-ink-soft">Questions, ideas or partnerships? Say hi.</p>
          <ul className="mt-4 flex gap-2.5">
            {CONTACT_LINKS.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={c.label}
                  title={c.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-primary-ink transition-colors hover:border-primary hover:bg-primary hover:text-on-primary"
                >
                  {c.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Explore</p>
          <ul className="mt-3 space-y-2 text-[15px]">
            {[
              ["How it works", "#how"],
              ["Family and Circle", "#family"],
              ["Our story", "#story"],
              ["Privacy", "#privacy"],
              ["Open Saheli", "/app"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-ink-soft hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <TrySampleButton className="btn btn-secondary btn-sm" />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1152px] flex-col gap-1 px-5 py-5 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-8">
          <p>Saheli guides, never diagnoses. Always talk to your doctor.</p>
          <p>© 2026 Saheli. Made with love by Neha Racharla and Rakshitha Srinivasa.</p>
        </div>
      </div>
    </footer>
  );
}
