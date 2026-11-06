"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguagePicker, TrySampleButton } from "@/components/landing/LandingClient";
import { COUNTRIES } from "@/lib/helplines";
import { addDays, todayISO } from "@/lib/dates";
import { newId, profileStore, STAGE_LABEL, useAppStore, useHydrated } from "@/lib/store";
import type { Activity, Goal, LifeStage, Profile, SafetyFlags } from "@/lib/types";

const STAGES: { id: LifeStage; line: string }[] = [
  { id: "cycle", line: "Periods come roughly every month." },
  { id: "pcos", line: "Irregular cycles, acne or hair changes with PCOS." },
  { id: "ttc", line: "Hoping to get pregnant soon." },
  { id: "pregnancy", line: "Expecting a baby." },
  { id: "postpartum", line: "Had a baby in the last year." },
  { id: "menopause", line: "Periods are changing or have stopped." },
  { id: "first-period", line: "Just started, or about to start, periods." },
];

const COMPANIONS = ["Bestie", "Sissy", "Didi", "Maa", "Saheli"];

const ACTIVITY: { id: Activity; label: string }[] = [
  { id: "low", label: "Mostly sitting" },
  { id: "light", label: "Lightly active" },
  { id: "moderate", label: "Active" },
  { id: "active", label: "Very active" },
];

const GOALS: { id: Goal; label: string }[] = [
  { id: "feel-better", label: "Feel better" },
  { id: "lose", label: "Lose weight" },
  { id: "maintain", label: "Stay where I am" },
  { id: "gain", label: "Gain weight" },
  { id: "strength", label: "Get stronger" },
];

type StepId = "name" | "stage" | "cycle" | "body" | "safety" | "companion" | "privacy";

interface Draft {
  name: string;
  relation: string;
  country: string;
  stage: LifeStage | null;
  lastPeriod: string;
  cycleLength: string;
  periodLength: string;
  dueDate: string;
  babyBirthDate: string;
  age: string;
  height: string; // cm or feet (imperial: "5.4" is not used, we ask ft + in)
  heightIn: string;
  weight: string;
  units: "metric" | "imperial";
  activity: Activity | "";
  goal: Goal | "";
  safety: SafetyFlags;
  companion: string;
  customCompanion: string;
}

