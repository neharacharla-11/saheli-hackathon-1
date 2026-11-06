"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Globe, MonitorSmartphone, Moon, Palette, Pencil, Plus, Share, Smartphone, Sparkles, Sun, Trash2, Users } from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { openSample } from "@/components/SamplePicker";
import { CardHead } from "@/components/pregnancy/ui";
import { todayISO } from "@/lib/dates";
import { COUNTRIES, OTHER_COUNTRY } from "@/lib/helplines";
import { SAMPLE_GROUPS, SAMPLES } from "@/lib/samples";
import {
  activeProfileStore,
  profileKey,
  STAGE_LABEL,
  useAppStore,
  useProfileStore,
  type ModePref,
  type ThemeName,
} from "@/lib/store";
import type { Mood } from "@/lib/types";

/* ---------------- Saheli on your home screen ---------------- */

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function subscribeStandalone(cb: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function HomeScreenCard() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [done, setDone] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );
  const ios = useSyncExternalStore(
    () => () => {},
    () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    () => false,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setDone(true);
    setPrompt(null);
  }

  const installed = standalone || done;

  return (
    <section className="card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-2 text-primary-ink" aria-hidden>
          <Smartphone size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">Saheli on your home screen</h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            {installed
              ? "Saheli is already on your home screen. Open it from there like any other app."
              : "Open Saheli with one tap, full screen, like an app. No app store, nothing to sign up for."}
          </p>
          {!installed && ios && !prompt && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[15px] text-ink">
              On iPhone: tap <Share size={16} className="text-primary-ink" aria-label="Share" /> Share in Safari, then
              <span className="font-semibold">Add to Home Screen</span>.
            </p>
          )}
          {!installed && !ios && !prompt && (
            <p className="mt-2 text-[15px] text-ink">
              In Chrome or Edge, open the browser menu and choose <span className="font-semibold">Install app</span> or{" "}
              <span className="font-semibold">Add to Home screen</span>.
            </p>
          )}
        </div>
        {installed ? (
          <span className="inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-accent/20 px-3.5 text-sm font-semibold text-accent-ink sm:self-center">
            <Check size={16} aria-hidden /> Already installed
          </span>
        ) : (
          prompt && (
            <button type="button" className="btn btn-primary self-start sm:self-center" onClick={install}>
              <Plus size={16} aria-hidden /> Add to home screen
            </button>
          )
        )}
      </div>
    </section>
  );
}

/* ---------------- Language and country ---------------- */

