"use client";

import { useState } from "react";
import { BadgeCheck, BookOpen, EyeOff, FileText, Lock, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { CardHead } from "@/components/pregnancy/ui";
import { deleteEverything, hashPin, isValidPin, randomSalt, checkPin } from "@/lib/settingsCrypto";
import { usePrivacyStore } from "@/lib/settingsStore";

/* ---------------- Our promise ---------------- */

const PROMISES = [
  "Your health data stays on this phone. There's no account and no password to leak.",
  "We never sell or share your data, and there are no ads.",
  "Circle only ever shares a schedule of your phases, never your logs, moods, food, journal or chats.",
  "When you ask Saheli's AI something, only what's needed for that answer is sent, and never your name.",
  "You can take your data with you or delete all of it, any time.",
];

export function OurPromise() {
  return (
    <section className="card">
      <CardHead icon={ShieldCheck} title="Our promise" />
      <ul className="space-y-2.5">
        {PROMISES.map((p) => (
          <li key={p} className="flex gap-2.5 text-[15px] text-ink">
            <BadgeCheck size={18} className="mt-[3px] shrink-0 text-accent-ink" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- PIN lock ---------------- */

function PinInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      <input
        className="input tabular w-32 tracking-[0.5em]"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      />
    </label>
  );
}

export function PinLock() {
  const pinHash = usePrivacyStore((s) => s.pinHash);
  const lockAfter = usePrivacyStore((s) => s.lockAfterMin);
  const setPin = usePrivacyStore((s) => s.setPin);
  const clearPin = usePrivacyStore((s) => s.clearPin);
  const setLockAfter = usePrivacyStore((s) => s.setLockAfter);
  const [mode, setMode] = useState<"idle" | "set" | "off">("idle");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [msg, setMsg] = useState("");

  function reset() {
    setMode("idle");
    setA("");
    setB("");
  }

  async function saveNew() {
    if (!isValidPin(a)) return setMsg("Your PIN is 4 numbers.");
    if (a !== b) return setMsg("The two PINs don't match. Try again.");
    const salt = randomSalt();
    setPin(await hashPin(a, salt), salt);
    setMsg("PIN lock is on. Saheli asks for it each time you open the app.");
    reset();
  }

  async function turnOff() {
    const { pinHash: h, pinSalt } = usePrivacyStore.getState();
    if (!h || !pinSalt || !(await checkPin(a, pinSalt, h))) return setMsg("That's not your current PIN.");
    clearPin();
    setMsg("PIN lock is off.");
    reset();
  }

  return (
    <section className="card">
      <CardHead icon={Lock} title="PIN lock" right={pinHash ? <span className="font-semibold text-accent-ink">On</span> : "Off"} />
      <p className="text-[15px] text-ink-soft">
        A 4-number PIN keeps Saheli private if someone else picks up your phone. It&apos;s kept only on this phone and can&apos;t be recovered.
      </p>

      {mode === "set" && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-4">
            <PinInput label={pinHash ? "New PIN" : "Choose a PIN"} value={a} onChange={setA} />
            <PinInput label="Type it again" value={b} onChange={setB} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={saveNew} disabled={a.length < 4 || b.length < 4}>
              Save PIN
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "off" && (
        <div className="mt-4 space-y-3">
          <PinInput label="Your current PIN" value={a} onChange={setA} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={turnOff} disabled={a.length < 4}>
              Turn off PIN lock
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={pinHash ? "btn btn-secondary btn-sm" : "btn btn-primary"} onClick={() => { setMode("set"); setMsg(""); }}>
            {pinHash ? "Change PIN" : "Set a PIN"}
          </button>
          {pinHash && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new Event("saheli:lock-now"))}>
                Lock now
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMode("off"); setMsg(""); }}>
                Turn off
              </button>
            </>
          )}
        </div>
      )}

      {pinHash && mode === "idle" && (
        <label className="mt-4 flex flex-wrap items-center gap-2 text-[15px] text-ink">
          Lock again when I&apos;m away for
          <select className="input h-10 w-auto py-0" value={lockAfter} onChange={(e) => setLockAfter(Number(e.target.value))}>
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </label>
      )}
      {msg && <p className="mt-3 text-sm text-ink-soft" aria-live="polite">{msg}</p>}
    </section>
  );
}

/* ---------------- Discreet mode ---------------- */

export function DiscreetMode() {
  const on = usePrivacyStore((s) => s.discreet);
  const setOn = usePrivacyStore((s) => s.setDiscreet);
  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <CardHead icon={EyeOff} title="Discreet mode" />
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Discreet mode"
          onClick={() => setOn(!on)}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <p className="-mt-1 text-[15px] text-ink-soft">For a shared phone or a nosy glance.</p>
      <ul className="mt-3 space-y-1.5 text-[15px] text-ink">
        <li>The browser tab is called &ldquo;Notes&rdquo; with a plain icon.</li>
        <li>Reminders say &ldquo;Reminder&rdquo; with no health words.</li>
        <li>The lock screen shows no name or logo.</li>
      </ul>
    </section>
  );
}

/* ---------------- Why you can trust what Saheli says ---------------- */

const TRUST = [
  {
    icon: BookOpen,
    title: "Where it comes from",
    text: "Food, movement and health guidance follows public guidelines from bodies like the WHO, ICMR and NHS, in plain words.",
  },
  {
    icon: UserCheck,
    title: "Who checks it",
    text: "Written and reviewed by Neha Racharla, a certified nutritionist and fitness coach specialised in women's health. Pregnancy and condition plans are always set personally.",
  },
  {
    icon: FileText,
    title: "Your uploaded reports",
    text: "Reports are read to explain your numbers, then kept only on this phone. You check every value before it's saved. Saheli explains, it doesn't diagnose.",
  },
];

export function TrustSection() {
  return (
    <section className="card">
      <h2 className="font-display text-[1.45rem] leading-tight text-ink">Why you can trust what Saheli says</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-3">
        {TRUST.map((t) => (
          <div key={t.title} className="rounded-2xl bg-surface-2 p-4">
            <t.icon size={20} className="text-primary-ink" aria-hidden />
            <p className="mt-2 font-semibold text-ink">{t.title}</p>
            <p className="mt-1 text-[15px] text-ink-soft">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Delete everything ---------------- */

export function DeleteEverything() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = typed.trim().toLowerCase() === "delete";

  async function wipe() {
    if (!ok) return;
    setBusy(true);
    await deleteEverything();
    window.location.replace("/");
  }

  return (
    <section className="card">
      <CardHead icon={Trash2} title="Delete everything" />
      <p className="text-[15px] text-ink-soft">
        Removes every profile, log, report, photo and chat from this phone. It can&apos;t be undone, so back up to a file first if you might want it later.
      </p>
      {!open ? (
        <button type="button" className="btn mt-4 bg-danger text-white hover:brightness-105" onClick={() => setOpen(true)}>
          <Trash2 size={16} aria-hidden /> Delete everything
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-4 text-[#5c1020]">
          <label className="block">
            <span className="block font-semibold">Type &ldquo;delete&rdquo; to confirm</span>
            <input className="input mt-2 max-w-[240px]" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn bg-danger text-white hover:brightness-105" onClick={wipe} disabled={!ok || busy}>
              {busy ? "Deleting" : "Delete everything on this phone"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setOpen(false); setTyped(""); }}>
              Keep my data
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
