"use client";

import Link from "next/link";
import { useState } from "react";
import { Baby, BellRing, Check, Copy, HeartHandshake, Leaf, Share2, Sparkles, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PHASE_VAR } from "@/lib/cycle";
import {
  babyAgeLine,
  cycleView,
  HARDER_LINE,
  HELP_TIPS,
  isStale,
  lastUpdatedLabel,
  pageTitle,
  phaseCard,
  pregnancyView,
  STAGE_COPY,
  WEEK_TIPS,
  type CirclePayload,
} from "@/lib/circle";

/** Phase colours always light here: the person's page is always the rose light theme. */
const LIGHT_PHASES = {
  "--ph-period": "#C2577A",
  "--ph-follicular": "#6E9C83",
  "--ph-ovulation": "#E3A73A",
  "--ph-luteal": "#9A87D6",
  colorScheme: "light",
} as React.CSSProperties;

export function PersonPage({ payload, today }: { payload: CirclePayload | null; today: string }) {
  return (
    <div className="theme-rose-light min-h-dvh bg-bg text-ink" style={LIGHT_PHASES}>
      <main className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-8 sm:pt-12">
        <div className="mb-8">
          <Logo size="md" tagline outline="var(--bg)" />
        </div>
        {payload ? <PersonView payload={payload} today={today} /> : <Missing />}
      </main>
    </div>
  );
}

function Missing() {
  return (
    <>
      <h1 className="font-display text-[2.1rem] leading-[1.1] text-ink">This link isn&apos;t working</h1>
      <p className="mt-3 text-ink-soft">
        It may have been removed, or copied only in part. Ask for the link again. Nothing else is shared here.
      </p>
      <Marketing />
    </>
  );
}

export function PersonView({ payload: p, today, preview = false }: { payload: CirclePayload; today: string; preview?: boolean }) {
  const stale = isStale(p, today);
  return (
    <div>
      <p className="label">For {p.to}</p>
      <h1 className="mt-1 font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.4rem]">{pageTitle(p)}</h1>
      <p className="mt-2 text-sm text-ink-soft">{lastUpdatedLabel(p, today)}</p>

      <div className="mt-6 space-y-4">
        {p.paused ? (
          <section className="card">
            <p className="font-display text-[1.4rem] leading-snug text-ink">{p.her} has paused sharing for now.</p>
            <p className="mt-2 text-[15px] text-ink-soft">Nothing is wrong. She can turn it back on whenever she likes. A kind message is always welcome.</p>
          </section>
        ) : p.mode === "pregnancy" ? (
          <PregnancyCard p={p} today={today} />
        ) : p.mode === "menopause" || p.mode === "newbaby" ? (
          <StageCards p={p} today={today} stale={stale} />
        ) : (
          <CycleCards p={p} today={today} />
        )}
      </div>
      {!preview && <Marketing />}
    </div>
  );
}

function Ways({ title, ways, tip }: { title: string; ways: string[]; tip?: string }) {
  return (
    <div className="mt-4">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <ul className="mt-2 space-y-2">
        {ways.map((w) => (
          <li key={w} className="flex gap-2.5 text-[15px] text-ink">
            <Check size={16} className="mt-[5px] shrink-0 text-accent-ink" aria-hidden />
            {w}
          </li>
        ))}
      </ul>
      {tip && (
        <p className="mt-3 flex gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-[15px] text-ink">
          <HeartHandshake size={16} className="mt-[4px] shrink-0 text-primary-ink" aria-hidden />
          {tip}
        </p>
      )}
    </div>
  );
}

