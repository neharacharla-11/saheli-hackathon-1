"use client";

import { useEffect, useState } from "react";
import { Delete, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { checkPin, deleteEverything } from "@/lib/settingsCrypto";
import { usePrivacyStore } from "@/lib/settingsStore";

// Unlocked once per app open (a full reload locks again); client navigation keeps it.
let unlockedThisOpen = false;
let hiddenAt: number | null = null;

const NEUTRAL_TITLE = "Notes";
const NEUTRAL_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="5" y="3" width="22" height="26" rx="4" fill="#9CA3AF"/><path d="M10 11h12M10 16h12M10 21h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  );

/** PIN lock overlay and discreet mode for the app. Renders nothing unless she turned them on. */
export function PrivacyGuard() {
  const pinHash = usePrivacyStore((s) => s.pinHash);
  const discreet = usePrivacyStore((s) => s.discreet);
  const [locked, setLocked] = useState(() => !!usePrivacyStore.getState().pinHash && !unlockedThisOpen);

  // Lock again when she comes back after a while away.
  useEffect(() => {
    if (!pinHash) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const after = usePrivacyStore.getState().lockAfterMin * 60_000;
      if (hiddenAt !== null && Date.now() - hiddenAt >= after) {
        unlockedThisOpen = false;
        setLocked(true);
      }
      hiddenAt = null;
    };
    const onLockNow = () => {
      unlockedThisOpen = false;
      setLocked(true);
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("saheli:lock-now", onLockNow);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("saheli:lock-now", onLockNow);
    };
  }, [pinHash]);

  // Discreet mode: a plain tab title and icon.
  useEffect(() => {
    if (!discreet) return;
    const iconLinks = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]')];
    const oldIcons = iconLinks.map((l) => l.href);
    iconLinks.forEach((l) => (l.href = NEUTRAL_ICON));
    const oldTitle = document.title;
    const fix = () => {
      if (document.title !== NEUTRAL_TITLE) document.title = NEUTRAL_TITLE;
    };
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      mo.disconnect();
      iconLinks.forEach((l, i) => (l.href = oldIcons[i]));
      document.title = oldTitle;
    };
  }, [discreet]);

  if (!pinHash || !locked) return null;
  return (
    <LockScreen
      onUnlock={() => {
        unlockedThisOpen = true;
        setLocked(false);
      }}
    />
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const discreet = usePrivacyStore((s) => s.discreet);

  async function press(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      const { pinHash, pinSalt } = usePrivacyStore.getState();
      if (pinHash && pinSalt && (await checkPin(next, pinSalt, pinHash))) onUnlock();
      else {
        setError("That's not your PIN. Try again.");
        setTimeout(() => setPin(""), 350);
      }
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) void press(e.key);
      if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function wipe() {
    await deleteEverything();
    window.location.replace("/");
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-10" role="dialog" aria-modal="true" aria-label="Enter your PIN">
      {discreet ? <Lock size={36} className="text-ink-soft" aria-hidden /> : <Logo size="md" />}
      <p className="mt-6 font-display text-[1.7rem] text-ink">Enter your PIN</p>
      <div className="mt-5 flex gap-3" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-3.5 w-3.5 rounded-full border-2 border-primary ${i < pin.length ? "bg-primary" : ""}`} />
        ))}
      </div>
      <p className="mt-3 h-5 text-sm text-[#9B1B30]">{error}</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className="h-16 w-16 rounded-full bg-surface text-2xl font-semibold text-ink shadow-[var(--shadow-soft)] hover:bg-surface-2 tabular">
            {d}
          </button>
        ))}
        <span />
        <button type="button" onClick={() => press("0")} className="h-16 w-16 rounded-full bg-surface text-2xl font-semibold text-ink shadow-[var(--shadow-soft)] hover:bg-surface-2 tabular">
          0
        </button>
        <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete last digit" className="grid h-16 w-16 place-items-center rounded-full text-ink-soft hover:bg-surface-2">
          <Delete size={22} />
        </button>
      </div>
      {!forgot ? (
        <button type="button" className="mt-8 text-sm font-semibold text-ink-soft underline underline-offset-2" onClick={() => setForgot(true)}>
          Forgot PIN?
        </button>
      ) : (
        <div className="mt-8 max-w-sm rounded-2xl border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-4 text-center text-[#5c1020]">
          <p className="font-semibold">Your PIN can&apos;t be recovered</p>
          <p className="mt-1 text-sm">Nothing is stored anywhere else. To start again, delete everything on this phone.</p>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" className="btn btn-sm bg-danger text-white hover:brightness-105" onClick={wipe}>
              Delete everything on this phone
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForgot(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
