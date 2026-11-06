"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Check, ChevronDown, Info, Pill as PillIcon, ShieldCheck, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CardTitle, Notice } from "@/components/nourish/bits";
import {
  defaultReplaceBy,
  HORMONAL_IUD_BRANDS,
  isBreakDay,
  METHODS,
  methodInfo,
  packDay,
  pillDots,
  pillStreak,
  replaceInfo,
} from "@/lib/care";
import type { Contraception, MethodId } from "@/lib/careTypes";
import { addDays, formatShort, parseISODate, todayISO } from "@/lib/dates";
import { activeProfileStore, useProfileStore } from "@/lib/store";

const PRESCRIBE = "Saheli explains, it doesn't prescribe. Your doctor or nurse will help you choose what's right for you.";
const NO_TAKEN: Record<string, boolean> = {};

function save(c: Contraception | null) {
  activeProfileStore().setState({ contraception: c } as never);
}

const longDate = (iso: string) => parseISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function time12(t?: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ContraceptionPage() {
  const c = useProfileStore((s) => s.contraception ?? null);
  const [changing, setChanging] = useState(false);
  const editing = changing || !c;

  return (
    <>
      <PageHeader eyebrow="CONTRACEPTION" title="Your birth control, sorted" lead="Daily pill reminders, replace-by dates for coils and implants, and what to do if you miss a pill." />
      <div className="flex flex-col gap-5">
        {editing ? (
          <MethodSetup existing={c} onDone={() => setChanging(false)} onCancel={c ? () => setChanging(false) : undefined} />
        ) : (
          <MethodCard c={c!} onChange={() => setChanging(true)} />
        )}
        {!editing && (c?.method === "combined" || c?.method === "mini") && <MissedPill method={c.method} miniKind={c.miniKind} />}
        <GoodToKnow />
        <p className="text-sm text-ink-soft">{PRESCRIBE}</p>
      </div>
    </>
  );
}

/* ---------------- Set up ---------------- */

function MethodSetup({ existing, onDone, onCancel }: { existing: Contraception | null; onDone: () => void; onCancel?: () => void }) {
  const today = todayISO();
  const [method, setMethod] = useState<MethodId | null>(existing?.method ?? null);
  const [pillTime, setPillTime] = useState(existing?.pillTime ?? "21:00");
  const [packStart, setPackStart] = useState(existing?.packStart ?? today);
  const [packType, setPackType] = useState<21 | 28>(existing?.packType ?? 21);
  const [miniKind, setMiniKind] = useState<"desogestrel" | "traditional">(existing?.miniKind ?? "desogestrel");
  const [brand, setBrand] = useState(existing?.brand ?? HORMONAL_IUD_BRANDS[0].name);
  const [fittedOn, setFittedOn] = useState(existing?.fittedOn ?? today);
  const [replaceBy, setReplaceBy] = useState(existing?.replaceBy ?? "");
  const [touched, setTouched] = useState(!!existing?.replaceBy);
  const [error, setError] = useState("");
  const info = methodInfo(method ?? undefined);

  const brandYears = HORMONAL_IUD_BRANDS.find((b) => b.name === brand)?.years;
  const autoReplace = method && info && (info.kind === "device" || info.kind === "injection") ? defaultReplaceBy(method, fittedOn, method === "hormonal-iud" ? brandYears : undefined) : "";
  const shownReplace = touched && replaceBy ? replaceBy : autoReplace;

  function pick(id: MethodId) {
    setMethod(id);
    setError("");
    setTouched(false);
    setReplaceBy("");
  }

  function submit() {
    if (!method || !info) return;
    setError("");
    const base: Contraception = { method, label: info.short, setAt: existing?.method === method ? existing.setAt : new Date().toISOString() };
    if (info.kind === "pill") {
      if (!pillTime) return setError("Please choose the time you take your pill.");
      if (!packStart || packStart > today) return setError("Please pick the day this pack started (today or earlier).");
      save({ ...base, pillTime, packStart, packType: method === "combined" ? packType : 28, miniKind: method === "mini" ? miniKind : undefined });
    } else if (info.kind === "device" || info.kind === "injection") {
      if (!fittedOn || fittedOn > today) return setError(info.kind === "injection" ? "Please pick the date of your last injection." : "Please pick the date it was fitted.");
      if (!shownReplace || shownReplace <= fittedOn) return setError("The replace-by date should be after the fitting date.");
      save({ ...base, brand: method === "hormonal-iud" ? brand : undefined, fittedOn, replaceBy: shownReplace });
    } else if (info.kind === "ring" || info.kind === "patch") {
      if (!packStart || packStart > today) return setError(`Please pick the day you started this ${info.kind}.`);
      save({ ...base, packStart, packType: 21 });
    } else {
      save(base);
    }
    onDone();
  }

  return (
    <section className="card" aria-labelledby="pick-method">
      <CardTitle title={<span id="pick-method">{existing ? "Change your method" : "What do you use?"}</span>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            aria-pressed={method === m.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
              method === m.id ? "border-2 border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${method === m.id ? "border-primary bg-primary text-on-primary" : "border-line"}`} aria-hidden>
              {method === m.id && <Check size={12} strokeWidth={3} />}
            </span>
            <span>
              <span className="block font-semibold text-ink">{m.label}</span>
              <span className="block text-sm text-ink-soft">{m.line}</span>
            </span>
          </button>
        ))}
      </div>

      {info && (
        <div className="mt-5 grid gap-4 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2">
          {info.kind === "pill" && (
            <>
              <Labelled label="Pill time (your reminder)">
                <input type="time" className="input h-11" value={pillTime} onChange={(e) => setPillTime(e.target.value)} />
              </Labelled>
              <Labelled label="The day this pack started">
                <input type="date" className="input h-11" value={packStart} max={today} onChange={(e) => setPackStart(e.target.value)} />
              </Labelled>
              {method === "combined" ? (
                <Choice
                  label="Pack type"
                  value={String(packType)}
                  onChange={(v) => setPackType(Number(v) as 21 | 28)}
                  options={[
                    ["21", "21 pills + 7-day break"],
                    ["28", "28 pills, no break"],
                  ]}
                />
              ) : (
                <Choice
                  label="Which mini pill?"
                  value={miniKind}
                  onChange={(v) => setMiniKind(v as "desogestrel" | "traditional")}
                  options={[
                    ["desogestrel", "Desogestrel (12-hour window)"],
                    ["traditional", "Other (3-hour window)"],
                  ]}
                />
              )}
            </>
          )}
          {(info.kind === "device" || info.kind === "injection") && (
            <>
              {method === "hormonal-iud" && (
                <Labelled label="Brand">
                  <select className="input h-11" value={brand} onChange={(e) => { setBrand(e.target.value); setTouched(false); }}>
                    {HORMONAL_IUD_BRANDS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} ({b.years} years)
                      </option>
                    ))}
                  </select>
                </Labelled>
              )}
              <Labelled label={info.kind === "injection" ? "Last injection" : "Fitted on"}>
                <input type="date" className="input h-11" value={fittedOn} max={today} onChange={(e) => { setFittedOn(e.target.value); setTouched(false); }} />
              </Labelled>
              <Labelled label={info.kind === "injection" ? "Next injection by" : "Replace by"}>
                <input
                  type="date"
                  className="input h-11"
                  value={shownReplace}
                  onChange={(e) => {
                    setReplaceBy(e.target.value);
                    setTouched(true);
                  }}
                />
              </Labelled>
              <p className="self-end text-xs text-ink-soft sm:col-span-2">
                Filled in for you ({info.kind === "injection" ? "13 weeks" : method === "hormonal-iud" ? `${brandYears} years for ${brand}` : `${info.years} years`}). Change it if your doctor told you a different date.
              </p>
            </>
          )}
          {(info.kind === "ring" || info.kind === "patch") && (
            <Labelled label={`The day you started this ${info.kind === "ring" ? "ring" : "patch cycle"}`}>
              <input type="date" className="input h-11" value={packStart} max={today} onChange={(e) => setPackStart(e.target.value)} />
            </Labelled>
          )}
          {(info.kind === "barrier" || info.kind === "none") && (
            <p className="text-[15px] text-ink sm:col-span-2">
              {info.kind === "barrier" ? "Use a new condom every time, from start to finish. Keep emergency contraception in mind if one splits." : "If you'd like to talk through options, a doctor, nurse or family planning clinic can help."}
            </p>
          )}
          {error && (
            <p className="text-sm font-semibold text-[#9B1B30] sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="button" className="btn btn-primary" onClick={submit}>
              Save
            </button>
            {onCancel && (
              <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {!info && onCancel && (
        <button type="button" className="btn btn-ghost mt-4" onClick={onCancel}>
          Cancel
        </button>
      )}
    </section>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1 text-sm font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button key={v} type="button" className="chip" aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------------- Her method ---------------- */

function MethodCard({ c, onChange }: { c: Contraception; onChange: () => void }) {
  const info = methodInfo(c.method);
  return (
    <section className="card" aria-labelledby="you-use">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label mb-1">YOU USE</p>
          <h2 id="you-use" className="font-display text-[1.8rem] leading-tight text-ink">
            {info?.label ?? "Your method"}
            {c.brand && c.method === "hormonal-iud" ? ` · ${c.brand}` : ""}
          </h2>
          <p className="text-[15px] text-ink-soft">{info?.line}</p>
        </div>
        <button type="button" className="text-sm font-semibold text-primary-ink underline-offset-4 hover:underline" onClick={onChange}>
          Change method
        </button>
      </div>
      {info?.kind === "pill" && <PillTracker c={c} />}
      {(info?.kind === "device" || info?.kind === "injection") && c.replaceBy && <ReplaceBox c={c} injection={info.kind === "injection"} />}
      {(info?.kind === "ring" || info?.kind === "patch") && c.packStart && <RingPatch c={c} />}
      {info?.kind === "barrier" && (
        <Notice icon={ShieldCheck}>Condoms are the only method that also protects against STIs. You can use them with any other method too.</Notice>
      )}
      {info?.kind === "none" && (
        <Notice icon={Info}>
          No method right now. If you have sex and don&apos;t want a pregnancy, emergency contraception works best within 72 hours (some types up to 5 days). A pharmacist can help.
        </Notice>
      )}
    </section>
  );
}

function PillTracker({ c }: { c: Contraception }) {
  const taken = useProfileStore((s) => s.pillsTaken ?? NO_TAKEN);
  const today = todayISO();
  const breakToday = isBreakDay(c, today);
  const day = c.packStart ? packDay(c.packStart, today) : 1;
  const done = !!taken[today];
  const streak = pillStreak(c, taken, today);
  const dots = pillDots(c, taken, today);

  function toggle() {
    activeProfileStore().setState((s) => {
      const next = { ...(s.pillsTaken ?? {}) };
      if (next[today]) delete next[today];
      else next[today] = true;
      return { pillsTaken: next } as never;
    });
  }

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={breakToday}
        aria-pressed={done}
        className={`grid h-24 w-24 shrink-0 place-items-center rounded-full text-center text-sm font-semibold leading-tight shadow-[var(--shadow-soft)] transition active:scale-[0.97] disabled:opacity-60 ${
          done ? "bg-accent-ink text-white" : breakToday ? "bg-surface-2 text-ink-soft" : "bg-primary text-on-primary hover:brightness-105"
        }`}
      >
        {done ? (
          <span className="flex flex-col items-center gap-0.5">
            <Check size={30} strokeWidth={3} aria-hidden />
            Taken
          </span>
        ) : breakToday ? (
          "Break week"
        ) : (
          <span className="flex flex-col items-center gap-1 px-2">
            <PillIcon size={22} aria-hidden />
            Take today&apos;s
          </span>
        )}
      </button>
      <div className="min-w-0">
        <p className="font-display text-[1.4rem] leading-tight text-ink tabular">
          Day {day} of your pack{breakToday ? ", break week" : ""}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <Bell size={14} aria-hidden /> Reminder at {time12(c.pillTime)}
          {breakToday ? ` · start your new pack on ${formatShort(addDays(today, 29 - day))}` : ""}
        </p>
        <p className="mt-1 text-sm text-ink">
          {streak > 0 ? `${streak} ${streak === 1 ? "day" : "days"} in a row` : "Start a new streak today"}
          {done ? ". Nice and steady." : ""}
        </p>
        <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Last 14 days">
          {dots.map((d) => (
            <li
              key={d.date}
              title={`${formatShort(d.date)}: ${d.state === "taken" ? "taken" : d.state === "missed" ? "missed" : d.state === "break" ? "break" : d.state === "today" ? "not yet" : "before you started"}`}
              className={`h-4 w-4 rounded-full ${
                d.state === "taken"
                  ? "bg-accent-ink"
                  : d.state === "missed"
                    ? "border-2 border-[#9B1B30] bg-[#FDE2E2]"
                    : d.state === "break"
                      ? "scale-75 bg-line"
                      : d.state === "today"
                        ? "border-2 border-dashed border-primary"
                        : "border border-line"
              }`}
            >
              <span className="sr-only">
                {formatShort(d.date)} {d.state}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-1.5 text-xs text-ink-soft">Green: taken · red: missed · grey: break days</p>
      </div>
    </div>
  );
}

function ReplaceBox({ c, injection }: { c: Contraception; injection: boolean }) {
  const today = todayISO();
  const r = replaceInfo(c.replaceBy!, today);
  const tone =
    r.state === "overdue"
      ? "border-2 border-[#9B1B30]/50 bg-[#FDE2E2] text-[#5c1020]"
      : r.state === "soon"
        ? "border border-[#92400E]/30 bg-[#FEF3C7] text-[#5f2b06]"
        : "bg-surface-2 text-ink";
  const what = injection ? "Next injection by" : "Replace by";
  return (
    <div className={`rounded-2xl p-4 ${tone}`} role={r.state === "overdue" ? "alert" : undefined}>
      <p className="text-sm">{injection ? `Last injection ${longDate(c.fittedOn!)}` : `Fitted ${longDate(c.fittedOn!)}`}</p>
      <p className="mt-1 font-display text-[1.5rem] leading-tight">
        {what} {longDate(c.replaceBy!)}
      </p>
      <p className="mt-1 text-[15px]">
        {r.state === "overdue" ? (
          <>
            <span className="font-semibold">{r.days} {r.days === 1 ? "day" : "days"} overdue.</span> It may not protect you now. Use condoms until then, and book an appointment this week.
          </>
        ) : r.state === "soon" ? (
          <>
            <span className="font-semibold">In {r.days} {r.days === 1 ? "day" : "days"}.</span> Book your appointment now.
          </>
        ) : r.months >= 2 ? (
          `In about ${r.months} months. Saheli will remind you when it's close.`
        ) : (
          `In ${r.days} days.`
        )}
      </p>
    </div>
  );
}

function RingPatch({ c }: { c: Contraception }) {
  const today = todayISO();
  const day = packDay(c.packStart!, today);
  const ring = c.method === "ring";
  const cycleStart = addDays(today, -(day - 1));
  let line: string;
  if (day > 21) line = ring ? `Ring-free week, day ${day - 21} of 7. Put a new ring in on ${formatShort(addDays(cycleStart, 28))}.` : `Patch-free week, day ${day - 21} of 7. New patch on ${formatShort(addDays(cycleStart, 28))}.`;
  else if (ring) line = `Ring in, day ${day} of 21. Take it out on ${formatShort(addDays(cycleStart, 21))}.`;
  else {
    const week = Math.ceil(day / 7);
    line = `Patch ${week} of 3. ${week < 3 ? `Change it on ${formatShort(addDays(cycleStart, week * 7))}` : `Take it off on ${formatShort(addDays(cycleStart, 21))}`}.`;
  }
  return <p className="rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">{line}</p>;
}

/* ---------------- Missed pill and good to know ---------------- */

function MissedPill({ method, miniKind }: { method: "combined" | "mini"; miniKind?: "desogestrel" | "traditional" }) {
  const hours = miniKind === "traditional" ? 3 : 12;
  return (
    <details className="group rounded-[20px] border border-[color-mix(in_srgb,var(--primary)_60%,transparent)] bg-surface p-5 sm:p-6">
      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[1.35rem] text-ink">I missed a pill. What do I do?</span>
        <ChevronDown size={20} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {method === "combined" ? (
          <>
            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--accent)_20%,var(--surface))] p-4">
              <p className="font-semibold text-ink">1 pill missed (under 48 hours late)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink">
                <li>Take it now, even if that means 2 pills in one day.</li>
                <li>Carry on with the rest of the pack as usual.</li>
                <li>You&apos;re still protected.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-[#FEF3C7] p-4 text-[#5f2b06]">
              <p className="font-semibold">2 or more pills missed</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
                <li>Take the latest missed pill now. Leave the earlier ones.</li>
                <li>Use condoms for the next 7 days.</li>
                <li>If you had unprotected sex in the last few days, ask a pharmacist about emergency contraception.</li>
                <li>If fewer than 7 pills are left in the pack, start the next pack straight away with no break.</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-[#FEF3C7] p-4 text-[#5f2b06] sm:col-span-2">
            <p className="font-semibold">More than {hours} hours late</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              <li>Take it as soon as you remember, then the next one at your usual time.</li>
              <li>Use condoms for the next 2 days.</li>
              <li>If you had unprotected sex since the missed pill, ask a pharmacist about emergency contraception.</li>
            </ul>
            <p className="mt-2 text-sm">Desogestrel pills (like Cerazette) have a 12-hour window. Other mini pills have 3 hours.</p>
          </div>
        )}
        <p className="flex items-start gap-2 text-sm text-ink-soft sm:col-span-2">
          <Info size={15} className="mt-[3px] shrink-0" aria-hidden />
          Vomiting within 2 hours of a pill, or very bad diarrhoea, counts as a missed pill.
        </p>
      </div>
    </details>
  );
}

function GoodToKnow() {
  return (
    <section className="card" aria-labelledby="good-to-know">
      <CardTitle title={<span id="good-to-know">Good to know</span>} />
      <ul className="flex flex-col gap-3">
        <li className="flex gap-3 text-[15px] text-ink">
          <ShieldCheck size={18} className="mt-[3px] shrink-0 text-accent-ink" aria-hidden />
          Only condoms protect against STIs. Every other method prevents pregnancy only.
        </li>
        <li className="flex gap-3 text-[15px] text-ink">
          <Info size={18} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden />
          Some epilepsy and TB medicines (like rifampicin), and the herbal remedy St John&apos;s wort, make the pill, patch, ring and implant weaker. Tell every doctor which method you use.
        </li>
        <li className="flex gap-3 text-[15px] text-[#5c1020]">
          <TriangleAlert size={18} className="mt-[3px] shrink-0 text-[#9B1B30]" aria-hidden />
          <span>
            <span className="font-semibold">On the combined pill, patch or ring, see a doctor urgently</span> for chest pain, a painful swollen leg, a severe headache, or changes in your vision.
          </span>
        </li>
      </ul>
      <Link href="/app/expert" className="mt-4 inline-block text-sm font-semibold text-primary-ink underline-offset-4 hover:underline">
        Talk to an expert
      </Link>
    </section>
  );
}
