"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LockKeyhole, LogOut, Plus, RefreshCw, Send, Trash2, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Field, Notice, Pill } from "@/components/nourish/bits";
import type { CoachPlan, PlanMeal, PlanRequestDetails, PlanStatus } from "@/lib/types";

interface Req {
  token: string;
  kind: "diet" | "workout";
  details: PlanRequestDetails;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  coachNote?: string;
  plan?: CoachPlan;
  draft?: CoachPlan;
}

const PASS_KEY = "saheli:coach-pass";

async function api<T>(body: Record<string, unknown>): Promise<T & { ok?: boolean; error?: string }> {
  const res = await fetch("/api/coach/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

/** Neha's private desk: read requests, write plans, mark ready or ask for changes. */
export function CoachDesk() {
  const [state, setState] = useState<{ configured: boolean; hasPasscode: boolean } | null>(null);
  const [pass, setPass] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PlanStatus | "all">("waiting");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coach/admin")
      .then((r) => r.json())
      .then((d) => setState({ configured: !!d.configured, hasPasscode: !!d.hasPasscode }))
      .catch(() => setState({ configured: false, hasPasscode: false }));
    const saved = sessionStorage.getItem(PASS_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setPass(saved);
  }, []);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setError("");
    try {
      const d = await api<{ requests?: Req[] }>({ action: "list", passcode: p });
      if (!d.ok) {
        setError(d.error ?? "Couldn't load requests.");
        if (d.error?.includes("passcode")) {
          sessionStorage.removeItem(PASS_KEY);
          setPass(null);
        }
        return;
      }
      setReqs(d.requests ?? []);
    } catch {
      setError("Couldn't reach Saheli's server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pass) load(pass);
  }, [pass, load]);

  const shown = (reqs ?? []).filter((r) => filter === "all" || r.status === filter);
  const count = (s: PlanStatus) => (reqs ?? []).filter((r) => r.status === s).length;

  return (
    <div className="theme-rose-light min-h-dvh bg-bg px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[960px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Logo size="md" tagline />
            <p className="label mt-5">COACH DESK</p>
            <h1 className="font-display text-[2.3rem] leading-tight text-ink">Plans to write</h1>
          </div>
          {pass && (
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => load(pass)} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                Refresh
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  sessionStorage.removeItem(PASS_KEY);
                  setPass(null);
                  setReqs(null);
                }}
              >
                <LogOut size={16} aria-hidden="true" />
                Lock
              </button>
            </div>
          )}
        </header>

        {!state ? (
          <div className="h-40" aria-busy="true" />
        ) : !state.configured ? (
          <div className="card">
            <p className="text-ink">The coach desk isn&apos;t switched on yet. Add Upstash Redis from the Vercel Marketplace (it sets KV_REST_API_URL and KV_REST_API_TOKEN), then redeploy.</p>
          </div>
        ) : !pass ? (
          <PasscodeForm
            setup={!state.hasPasscode}
            onDone={(p) => {
              sessionStorage.setItem(PASS_KEY, p);
              setState({ ...state, hasPasscode: true });
              setPass(p);
            }}
          />
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Show">
              {(
                [
                  ["waiting", `Waiting (${count("waiting")})`],
                  ["changes", `Asked for changes (${count("changes")})`],
                  ["ready", `Ready (${count("ready")})`],
                  ["all", "All"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} className="chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            {reqs && shown.length === 0 && (
              <div className="card text-ink-soft">{filter === "waiting" ? "No one is waiting right now. New requests will show here." : "Nothing here yet."}</div>
            )}
            <div className="flex flex-col gap-5">
              {shown.map((r) => (
                <RequestCard
                  key={r.token}
                  req={r}
                  open={open === r.token}
                  onToggle={() => setOpen(open === r.token ? null : r.token)}
                  passcode={pass}
                  onSaved={() => {
                    setOpen(null);
                    load(pass);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PasscodeForm({ setup, onDone }: { setup: boolean; onDone: (p: string) => void }) {
  const [p, setP] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card max-w-[480px]"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        if (p.length < 6) return setError("Please use at least 6 characters.");
        if (setup && p !== p2) return setError("The two passcodes don't match.");
        setBusy(true);
        try {
          const d = await api(setup ? { action: "setup", passcode: p } : { action: "list", passcode: p });
          if (!d.ok) setError(d.error ?? "That didn't work.");
          else onDone(p);
        } catch {
          setError("Couldn't reach Saheli's server.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-1 flex items-center gap-2 font-display text-[1.5rem] text-ink">
        <LockKeyhole size={20} className="text-primary-ink" aria-hidden="true" />
        {setup ? "Set your coach passcode" : "Welcome back, Neha"}
      </h2>
      <p className="mb-4 text-sm text-ink-soft">{setup ? "This is the first time. Choose a passcode only you know. You'll need it every time you open this page." : "Enter your coach passcode."}</p>
      <div className="flex flex-col gap-3">
        <input className="input" type="password" autoComplete={setup ? "new-password" : "current-password"} placeholder="Passcode" value={p} onChange={(e) => setP(e.target.value)} aria-label="Passcode" />
        {setup && <input className="input" type="password" autoComplete="new-password" placeholder="Passcode again" value={p2} onChange={(e) => setP2(e.target.value)} aria-label="Passcode again" />}
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {setup ? "Set passcode" : "Open"}
        </button>
      </div>
    </form>
  );
}

const DIET_SLOTS: Record<number, string[]> = {
  3: ["Breakfast", "Lunch", "Dinner"],
  4: ["Breakfast", "Lunch", "Evening", "Dinner"],
  5: ["Early morning", "Breakfast", "Lunch", "Evening", "Dinner"],
  6: ["Early morning", "Breakfast", "Mid-morning", "Lunch", "Evening", "Dinner"],
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function defaultSlots(r: Req): PlanMeal[] {
  const saved = r.draft ?? r.plan;
  if (saved?.meals.length) return saved.meals;
  if (r.kind === "diet") return (DIET_SLOTS[r.details.mealsPerDay ?? 5] ?? DIET_SLOTS[5]).map((slot) => ({ slot, items: "" }));
  const n = Math.min(7, Math.max(1, r.details.daysPerWeek ?? 3));
  const picks = n >= 7 ? DAYS : DAYS.filter((_, i) => i % Math.ceil(7 / n) === 0).slice(0, n);
  return picks.map((slot) => ({ slot, title: "", items: "" }));
}

function RequestCard({ req, open, onToggle, passcode, onSaved }: { req: Req; open: boolean; onToggle: () => void; passcode: string; onSaved: () => void }) {
  const d = req.details;
  const n = d.numbers;
  const rows: [string, string | undefined][] = [
    ["Goals", d.goals.join(", ")],
    [req.kind === "diet" ? "Meals a day" : "Days a week", (req.kind === "diet" ? d.mealsPerDay : d.daysPerWeek)?.toString()],
    [req.kind === "diet" ? "Cuisine" : "Where", req.kind === "diet" ? d.cuisine : d.place],
    [req.kind === "diet" ? "Allergies" : "Injuries or limits", d.allergies],
    [req.kind === "diet" ? "Dislikes" : "Moves she doesn't enjoy", d.dislikes],
    ["Routine", d.routine],
    ["Notes", d.notes],
    [
      "Her numbers",
      d.shareNumbers && n
        ? [n.age && `${n.age} years`, n.heightCm && `${n.heightCm} cm`, n.weightKg && `${n.weightKg} kg`, n.activity && `activity ${n.activity}`, n.stage, n.diet, n.phase && `${n.phase} phase`, n.country]
            .filter(Boolean)
            .join(" · ")
        : "Not shared",
    ],
  ];

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Pill tone={req.kind === "diet" ? "green" : "soft"}>{req.kind === "diet" ? "Diet plan" : "Workout plan"}</Pill>
            <Pill tone={req.status === "ready" ? "green" : req.status === "changes" ? "amber" : "primary"}>
              {req.status === "ready" ? "Ready" : req.status === "changes" ? "Asked for changes" : "Waiting"}
            </Pill>
          </div>
          <h2 className="font-display text-[1.5rem] text-ink">{d.name}</h2>
          <p className="text-xs text-ink-soft">
            Sent {new Date(req.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {req.updatedAt !== req.createdAt && ` · updated ${new Date(req.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <button className={`btn ${open ? "btn-ghost" : "btn-primary"} btn-sm`} onClick={onToggle}>
          {open ? "Close" : req.draft ? "Continue draft" : req.plan ? "Edit plan" : "Write plan"}
        </button>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[150px_1fr]">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold text-ink">{k}</dt>
              <dd className="whitespace-pre-line text-ink-soft">{v}</dd>
            </div>
          ))}
      </dl>
      {req.coachNote && req.status === "changes" && <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-sm text-ink">You asked: {req.coachNote}</p>}
      {open && <PlanEditor req={req} passcode={passcode} onSaved={onSaved} />}
    </article>
  );
}

function PlanEditor({ req, passcode, onSaved }: { req: Req; passcode: string; onSaved: () => void }) {
  const [intro, setIntro] = useState((req.draft ?? req.plan)?.intro ?? "");
  const [meals, setMeals] = useState<PlanMeal[]>(() => defaultSlots(req));
  const [note, setNote] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(status: PlanStatus) {
    setError("");
    setBusy(true);
    try {
      const plan = { intro, meals: meals.filter((m) => m.slot.trim() && m.items.trim()) };
      const d = await api({ action: "save", passcode, token: req.token, status, plan: plan.meals.length ? plan : undefined, note: status === "changes" ? note : undefined });
      if (!d.ok) setError(d.error ?? "Couldn't save.");
      else onSaved();
    } catch {
      setError("Couldn't reach Saheli's server.");
    } finally {
      setBusy(false);
    }
  }

  const update = (i: number, patch: Partial<PlanMeal>) => setMeals(meals.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <div className="mt-6 border-t border-line pt-6">
      <Field label="A few words for her" htmlFor={`intro-${req.token}`} hint="Why this plan fits her: her goals, cycle, reports, routine.">
        <textarea id={`intro-${req.token}`} className="input min-h-[90px] py-3" value={intro} onChange={(e) => setIntro(e.target.value)} />
      </Field>
      <p className="mb-2 mt-5 text-sm font-semibold text-ink">{req.kind === "diet" ? "Meal by meal" : "Day by day"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {meals.map((m, i) => (
          <div key={i} className="rounded-2xl bg-surface-2 p-4">
            <div className="mb-2 flex gap-2">
              <input className="input h-10 flex-1 text-sm font-semibold" value={m.slot} onChange={(e) => update(i, { slot: e.target.value })} aria-label="Meal or day" />
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface" onClick={() => setMeals(meals.filter((_, j) => j !== i))} aria-label={`Remove ${m.slot}`}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
            {req.kind === "workout" && (
              <input className="input mb-2 h-10 text-sm" placeholder="Title, e.g. Lower body strength" value={m.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} aria-label="Workout title" />
            )}
            <textarea
              className="input min-h-[110px] py-2.5 text-[15px]"
              placeholder={req.kind === "diet" ? "e.g. 2 ragi dosas with sambar, an orange" : "e.g. Squats 3x12, rows 3x10, 10 min walk"}
              value={m.items}
              onChange={(e) => update(i, { items: e.target.value })}
              aria-label={`${m.slot} plan`}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm mt-3 -ml-2" onClick={() => setMeals([...meals, { slot: req.kind === "diet" ? "Snack" : "Day", items: "" }])}>
        <Plus size={16} aria-hidden="true" />
        Add {req.kind === "diet" ? "a meal" : "a day"}
      </button>

      {askOpen && (
        <div className="mt-4 rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">What would you like her to change or tell you?</p>
            <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setAskOpen(false)} aria-label="Close">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <textarea className="input min-h-[80px] py-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Could you tell me what time you usually eat dinner, and if you take any medicines?" />
          <button className="btn btn-secondary mt-3" onClick={() => save("changes")} disabled={busy || !note.trim()}>
            Send question to {req.details.name}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => save("ready")} disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          Mark ready and send
        </button>
        <button className="btn btn-secondary" onClick={() => save("waiting")} disabled={busy}>
          Save draft
        </button>
        {!askOpen && (
          <button className="btn btn-ghost" onClick={() => setAskOpen(true)}>
            Ask for changes
          </button>
        )}
      </div>
    </div>
  );
}