export function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const adding = params.get("add") === "1";
  const hydrated = useHydrated();
  const hasProfiles = useAppStore((s) => s.profiles.length > 0);
  const addProfile = useAppStore((s) => s.addProfile);

  const [draft, setDraft] = useState<Draft>({
    name: "",
    relation: "",
    country: "IN",
    stage: null,
    lastPeriod: "",
    cycleLength: "28",
    periodLength: "5",
    dueDate: "",
    babyBirthDate: "",
    age: "",
    height: "",
    heightIn: "",
    weight: "",
    units: "metric",
    activity: "",
    goal: "",
    safety: { pregnant: false, breastfeeding: false, medicalCondition: false, conditions: [], eatingConcerns: false },
    companion: "Bestie",
    customCompanion: "",
  });
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  const steps: StepId[] = useMemo(() => {
    const s: StepId[] = ["name", "stage"];
    if (draft.stage !== "menopause") s.push("cycle"); // pregnancy asks for the due date here
    s.push("body", "safety", "companion", "privacy");
    return s;
  }, [draft.stage]);

  const step = steps[Math.min(index, steps.length - 1)];
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  function validate(): string {
    if (step === "name") {
      if (!draft.name.trim()) return "Add a name so Saheli knows what to call you.";
    }
    if (step === "stage" && !draft.stage) return "Choose the one that fits you best.";
    if (step === "cycle") {
      if (draft.stage === "pregnancy") {
        if (!draft.dueDate) return "Add your due date. You can change it later.";
        return "";
      }
      if (draft.stage === "postpartum" && !draft.babyBirthDate) return "Add your baby's birth date.";
      const cl = Number(draft.cycleLength);
      const pl = Number(draft.periodLength);
      if (draft.lastPeriod && draft.lastPeriod > todayISO()) return "Your last period can't be in the future.";
      if (!(cl >= 20 && cl <= 60)) return "Cycle length is usually between 21 and 45 days. Use a number from 20 to 60.";
      if (!(pl >= 2 && pl <= 10)) return "Period length is usually 2 to 10 days.";
    }
    if (step === "body") {
      if (draft.age && !(Number(draft.age) >= 8 && Number(draft.age) <= 100)) return "Check your age.";
    }
    if (step === "companion" && draft.companion === "own" && !draft.customCompanion.trim()) {
      return "Give your companion a name.";
    }
    return "";
  }

  function next() {
    const e = validate();
    setError(e);
    if (e) return;
    if (step === "stage" && draft.stage === "pregnancy") {
      set({ safety: { ...draft.safety, pregnant: true } });
    }
    if (index < steps.length - 1) setIndex(index + 1);
    else finish();
  }

  function back() {
    setError("");
    setIndex(Math.max(0, index - 1));
  }

  function finish() {
    const stage = draft.stage ?? "cycle";
    let heightCm: number | undefined;
    let weightKg: number | undefined;
    if (draft.units === "metric") {
      heightCm = draft.height ? Number(draft.height) : undefined;
      weightKg = draft.weight ? Number(draft.weight) : undefined;
    } else {
      const inches = Number(draft.height || 0) * 12 + Number(draft.heightIn || 0);
      heightCm = inches ? Math.round(inches * 2.54) : undefined;
      weightKg = draft.weight ? Math.round(Number(draft.weight) * 0.453592 * 10) / 10 : undefined;
    }
    const companionName = draft.companion === "own" ? draft.customCompanion.trim() : draft.companion;
    const profile: Profile = {
      name: draft.name.trim(),
      country: draft.country,
      units: draft.units,
      stage,
      age: draft.age ? Number(draft.age) : undefined,
      heightCm,
      weightKg,
      activity: draft.activity || undefined,
      goal: draft.goal || undefined,
      cycleLength: Number(draft.cycleLength) || 28,
      periodLength: Number(draft.periodLength) || 5,
      companionName: companionName || "Bestie",
      dueDate: stage === "pregnancy" ? draft.dueDate : undefined,
      babyBirthDate: stage === "postpartum" ? draft.babyBirthDate : undefined,
      safety: { ...draft.safety, pregnant: stage === "pregnancy" || draft.safety.pregnant },
      createdAt: new Date().toISOString(),
    };
    const id = newId();
    const store = profileStore(id).getState();
    store.setProfile(profile);
    if (draft.lastPeriod && stage !== "pregnancy" && stage !== "menopause") store.setPeriodStarts([draft.lastPeriod]);
    const today = todayISO();
    if (weightKg && stage !== "pregnancy" && stage !== "first-period" && !profile.safety.eatingConcerns) {
      profileStore(id).setState((s) => ({ weights: { ...s.weights, [today]: weightKg } }));
    }
    addProfile({ id, name: profile.name, stage, relation: draft.relation || undefined });
    router.push("/app");
  }

  const content: Record<StepId, ReactNode> = {
    name: <NameStep draft={draft} set={set} adding={adding || hasProfiles} />,
    stage: <StageStep draft={draft} set={set} />,
    cycle: <CycleStep draft={draft} set={set} />,
    body: <BodyStep draft={draft} set={set} />,
    safety: <SafetyStep draft={draft} set={set} />,
    companion: <CompanionStep draft={draft} set={set} />,
    privacy: <PrivacyStep />,
  };

  if (!hydrated) return <div className="min-h-dvh" aria-busy="true" />;

  const progress = ((index + 1) / steps.length) * 100;
  const last = index === steps.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="Saheli home">
          <Logo size="sm" />
        </Link>
        <LanguagePicker compact />
      </div>

      <div className="mt-8 flex items-center gap-3">
        {index > 0 ? (
          <button
            type="button"
            onClick={back}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span className="h-9 w-0" />
        )}
        <p className="tabular text-sm font-semibold text-ink-soft">
          {index + 1} of {steps.length}
        </p>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Setup progress"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form
        className="card mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        noValidate
      >
        {content[step]}
        {error && (
          <p className="mt-4 text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg mt-6 w-full sm:w-auto">
          {last ? "Open Saheli" : "Continue"}
        </button>
      </form>

      {!adding && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-soft">
          Just looking around?
          <TrySampleButton className="font-semibold text-primary-ink underline-offset-4 hover:underline inline-flex items-center gap-1.5" />
        </div>
      )}
    </div>
  );
}