function CycleCards({ p, today }: { p: CirclePayload; today: string }) {
  const v = cycleView(p, today);
  if (!v) {
    return (
      <section className="card">
        <p className="text-[15px] text-ink">{p.her} hasn&apos;t shared her cycle yet. Check back soon.</p>
      </section>
    );
  }
  const card = phaseCard(p.her, p.relation, v.phase);
  const color = PHASE_VAR[v.phase];
  return (
    <>
      <section className="card overflow-hidden !p-0">
        <div className="h-2" style={{ background: color }} aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold text-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
              {card.label} phase
            </span>
            {v.periodDay && (
              <span className="inline-flex rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: color }}>
                Today is day {v.periodDay} of {p.her}&apos;s period
              </span>
            )}
          </div>
          <h2 className="mt-3 font-display text-[1.7rem] leading-tight text-ink">{card.title}</h2>
          <p className="mt-1.5 text-[15px] text-ink">{card.feeling}</p>
          {p.cycle?.tips !== false && <Ways title={`Ways to help ${p.her} today`} ways={card.ways} tip={card.tip} />}
        </div>
      </section>

      {v.helps.length > 0 && (
        <section className="rounded-[20px] border border-primary/40 bg-surface p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-[1.35rem] leading-tight text-ink">
            <Sparkles size={18} className="text-primary-ink" aria-hidden /> What usually helps {p.her} now
          </p>
          <ul className="mt-3 space-y-2.5">
            {v.helps.map((k) => (
              <li key={k} className="text-[15px] text-ink">
                {HELP_TIPS[k]?.(p.her)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {v.headsUps.map((h) => (
        <section key={h} className="flex gap-3 rounded-[20px] bg-surface-2 p-4 sm:p-5">
          <BellRing size={18} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">Heads-up</p>
            <p className="text-[15px] text-ink">{h}</p>
          </div>
        </section>
      ))}
    </>
  );
}

function PregnancyCard({ p, today }: { p: CirclePayload; today: string }) {
  const v = pregnancyView(p, today);
  if (!v) {
    return (
      <section className="card">
        <p className="text-[15px] text-ink">{p.her} is expecting. She&apos;ll share more when she&apos;s ready.</p>
      </section>
    );
  }
  return (
    <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7">
      <p className="label">
        Week {v.week} · {v.trimesterLabel}
      </p>
      <h2 className="mt-2 font-display text-[1.7rem] leading-tight text-ink">Baby is about the size of {v.size}</h2>
      <p className="mt-1.5 text-[15px] text-ink-soft">
        {v.daysToGo > 0 ? `About ${v.daysToGo} days to go.` : "Baby could arrive any day now."}
      </p>
      {v.tips.length > 0 && <Ways title={`Ways to help ${p.her} this trimester`} ways={v.tips} />}
    </section>
  );
}

function StageCards({ p, today, stale }: { p: CirclePayload; today: string; stale: boolean }) {
  const kind = p.mode === "newbaby" ? "newbaby" : "menopause";
  const copy = STAGE_COPY[kind];
  const baby = kind === "newbaby" && p.stage?.babyBorn ? babyAgeLine(p.stage.babyBorn, today) : null;
  if (!p.stage) {
    return (
      <section className="card">
        <p className="text-[15px] text-ink">A kind message today would mean a lot to {p.her}.</p>
      </section>
    );
  }
  const week = stale ? [] : (p.stage.week ?? []);
  const harder = !stale && p.stage.harder;
  return (
    <>
      <section className="card">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-ink">
          {kind === "newbaby" ? <Baby size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
          {copy.title}
        </p>
        {baby && (
          <h2 className="mt-2 font-display text-[1.6rem] leading-tight text-ink">
            {baby.age.charAt(0).toUpperCase() + baby.age.slice(1)}
          </h2>
        )}
        <p className="mt-2 text-[15px] text-ink">{copy.line(p.her)}</p>
        {baby && <p className="mt-1.5 text-[15px] text-ink-soft">{baby.line}</p>}
        <Ways title={`Ways to help ${p.her}`} ways={copy.ways} tip={copy.tip[p.relation]} />
      </section>

      {week.length > 0 && (
        <section className="rounded-[20px] border border-primary/40 bg-surface p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-[1.35rem] leading-tight text-ink">
            <Leaf size={18} className="text-primary-ink" aria-hidden /> This week for {p.her}
          </p>
          <ul className="mt-3 space-y-3">
            {week.map((k) => (
              <li key={k}>
                <p className="text-sm font-semibold text-ink">{WEEK_TIPS[k]?.label}</p>
                <p className="text-[15px] text-ink">{WEEK_TIPS[k]?.tip(p.her)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {harder && (
        <section className="flex gap-3 rounded-[20px] bg-surface-2 p-4 sm:p-5">
          <HeartHandshake size={18} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden />
          <p className="text-[15px] text-ink">{HARDER_LINE}</p>
        </section>
      )}
    </>
  );
}

/* ---------------- Marketing ---------------- */

function Marketing() {
  const [copied, setCopied] = useState(false);
  const site = typeof window !== "undefined" ? window.location.origin : "https://saheli.app";
  const text = "Saheli is a wellness companion that understands every stage of a woman's life. I think you'd love it.";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Saheli", text, url: site });
        return;
      } catch {
        return; // she closed the share sheet
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${site}`)}`, "_blank", "noopener");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(site);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="mt-10 grid gap-4">
      <section className="rounded-[20px] bg-surface-2 p-5 sm:p-6">
        <p className="label">For her</p>
        <p className="mt-1 font-display text-[1.45rem] leading-tight text-ink">Your body deserves a Saheli too</p>
        <p className="mt-1.5 text-[15px] text-ink-soft">Food, movement, mind and health care that follow how you feel today. Private, on your phone.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Join Saheli
        </Link>
      </section>
      <section className="card">
        <p className="label">For him</p>
        <p className="mt-1 font-display text-[1.45rem] leading-tight text-ink">Someone you love would love this</p>
        <p className="mt-1.5 text-[15px] text-ink-soft">Share Saheli with your sister, mother, friend, girlfriend or partner.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={share}>
            <Share2 size={16} aria-hidden /> Share with her
          </button>
          <button type="button" className="btn btn-secondary" onClick={copy}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </section>
      <p className="text-center text-xs text-ink-soft">
        Only a schedule of her phases or life stage is shared here. Never her logs, moods, food, journal or chats.
      </p>
    </div>
  );
}