export function LanguageCountry() {
  const country = useProfileStore((s) => s.profile?.country) ?? "IN";
  const all = [...COUNTRIES, OTHER_COUNTRY];
  const known = all.some((c) => c.code === country);
  return (
    <section className="card">
      <CardHead icon={Globe} title="Language and country" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Language</p>
          <LanguagePicker />
          <p className="mt-2 text-sm text-ink-soft">Saheli&apos;s words change. Your own notes stay as you wrote them.</p>
          <p className="mt-1 text-sm text-ink-soft">Translations are a draft. Tell us if something reads oddly.</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Country</span>
          <select
            className="input"
            value={known ? country : "OTHER"}
            onChange={(e) => activeProfileStore().getState().updateProfile({ country: e.target.value })}
          >
            {all.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-sm text-ink-soft">Used for emergency numbers and helplines in Get help.</span>
        </label>
      </div>
    </section>
  );
}

/* ---------------- Family profiles ---------------- */

export function FamilyProfiles() {
  const profiles = useAppStore((s) => s.profiles);
  const activeId = useAppStore((s) => s.activeId);
  const sample = useAppStore((s) => s.sample);
  const setActive = useAppStore((s) => s.setActive);
  const updateMeta = useAppStore((s) => s.updateMeta);
  const [editing, setEditing] = useState<string | null>(null);
  const [relation, setRelation] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  function remove(id: string) {
    const rest = profiles.filter((p) => p.id !== id);
    useAppStore.setState({ profiles: rest, activeId: activeId === id ? (rest[0]?.id ?? null) : activeId });
    try {
      localStorage.removeItem(profileKey(id));
    } catch {}
    setRemoving(null);
  }

  return (
    <section className="card">
      <CardHead
        icon={Users}
        title="Family profiles"
        right={
          <Link href="/welcome?add=1" className="btn btn-secondary btn-sm">
            <Plus size={16} aria-hidden /> Add a family member
          </Link>
        }
      />
      <p className="-mt-2 mb-3 text-[15px] text-ink-soft">
        Not every girl has her own phone. Each person gets her own private space on this phone.
      </p>
      {profiles.length === 0 ? (
        <p className="rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">
          You&apos;re looking at sample data. <Link href="/welcome" className="font-semibold text-primary-ink underline">Set up your own profile</Link> to keep your data.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {profiles.map((p) => {
            const on = !sample && p.id === activeId;
            return (
              <li key={p.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg text-on-primary">
                    {p.name[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {[p.relation, STAGE_LABEL[p.stage]].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {on ? (
                    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-2 px-3 text-xs font-semibold text-primary-ink">
                      <Check size={14} aria-hidden /> Using now
                    </span>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActive(p.id)}>
                      Switch
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-[52px] text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-primary-ink hover:underline"
                    onClick={() => {
                      setEditing(p.id);
                      setRelation(p.relation ?? "");
                    }}
                  >
                    <Pencil size={13} aria-hidden /> Change relation
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-ink-soft hover:text-[#9B1B30] hover:underline"
                    onClick={() => setRemoving(p.id)}
                  >
                    <Trash2 size={13} aria-hidden /> Remove
                  </button>
                </div>
                {editing === p.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-[52px]">
                    <input
                      className="input h-10 max-w-[220px]"
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      placeholder="e.g. Me, Mother, Daughter"
                      aria-label={`Relation for ${p.name}`}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        updateMeta(p.id, { relation: relation.trim() || undefined });
                        setEditing(null);
                      }}
                    >
                      Save
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                )}
                {removing === p.id && (
                  <div className="mt-3 rounded-2xl border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-3.5 text-[15px] text-[#5c1020]">
                    <p className="font-semibold">Remove {p.name} and all her data from this phone?</p>
                    <p className="mt-0.5 text-sm">Her logs, reports and chats are deleted. This can&apos;t be undone.</p>
                    <div className="mt-2.5 flex gap-2">
                      <button type="button" className="btn btn-sm bg-danger text-white hover:brightness-105" onClick={() => remove(p.id)}>
                        Remove {p.name}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRemoving(null)}>
                        Keep
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Colour theme, light or dark, mood-adaptive ---------------- */

interface Swatch {
  id: ThemeName;
  name: string;
  dots: [string, string, string];
  note: string;
}

const SWATCHES: Swatch[] = [
  { id: "rose", name: "Saheli rose", dots: ["#C2577A", "#8FAF9B", "#F6E3E9"], note: "Default" },
  { id: "lavender", name: "Lavender haze", dots: ["#7E6BC9", "#FFB199", "#ECE6FA"], note: "Light and dark" },
  { id: "peach", name: "Peach comfort", dots: ["#C9553C", "#F4B6C8", "#FFE6DC"], note: "Light and dark" },
  { id: "sage", name: "Sage calm", dots: ["#4F7563", "#F4A97A", "#E1EFE7"], note: "Light and dark" },
  { id: "ocean", name: "Ocean", dots: ["#1F6E8C", "#9CC9EE", "#E3EEF6"], note: "Light and dark" },
  { id: "berry", name: "Berry and mint", dots: ["#8E2453", "#9EDCC8", "#F6E1EA"], note: "Light and dark" },
  { id: "honey", name: "Honey", dots: ["#A86E15", "#D97A8A", "#FCEFD2"], note: "Light and dark" },
  { id: "violet", name: "Violet", dots: ["#5B2A86", "#FF8FB1", "#EEE3F7"], note: "Light and dark" },
  { id: "midnight", name: "Midnight orchid", dots: ["#C49BF0", "#FF9EC4", "#2E2442"], note: "Dark theme" },
  { id: "night-garden", name: "Night garden", dots: ["#8FD9B6", "#F5B7A8", "#223A31"], note: "Dark theme" },
];

const MODES: { id: ModePref; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Match my phone", icon: MonitorSmartphone },
];

const TRY_MOODS: { id: Mood; label: string }[] = [
  { id: "great", label: "Great" },
  { id: "energetic", label: "Energetic" },
  { id: "calm", label: "Calm" },
  { id: "okay", label: "Okay" },
  { id: "low", label: "Low" },
  { id: "anxious", label: "Anxious" },
  { id: "irritable", label: "Irritable" },
  { id: "overwhelmed", label: "Overwhelmed" },
];

export function ColourTheme() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <section className="card">
      <CardHead icon={Palette} title="Colour theme" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Colour theme">
        {SWATCHES.map((s) => {
          const on = theme === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(s.id)}
              className={`rounded-2xl bg-surface p-3.5 text-left transition-colors hover:bg-surface-2 ${
                on ? "border-2 border-primary" : "border border-line"
              }`}
            >
              <span className="flex gap-1.5" aria-hidden>
                {s.dots.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ background: c }} />
                ))}
              </span>
              <span className="mt-2.5 block text-[15px] font-semibold text-ink">{s.name}</span>
              <span className="block text-xs text-ink-soft">{s.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function LightOrDark() {
  const mode = useAppStore((s) => s.mode);
  const theme = useAppStore((s) => s.theme);
  const setMode = useAppStore((s) => s.setMode);
  const darkOnly = theme === "midnight" || theme === "night-garden";
  return (
    <section className="card">
      <CardHead icon={Moon} title="Light or dark" />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Light or dark">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className="chip" onClick={() => setMode(m.id)}>
            <m.icon size={16} aria-hidden /> {m.label}
          </button>
        ))}
      </div>
      {darkOnly && <p className="mt-3 text-sm text-ink-soft">Your theme is always dark. Pick another theme for light.</p>}
    </section>
  );
}

export function MoodAdaptive() {
  const on = useAppStore((s) => s.moodAdaptive);
  const setOn = useAppStore((s) => s.setMoodAdaptive);
  const today = todayISO();
  const mood = useProfileStore((s) => s.dayLogs[today]?.mood);
  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">Mood-adaptive colours</h2>
          <p className="mt-1 text-[15px] text-ink-soft">Saheli&apos;s colours gently follow how you feel today: warm when you&apos;re happy, soft and calm when it&apos;s a hard day.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Mood-adaptive colours"
          onClick={() => setOn(!on)}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
      {on && (
        <>
          <p className="mb-2 mt-4 text-sm font-semibold text-ink">Try it: how are you feeling?</p>
          <div className="flex flex-wrap gap-2">
            {TRY_MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="chip"
                aria-pressed={mood === m.id}
                onClick={() => activeProfileStore().getState().logDay(today, { mood: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Try with sample data ---------------- */

const GROUP_LABEL: Record<string, string> = {
  cycle: "Cycle",
  conditions: "Conditions",
  fertility: "Fertility, pregnancy and baby",
  midlife: "Midlife and beyond",
};

export function SampleCards() {
  const sample = useAppStore((s) => s.sample);
  return (
    <section className="card">
      <CardHead icon={Sparkles} title="Try with sample data" />
      <p className="-mt-2 text-[15px] text-ink-soft">
        Open one of 12 made-up women to see how Saheli adapts. Your own data stays untouched.
      </p>
      <div className="mt-5 space-y-6">
        {SAMPLE_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="label mb-2.5">{GROUP_LABEL[g.id] ?? g.label}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SAMPLES.filter((s) => s.group === g.id).map((s) => {
                const on = sample?.key === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => openSample(s.key)}
                    aria-pressed={on}
                    className={`flex items-start gap-3 rounded-2xl bg-surface p-3.5 text-left transition-colors hover:bg-surface-2 ${
                      on ? "border-2 border-primary" : "border border-line"
                    }`}
                  >
                    <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg text-on-primary">
                      {s.name[0]}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">
                        {s.name}, {s.age}
                        {on && <span className="ml-2 text-xs font-semibold text-primary-ink">Open now</span>}
                      </span>
                      <span className="block text-sm text-ink-soft">{s.line}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