/* ---------------- Steps ---------------- */

type StepProps = { draft: Draft; set: (p: Partial<Draft>) => void };

function StepHead({ label, title, lead }: { label: string; title: string; lead?: string }) {
  return (
    <>
      <p className="label">{label}</p>
      <h1 className="font-display mt-2 text-[1.9rem] leading-[1.15] text-ink sm:text-[2.1rem]">{title}</h1>
      {lead && <p className="mt-2 text-ink-soft">{lead}</p>}
    </>
  );
}

function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function NameStep({ draft, set, adding }: StepProps & { adding: boolean }) {
  const id = useId();
  return (
    <>
      <StepHead
        label={adding ? "New profile" : "Welcome"}
        title={adding ? "Who's joining Saheli?" : "Hi, I'm Saheli. What should I call you?"}
        lead={adding ? "Each woman gets her own private profile on this phone." : undefined}
      />
      <div className="mt-6 space-y-4">
        <Field label="Name" htmlFor={`${id}-n`}>
          <input
            id={`${id}-n`}
            className="input"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Your first name"
            autoComplete="given-name"
            autoFocus
            maxLength={40}
          />
        </Field>
        {adding && (
          <Field label="Relation (optional)" htmlFor={`${id}-r`}>
            <input
              id={`${id}-r`}
              className="input"
              value={draft.relation}
              onChange={(e) => set({ relation: e.target.value })}
              placeholder="Mother, daughter, sister…"
              maxLength={30}
            />
          </Field>
        )}
        <Field label="Country" hint="For helplines, units and food." htmlFor={`${id}-c`}>
          <select
            id={`${id}-c`}
            className="input"
            value={draft.country}
            onChange={(e) =>
              set({ country: e.target.value, units: e.target.value === "US" ? "imperial" : "metric" })
            }
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
            <option value="OTHER">Somewhere else</option>
          </select>
        </Field>
      </div>
    </>
  );
}

