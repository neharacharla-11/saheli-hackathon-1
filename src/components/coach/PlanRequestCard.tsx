"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Feather, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { useMyDay, setPlanRequest } from "@/lib/myDay";
import { PHASE_LABEL } from "@/lib/cycle";
import { formatShort } from "@/lib/dates";
import { STAGE_LABEL, useAppStore, useProfileStore } from "@/lib/store";
import type { PlanRequest, PlanRequestDetails } from "@/lib/types";
import { Field, Notice } from "@/components/nourish/bits";

export const DIET_GOALS = [
  "Lose fat",
  "Gain healthy weight",
  "Eat healthier",
  "More energy",
  "Better periods",
  "PCOS support",
  "Pregnancy nutrition",
  "Breastfeeding",
  "Build muscle",
  "Better digestion",
];

export const WORKOUT_GOALS = [
  "Get stronger",
  "Lose weight gently",
  "More energy",
  "Better periods",
  "PCOS support",
  "Build muscle",
  "Bone health",
  "Less pain",
  "Move more",
  "Better sleep",
];

const COPY = {
  diet: {
    title: "Ask Neha for a personal diet plan",
    lead: "Neha Racharla is a certified nutritionist and fitness coach who specialises in women's nutrition. Tell her a little about you and she'll write a plan meal by meal, just for you.",
    waiting: "Neha is writing your plan",
    waitingLead: "She reads every request herself, so it can take a day or two. Your plan will appear right here on Nourish, and your grocery list will fill itself from it.",
    ready: "Your plan is ready. You'll find it above under Your diet plan from your coach.",
  },
  workout: {
    title: "Ask Neha for a personal workout plan",
    lead: "Tell Neha what you'd like to feel and what fits your week. She'll write a plan day by day that moves with your cycle.",
    waiting: "Your coach is preparing your workout plan",
    waitingLead: "She reads every request herself, so it can take a day or two. Your plan will appear right here on Move.",
    ready: "Your workout plan is ready. You'll find it above.",
  },
};

function useConfigured() {
  const [c, setC] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/coach")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => live && setC(!!d.configured))
      .catch(() => live && setC(false));
    return () => {
      live = false;
    };
  }, []);
  return c;
}

