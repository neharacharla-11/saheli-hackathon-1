"use client";

import { useEffect, useState } from "react";
import { Baby, Droplet, Milk, Moon, Sun, Trash2, TriangleAlert } from "lucide-react";
import { newId } from "@/lib/store";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import { agoLabel, babyStats, durationLabel, EMPTY_BABY, fewWetNappies, minutesAgo, recentEvents, type BabyEvent } from "@/lib/stageCare";
import type { BabyCare as BabyData } from "@/lib/stageTypes";

function updateBaby(fn: (b: BabyData) => Partial<BabyData>) {
  activeProfileStore().setState((s) => {
    const cur = s.baby ?? EMPTY_BABY;
    return { baby: { ...cur, ...fn(cur) } } as never;
  });
}

function useNow(ms = 20_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** When a feed of this many minutes started, if it ended just now. */
function minutesBefore(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function BabyCareTracker() {
  const baby = useProfileStore((s) => s.baby) ?? EMPTY_BABY;
  const birth = useProfileStore((s) => s.profile?.babyBirthDate);
  const now = useNow();
  const stats = babyStats(baby, now);
  const [panel, setPanel] = useState<null | "left" | "right" | "bottle">(null);
  const [saved, setSaved] = useState("");
  const active = baby.activeFeed;
  const alert = fewWetNappies(stats, birth, now);

  function say(text: string) {
    setSaved(text);
    setTimeout(() => setSaved((cur) => (cur === text ? "" : cur)), 4000);
  }

  function logFeed(kind: "left" | "right" | "bottle", amount: number) {
    const at = minutesBefore(kind === "bottle" ? 0 : amount);
    updateBaby((b) => ({ feeds: [...b.feeds, { id: newId(), at, kind, ...(kind === "bottle" ? { ml: amount } : { minutes: amount }) }] }));
    setPanel(null);
    say(kind === "bottle" ? `Bottle ${amount} ml saved` : `${kind === "left" ? "Left" : "Right"} side ${amount} min saved`);
  }

  function startTimer(side: "left" | "right") {
    updateBaby(() => ({ activeFeed: { side, start: new Date().toISOString() } }));
    setPanel(null);
  }

  function stopTimer(save: boolean) {
    if (!active) return;
    const mins = Math.min(90, Math.max(1, minutesAgo(active.start, new Date())));
    updateBaby((b) => ({
      activeFeed: null,
      feeds: save ? [...b.feeds, { id: newId(), at: active.start, kind: active.side, minutes: mins }] : b.feeds,
    }));
    if (save) say(`${active.side === "left" ? "Left" : "Right"} side ${mins} min saved`);
  }

  function nappy(kind: "wet" | "dirty" | "both") {
    updateBaby((b) => ({ nappies: [...b.nappies, { id: newId(), at: new Date().toISOString(), kind }] }));
    say(`${kind === "both" ? "Wet and dirty" : kind === "wet" ? "Wet" : "Dirty"} nappy saved`);
  }

  function toggleSleep() {
    const at = new Date().toISOString();
    if (stats.asleep) {
      updateBaby((b) => ({ sleeps: b.sleeps.map((s) => (s.id === stats.asleep!.id ? { ...s, end: at } : s)) }));
      say("Woke up, saved");
    } else {
      updateBaby((b) => ({ sleeps: [...b.sleeps, { id: newId(), start: at }] }));
      say("Sleep started");
    }
  }

  function remove(e: BabyEvent) {
    updateBaby((b) =>
      e.type === "feed" ? { feeds: b.feeds.filter((x) => x.id !== e.id) } : e.type === "nappy" ? { nappies: b.nappies.filter((x) => x.id !== e.id) } : { sleeps: b.sleeps.filter((x) => x.id !== e.id) },
    );
  }

  const lastFeedText = stats.lastFeed ? agoLabel(stats.lastFeed.at, now) : "None yet";
  const timerMin = active ? minutesAgo(active.start, now) : 0;

  return (
    <section className="card" aria-labelledby="baby-care">
      <p className="label mb-1">BABY CARE</p>
      <h2 id="baby-care" className="font-display text-[1.6rem] leading-tight text-ink">
        Feeds, nappies and sleep
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Last feed" value={lastFeedText} note={`Next: ${stats.nextSide} side`} />
        <Stat label="Feeds today" value={String(stats.feedsToday)} note="Usually 8 to 12" />
        <Stat label="Nappies today" value={`${stats.wetToday} wet · ${stats.dirtyToday} dirty`} note="6+ wet a day after day 5" />
        <Stat label="Baby slept today" value={durationLabel(stats.sleptTodayMin)} note={stats.asleep ? `Asleep since ${timeOf(stats.asleep.start)}` : "Awake now"} />
      </div>

      {alert && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-4 text-[#5c1020]" role="alert">
          <TriangleAlert size={18} className="mt-[3px] shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Only {stats.wetToday} wet {stats.wetToday === 1 ? "nappy" : "nappies"} today</p>
            <p className="mt-1 text-[15px]">
              After day 5 babies usually have 6 or more a day. Offer more feeds now. Call your doctor today if baby is also very sleepy, has a dry mouth, or isn&apos;t feeding well.
            </p>
          </div>
        </div>
      )}

      {active && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-primary p-4 text-on-primary" aria-live="polite">
          <div className="min-w-0 flex-1">
            <p className="text-sm opacity-90">Feeding on the {active.side} side since {timeOf(active.start)}</p>
            <p className="font-display text-[2rem] leading-none tabular">{timerMin} min</p>
          </div>
          <button type="button" className="btn btn-lg bg-surface text-ink" onClick={() => stopTimer(true)}>
            Done
          </button>
          <button type="button" className="btn btn-ghost text-on-primary hover:bg-white/15" onClick={() => stopTimer(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* Feed */}
      <p className="mb-2 mt-5 text-sm font-semibold text-ink-soft">Feed</p>
      <div className="grid grid-cols-3 gap-2">
        <BigButton icon={Baby} label="Left" sub={stats.nextSide === "left" ? "Next side" : undefined} on={panel === "left"} onClick={() => setPanel(panel === "left" ? null : "left")} disabled={!!active} />
        <BigButton icon={Baby} label="Right" sub={stats.nextSide === "right" ? "Next side" : undefined} on={panel === "right"} onClick={() => setPanel(panel === "right" ? null : "right")} disabled={!!active} />
        <BigButton icon={Milk} label="Bottle" sub="ml" on={panel === "bottle"} onClick={() => setPanel(panel === "bottle" ? null : "bottle")} />
      </div>
      {panel && (
        <div className="mt-2 rounded-2xl bg-surface-2 p-3">
          <p className="mb-2 text-sm font-semibold text-ink">{panel === "bottle" ? "How much?" : `How long on the ${panel}?`}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {(panel === "bottle" ? [30, 60, 90, 120, 150, 180] : [5, 10, 15, 20, 25, 30]).map((v) => (
              <button key={v} type="button" className="h-14 rounded-2xl border border-line bg-surface text-[17px] font-semibold text-ink tabular active:scale-[0.98]" onClick={() => logFeed(panel, v)}>
                {v} {panel === "bottle" ? "ml" : "min"}
              </button>
            ))}
          </div>
          {panel !== "bottle" && (
            <button type="button" className="btn btn-primary mt-2 h-14 w-full text-[16px]" onClick={() => startTimer(panel)}>
              Start a timer instead
            </button>
          )}
        </div>
      )}

      {/* Nappy */}
      <p className="mb-2 mt-5 text-sm font-semibold text-ink-soft">Nappy</p>
      <div className="grid grid-cols-3 gap-2">
        <BigButton icon={Droplet} label="Wet" onClick={() => nappy("wet")} />
        <BigButton icon={Droplet} label="Dirty" onClick={() => nappy("dirty")} />
        <BigButton icon={Droplet} label="Both" onClick={() => nappy("both")} />
      </div>

      {/* Sleep */}
      <p className="mb-2 mt-5 text-sm font-semibold text-ink-soft">Sleep</p>
      <button
        type="button"
        onClick={toggleSleep}
        className={`flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-semibold transition active:scale-[0.99] ${
          stats.asleep ? "bg-ink text-surface" : "border border-line bg-surface-2 text-ink hover:brightness-95"
        }`}
      >
        {stats.asleep ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        {stats.asleep ? "Baby woke up" : "Baby fell asleep"}
      </button>

      <p className="mt-3 min-h-5 text-sm font-semibold text-accent-ink" role="status">
        {saved}
      </p>

      <Recent baby={baby} now={now} onRemove={remove} />
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-[1.25rem] leading-tight text-ink tabular">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{note}</p>
    </div>
  );
}

function BigButton({ icon: Icon, label, sub, onClick, on, disabled }: { icon: typeof Baby; label: string; sub?: string; onClick: () => void; on?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`flex h-16 flex-col items-center justify-center rounded-2xl text-[17px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
        on ? "bg-primary text-on-primary" : "border border-line bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon size={18} aria-hidden />
        {label}
      </span>
      {sub && <span className={`text-[11px] font-medium ${on ? "opacity-90" : "text-ink-soft"}`}>{sub}</span>}
    </button>
  );
}

function Recent({ baby, now, onRemove }: { baby: BabyData; now: Date; onRemove: (e: BabyEvent) => void }) {
  const list = recentEvents(baby, 8);
  if (!list.length) return <p className="mt-2 text-sm text-ink-soft">Nothing logged yet. Tap a button above and it&apos;s saved.</p>;
  return (
    <div className="mt-3 border-t border-line pt-4">
      <p className="mb-1 text-sm font-semibold text-ink">Recent</p>
      <ul className="flex flex-col divide-y divide-line">
        {list.map((e) => (
          <li key={`${e.type}-${e.id}`} className="flex items-center gap-3 py-2">
            <span className="w-20 shrink-0 text-sm text-ink-soft tabular">{timeOf(e.at)}</span>
            <span className="min-w-0 flex-1 text-[15px] text-ink">{describe(e, now)}</span>
            <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2" onClick={() => onRemove(e)} aria-label={`Delete ${describe(e, now)}`}>
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function describe(e: BabyEvent, now: Date): string {
  if (e.type === "feed") {
    const f = e.item;
    return f.kind === "bottle" ? `Bottle, ${f.ml} ml` : `${f.kind === "left" ? "Left" : "Right"} side, ${f.minutes} min`;
  }
  if (e.type === "nappy") return e.item.kind === "both" ? "Nappy, wet and dirty" : `Nappy, ${e.item.kind}`;
  const s = e.item;
  const mins = minutesAgo(s.start, s.end ? new Date(s.end) : now);
  return s.end ? `Slept ${durationLabel(mins)}` : `Asleep for ${durationLabel(mins)} so far`;
}