function StageStep({ draft, set }: StepProps) {
  return (
    <>
      <StepHead label="Your stage" title="Where are you in life right now?" lead="Saheli adapts to this. You can change it any time." />
      <div className="mt-6 grid gap-2.5" role="radiogroup" aria-label="Life stage">
        {STAGES.map((s) => {
          const on = draft.stage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set({ stage: s.id })}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                on ? "border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  on ? "border-primary bg-primary text-on-primary" : "border-line"
                }`}
              >
                {on && <Check size={12} strokeWidth={3} />}
              </span>
              <span>
                <span className="block font-semibold text-ink">{STAGE_LABEL[s.id]}</span>
                <span className="block text-sm text-ink-soft">{s.line}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CycleStep({ draft, set }: StepProps) {
  const id = useId();
  const today = todayISO();
  if (draft.stage === "pregnancy") {
    return (
      <>
        <StepHead label="Your pregnancy" title="When is your baby due?" lead="Saheli will follow you week by week." />
        <div className="mt-6">
          <Field label="Due date" htmlFor={`${id}-due`}>
            <input
              id={`${id}-due`}
              type="date"
              className="input"
              value={draft.dueDate}
              min={today}
              max={addDays(today, 300)}
              onChange={(e) => set({ dueDate: e.target.value })}
            />
          </Field>
        </div>
      </>
    );
  }
  return (
    <>
      <StepHead
        label="Your cycle"
        title={draft.stage === "postpartum" ? "Tell me about you and your baby" : "When did your last period start?"}
        lead="A guess is fine. Saheli learns as you log."
      />
      <div className="mt-6 space-y-4">
        {draft.stage === "postpartum" && (
          <Field label="Baby's birth date" htmlFor={`${id}-baby`}>
            <input
              id={`${id}-baby`}
              type="date"
              className="input"
              value={draft.babyBirthDate}
              max={today}
              onChange={(e) => set({ babyBirthDate: e.target.value })}
            />
          </Field>
        )}
        <Field
          label={draft.stage === "postpartum" ? "Last period start (if they've come back)" : "Last period start"}
          hint={draft.stage === "first-period" ? "If you haven't had one yet, leave this empty." : undefined}
          htmlFor={`${id}-lp`}
        >
          <input
            id={`${id}-lp`}
            type="date"
            className="input"
            value={draft.lastPeriod}
            max={today}
            onChange={(e) => set({ lastPeriod: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cycle length (days)" hint="Usually 21 to 35" htmlFor={`${id}-cl`}>
            <input
              id={`${id}-cl`}
              className="input tabular"
              inputMode="numeric"
              value={draft.cycleLength}
              onChange={(e) => set({ cycleLength: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
          <Field label="Period length (days)" hint="Usually 3 to 7" htmlFor={`${id}-pl`}>
            <input
              id={`${id}-pl`}
              className="input tabular"
              inputMode="numeric"
              value={draft.periodLength}
              onChange={(e) => set({ periodLength: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
        </div>
      </div>
    </>
  );
}

function BodyStep({ draft, set }: StepProps) {
  const id = useId();
  const girl = draft.stage === "first-period";
  const metric = draft.units === "metric";
  return (
    <>
      <StepHead
        label="About you (optional)"
        title={girl ? "A little about you" : "A few details for food and movement"}
        lead="Skip anything you like. You can add it later."
      />
      <div className="mt-6 space-y-4">
        <Field label="Age" htmlFor={`${id}-age`}>
          <input
            id={`${id}-age`}
            className="input tabular"
            inputMode="numeric"
            value={draft.age}
            onChange={(e) => set({ age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
          />
        </Field>
        {!girl && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Units</span>
              <div className="flex rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Units">
                {(["metric", "imperial"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={draft.units === u}
                    onClick={() => set({ units: u, height: "", heightIn: "", weight: "" })}
                    className={`h-8 rounded-full px-3.5 text-sm font-semibold ${
                      draft.units === u ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
                    }`}
                  >
                    {u === "metric" ? "kg · cm" : "lb · ft"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metric ? (
                <Field label="Height (cm)" htmlFor={`${id}-h`}>
                  <input
                    id={`${id}-h`}
                    className="input tabular"
                    inputMode="decimal"
                    value={draft.height}
                    onChange={(e) => set({ height: e.target.value.replace(/[^\d.]/g, "") })}
                  />
                </Field>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Height ft" htmlFor={`${id}-ft`}>
                    <input
                      id={`${id}-ft`}
                      className="input tabular"
                      inputMode="numeric"
                      value={draft.height}
                      onChange={(e) => set({ height: e.target.value.replace(/\D/g, "").slice(0, 1) })}
                    />
                  </Field>
                  <Field label="in" htmlFor={`${id}-in`}>
                    <input
                      id={`${id}-in`}
                      className="input tabular"
                      inputMode="numeric"
                      value={draft.heightIn}
                      onChange={(e) => set({ heightIn: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    />
                  </Field>
                </div>
              )}
              {draft.stage !== "pregnancy" && (
                <Field label={metric ? "Weight (kg)" : "Weight (lb)"} htmlFor={`${id}-w`}>
                  <input
                    id={`${id}-w`}
                    className="input tabular"
                    inputMode="decimal"
                    value={draft.weight}
                    onChange={(e) => set({ weight: e.target.value.replace(/[^\d.]/g, "") })}
                  />
                </Field>
              )}
            </div>
            <ChoiceRow
              label="How active are you?"
              options={ACTIVITY}
              value={draft.activity}
              onChange={(v) => set({ activity: v as Activity })}
            />
            {draft.stage !== "pregnancy" && draft.stage !== "postpartum" && (
              <ChoiceRow label="Your main goal" options={GOALS} value={draft.goal} onChange={(v) => set({ goal: v as Goal })} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(value === o.id ? "" : o.id)}
            className="chip"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SafetyStep({ draft, set }: StepProps) {
  const s = draft.safety;
  const toggle = (patch: Partial<SafetyFlags>) => set({ safety: { ...s, ...patch } });
  const items: { key: keyof Omit<SafetyFlags, "conditions">; label: string; line: string; locked?: boolean }[] = [
    { key: "pregnant", label: "I'm pregnant", line: "Saheli won't set calorie targets.", locked: draft.stage === "pregnancy" },
    { key: "breastfeeding", label: "I'm breastfeeding", line: "Your coach sets your food plan personally." },
    { key: "medicalCondition", label: "I have a medical condition", line: "Like thyroid, diabetes or PCOS." },
    { key: "eatingConcerns", label: "I've had concerns about eating", line: "Saheli will never show weight numbers or measurements." },
  ];
  const none = !s.pregnant && !s.breastfeeding && !s.medicalCondition && !s.eatingConcerns;
  return (
    <>
      <StepHead
        label="Keeping you safe"
        title="Do any of these apply to you?"
        lead="This keeps advice safe for you. It stays on this phone."
      />
      <div className="mt-6 space-y-2.5">
        {items.map((it) => {
          const on = s[it.key] || !!it.locked;
          return (
            <button
              key={it.key}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={it.locked}
              onClick={() => toggle({ [it.key]: !s[it.key] } as Partial<SafetyFlags>)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-100 ${
                on ? "border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                  on ? "border-primary bg-primary text-on-primary" : "border-line"
                }`}
              >
                {on && <Check size={12} strokeWidth={3} />}
              </span>
              <span>
                <span className="block font-semibold text-ink">{it.label}</span>
                <span className="block text-sm text-ink-soft">{it.line}</span>
              </span>
            </button>
          );
        })}
        {s.medicalCondition && (
          <div className="flex flex-wrap gap-2 pl-1 pt-1">
            {[
              ["thyroid", "Thyroid"],
              ["diabetes", "Diabetes"],
              ["pcos", "PCOS"],
              ["bp", "High blood pressure"],
              ["other", "Something else"],
            ].map(([id, label]) => {
              const on = s.conditions.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  className="chip"
                  onClick={() =>
                    toggle({ conditions: on ? s.conditions.filter((c) => c !== id) : [...s.conditions, id] })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {none && <p className="pt-1 text-sm text-ink-soft">None of these? Just continue.</p>}
      </div>
    </>
  );
}

function CompanionStep({ draft, set }: StepProps) {
  const id = useId();
  return (
    <>
      <StepHead
        label="Your companion"
        title="What would you like to call your companion?"
        lead="Someone to talk to, any time. Pick a name that feels like a friend."
      />
      <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Companion name">
        {[...COMPANIONS, "own"].map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={draft.companion === c}
            onClick={() => set({ companion: c })}
            className="chip"
          >
            {c === "own" ? "My own name" : c}
          </button>
        ))}
      </div>
      {draft.companion === "own" && (
        <div className="mt-4">
          <Field label="Companion's name" htmlFor={`${id}-own`}>
            <input
              id={`${id}-own`}
              className="input"
              value={draft.customCompanion}
              onChange={(e) => set({ customCompanion: e.target.value })}
              maxLength={20}
              autoFocus
            />
          </Field>
        </div>
      )}
    </>
  );
}

function PrivacyStep() {
  return (
    <>
      <StepHead label="Our promise" title="Your health stays yours." />
      <ul className="mt-6 space-y-3.5">
        {[
          [Lock, "Everything you log stays on this phone. No account, no sign-up."],
          [ShieldCheck, "Saheli never sells or shares your data, and shows no ads."],
          [Check, "Your Circle only sees what you choose, never your logs, moods or journal."],
          [Check, "Saheli explains, it doesn't diagnose. Always talk to your doctor."],
        ].map(([Icon, text], i) => {
          const I = Icon as typeof Lock;
          return (
            <li key={i} className="flex gap-3 text-ink">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-accent-ink">
                <I size={16} />
              </span>
              <span className="pt-1">{text as string}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