/** Ask the server for news about her request. Returns a message for her. */
export async function checkPlan(kind: "diet" | "workout", req: PlanRequest): Promise<string> {
  if (!req.token || !req.secret) return "This is a sample plan, so there's nothing new to check.";
  try {
    const res = await fetch(`/api/coach?token=${encodeURIComponent(req.token)}&secret=${encodeURIComponent(req.secret)}`, { cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; error?: string; request?: Pick<PlanRequest, "status" | "plan" | "coachNote"> };
    if (!data.ok || !data.request) return data.error ?? "Couldn't check just now.";
    const r = data.request;
    const changed = r.status !== req.status || r.plan?.writtenAt !== req.plan?.writtenAt;
    setPlanRequest(kind, { ...req, status: r.status, plan: r.plan ?? req.plan, coachNote: r.coachNote, checkedAt: new Date().toISOString(), seen: changed ? false : req.seen });
    if (r.status === "ready") return "Your plan is ready.";
    if (r.status === "changes") return "Neha has a question for you.";
    return "Not yet. Neha will get to it soon.";
  } catch {
    return "Couldn't check just now. Please try again.";
  }
}

export function PlanRequestCard({ kind }: { kind: "diet" | "workout" }) {
  const req = useProfileStore((s) => (kind === "diet" ? s.dietRequest : s.workoutRequest) ?? null);
  const isSample = useAppStore((s) => !!s.sample);
  const configured = useConfigured();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const copy = COPY[kind];

  // Check once when she opens the page with a request waiting.
  useEffect(() => {
    if (req?.token && req.status !== "ready" && configured) {
      checkPlan(kind, req);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, kind, req?.token]);

  if (req && !editing && (req.status === "waiting" || req.status === "changes")) {
    return (
      <section className="card border-2 border-[color-mix(in_srgb,var(--primary)_40%,transparent)]" aria-labelledby={`plan-req-${kind}`}>
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink" aria-hidden="true">
            <Feather size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="label mb-1">{req.status === "changes" ? "NEHA HAS A QUESTION" : "SENT " + formatShort(req.sentAt.slice(0, 10)).toUpperCase()}</p>
            <h2 id={`plan-req-${kind}`} className="font-display text-[1.6rem] leading-tight text-ink">
              {req.status === "changes" ? "A little more about you, please" : copy.waiting}
            </h2>
            {req.status === "changes" ? (
              <div className="mt-3 rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">
                <p className="mb-1 text-sm font-semibold text-primary-ink">From Neha</p>
                {req.coachNote}
              </div>
            ) : (
              <p className="mt-2 max-w-[600px] text-ink-soft">{copy.waitingLead}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {req.status === "waiting" && (
                <button
                  className="btn btn-primary"
                  disabled={checking}
                  onClick={async () => {
                    setChecking(true);
                    setMsg(await checkPlan(kind, req));
                    setChecking(false);
                  }}
                >
                  {checking ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                  Check
                </button>
              )}
              <button className={`btn ${req.status === "changes" ? "btn-primary" : "btn-secondary"}`} onClick={() => setEditing(true)}>
                Edit my request
              </button>
            </div>
            {msg && (
              <p className="mt-3 text-sm text-ink-soft" role="status">
                {msg}
              </p>
            )}
            <details className="group mt-4">
              <summary className="flex list-none items-center gap-1 text-sm font-semibold text-primary-ink [&::-webkit-details-marker]:hidden">
                What you sent
                <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <SentDetails details={req.details} kind={kind} />
              <button
                className="mt-3 text-sm text-ink-soft underline underline-offset-4"
                onClick={async () => {
                  if (!confirm("Cancel this request and delete it from Saheli's server?")) return;
                  if (req.token && req.secret) {
                    await fetch("/api/coach", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: req.token, secret: req.secret }) }).catch(() => {});
                  }
                  setPlanRequest(kind, null);
                }}
              >
                Cancel my request
              </button>
            </details>
          </div>
        </div>
        {isSample && <p className="mt-4 text-xs text-ink-soft">This is sample data, so nothing was really sent.</p>}
      </section>
    );
  }

  if (req?.status === "ready" && !editing) {
    return (
      <section className="card" aria-labelledby={`plan-req-${kind}`}>
        <h2 id={`plan-req-${kind}`} className="font-display text-[1.45rem] text-ink">
          {copy.title}
        </h2>
        <p className="mt-2 text-ink-soft">{copy.ready}</p>
        <button className="btn btn-secondary mt-4" onClick={() => setEditing(true)}>
          Ask for a new or updated plan
        </button>
      </section>
    );
  }

  return (
    <RequestForm
      kind={kind}
      existing={req}
      configured={configured}
      onDone={() => setEditing(false)}
      onCancel={req ? () => setEditing(false) : undefined}
    />
  );
}

function SentDetails({ details, kind }: { details: PlanRequestDetails; kind: "diet" | "workout" }) {
  const rows: [string, string | undefined][] = [
    ["Name", details.name],
    ["Goals", details.goals.join(", ")],
    kind === "diet" ? ["Meals a day", details.mealsPerDay?.toString()] : ["Days a week", details.daysPerWeek?.toString()],
    kind === "diet" ? ["Cuisine", details.cuisine] : ["Where", details.place],
    [kind === "diet" ? "Allergies" : "Injuries or limits", details.allergies],
    [kind === "diet" ? "Dislikes" : "Moves you don't enjoy", details.dislikes],
    ["Routine", details.routine],
    ["Notes", details.notes],
  ];
  const n = details.numbers;
  return (
    <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[140px_1fr]">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-ink">{k}</dt>
            <dd className="text-ink-soft">{v}</dd>
          </div>
        ))}
      <dt className="font-semibold text-ink">Your numbers</dt>
      <dd className="text-ink-soft">
        {details.shareNumbers && n
          ? [n.age && `${n.age} years`, n.heightCm && `${n.heightCm} cm`, n.weightKg && `${n.weightKg} kg`, n.activity, n.stage, n.diet, n.phase].filter(Boolean).join(" · ")
          : "Not shared"}
      </dd>
    </dl>
  );
}

function RequestForm({
  kind,
  existing,
  configured,
  onDone,
  onCancel,
}: {
  kind: "diet" | "workout";
  existing: PlanRequest | null;
  configured: boolean | null;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { profile, phase } = useMyDay();
  const isSample = useAppStore((s) => !!s.sample);
  const goals = kind === "diet" ? DIET_GOALS : WORKOUT_GOALS;
  const d = existing?.details;
  const [f, setF] = useState<PlanRequestDetails>(
    d ?? {
      name: profile?.name ?? "",
      goals: [],
      mealsPerDay: kind === "diet" ? 4 : undefined,
      daysPerWeek: kind === "workout" ? 3 : undefined,
      place: kind === "workout" ? "Home" : undefined,
      cuisine: kind === "diet" ? (profile?.country === "IN" || !profile?.country ? "Indian home food" : "") : undefined,
      shareNumbers: true,
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hideWeight = !!profile?.safety?.eatingConcerns || profile?.stage === "first-period" || profile?.stage === "pregnancy";

  function numbers(): PlanRequestDetails["numbers"] {
    if (!profile) return undefined;
    return {
      age: profile.age,
      heightCm: profile.heightCm,
      weightKg: hideWeight ? undefined : profile.weightKg,
      activity: profile.activity,
      stage: STAGE_LABEL[profile.stage],
      diet: profile.diet,
      phase: phase ? PHASE_LABEL[phase] : undefined,
      country: profile.country,
    };
  }

  async function send() {
    setError("");
    if (!f.name.trim()) return setError("Please add your name so Neha knows who the plan is for.");
    if (!f.goals.length) return setError("Please pick at least one goal.");
    const details: PlanRequestDetails = { ...f, numbers: f.shareNumbers ? numbers() : undefined };

    if (isSample) {
      setPlanRequest(kind, { kind, sentAt: new Date().toISOString(), status: "waiting", details, plan: existing?.plan });
      onDone();
      return;
    }

    setBusy(true);
    try {
      const editingRemote = existing?.token && existing.secret;
      const res = await fetch("/api/coach", {
        method: editingRemote ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRemote ? { token: existing!.token, secret: existing!.secret, details } : { kind, details }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; token?: string; secret?: string };
      if (!data.ok) {
        setError(data.error ?? "Couldn't send just now. Please try again.");
        return;
      }
      setPlanRequest(kind, {
        kind,
        token: data.token ?? existing?.token,
        secret: data.secret ?? existing?.secret,
        sentAt: new Date().toISOString(),
        status: "waiting",
        details,
        plan: existing?.plan,
      });
      onDone();
    } catch {
      setError("Couldn't send just now. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const toggleGoal = (g: string) => setF({ ...f, goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g] });
  const id = (s: string) => `${kind}-${s}`;

  return (
    <section className="card border-2 border-[color-mix(in_srgb,var(--primary)_40%,transparent)]" aria-labelledby={id("form-title")}>
      <p className="label mb-1">PERSONAL PLAN FROM NEHA</p>
      <h2 id={id("form-title")} className="font-display text-[1.6rem] leading-tight text-ink">
        {COPY[kind].title}
      </h2>
      <p className="mt-2 max-w-[672px] text-ink-soft">{COPY[kind].lead}</p>

      {configured === false && !isSample && (
        <div className="mt-4">
          <Notice icon={Sparkles}>Personal plans aren&apos;t switched on yet. You can fill this in now and send it once they are.</Notice>
        </div>
      )}

      <form
        className="mt-5 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">What would you like help with?</legend>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button type="button" key={g} className="chip" aria-pressed={f.goals.includes(g)} onClick={() => toggleGoal(g)}>
                {g}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor={id("name")}>
            <input id={id("name")} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="given-name" />
          </Field>
          {kind === "diet" ? (
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-ink">Meals a day</legend>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((n) => (
                  <button type="button" key={n} className="chip w-12 justify-center" aria-pressed={f.mealsPerDay === n} onClick={() => setF({ ...f, mealsPerDay: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-ink">Days a week</legend>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button type="button" key={n} className="chip w-11 justify-center" aria-pressed={f.daysPerWeek === n} onClick={() => setF({ ...f, daysPerWeek: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {kind === "diet" ? (
            <Field label="Cuisine you love" htmlFor={id("cuisine")}>
              <input id={id("cuisine")} className="input" placeholder="e.g. Maharashtrian, South Indian, Punjabi" value={f.cuisine ?? ""} onChange={(e) => setF({ ...f, cuisine: e.target.value })} />
            </Field>
          ) : (
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-ink">Where you&apos;ll work out</legend>
              <div className="flex gap-2">
                {["Home", "Gym", "Both"].map((p) => (
                  <button type="button" key={p} className="chip" aria-pressed={f.place === p} onClick={() => setF({ ...f, place: p })}>
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <Field label={kind === "diet" ? "Allergies" : "Injuries, pain or health limits"} htmlFor={id("allergies")}>
            <input id={id("allergies")} className="input" placeholder={kind === "diet" ? "e.g. peanuts, lactose" : "e.g. knee pain, lower back"} value={f.allergies ?? ""} onChange={(e) => setF({ ...f, allergies: e.target.value })} />
          </Field>
          <Field label={kind === "diet" ? "Foods you don't like" : "Moves you don't enjoy"} htmlFor={id("dislikes")}>
            <input id={id("dislikes")} className="input" placeholder={kind === "diet" ? "e.g. karela, mushrooms" : "e.g. burpees, running"} value={f.dislikes ?? ""} onChange={(e) => setF({ ...f, dislikes: e.target.value })} />
          </Field>
          <Field label="Your daily routine" htmlFor={id("routine")}>
            <input
              id={id("routine")}
              className="input"
              placeholder={kind === "diet" ? "e.g. office 9 to 6, dinner at 9" : "e.g. 20 free minutes before work"}
              value={f.routine ?? ""}
              onChange={(e) => setF({ ...f, routine: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Anything else Neha should know" htmlFor={id("notes")}>
          <textarea
            id={id("notes")}
            className="input min-h-[96px] py-3"
            placeholder="Your health conditions, medicines, what you've tried before, what you'd love to change"
            value={f.notes ?? ""}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-2 p-4">
          <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
            <input type="checkbox" className="peer sr-only" checked={f.shareNumbers} onChange={(e) => setF({ ...f, shareNumbers: e.target.checked })} />
            <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-ink" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
          <span className="text-[15px]">
            <span className="block font-semibold text-ink">Share my basic numbers</span>
            <span className="block text-sm text-ink-soft">
              Your age, height{hideWeight ? "" : ", weight"}, activity, life stage, diet and cycle phase. Never your logs, moods, journal or chats.
            </span>
          </span>
        </label>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy || (configured === false && !isSample)}>
            {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {existing ? "Send my update" : "Send to Neha"}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-lg" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-ink-soft">Only what you see here is sent, to Neha only. You can cancel and delete your request any time.</p>
      </form>
    </section>
  );
}
