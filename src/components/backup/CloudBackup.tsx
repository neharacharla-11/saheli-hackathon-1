"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, CloudUpload, Copy, Download, KeyRound, Loader2, Lock, RotateCcw, Trash2 } from "lucide-react";
import { backupConfigured, backupNow, createBackup, deleteCloudBackup, restoreFromCloud, useBackupStore } from "@/lib/backupClient";
import { useAppStore, useHydrated } from "@/lib/store";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Err({ msg }: { msg: string }) {
  return (
    <p className="mt-3 flex items-start gap-2 text-sm text-[#9B1B30]" role="alert">
      <AlertCircle size={16} className="mt-[3px] shrink-0" aria-hidden="true" />
      {msg}
    </p>
  );
}

function SaveCode({ code, onDone }: { code: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  function download() {
    const text = `Your Saheli backup code\n\n${code}\n\nYou need this code and your password to restore your backup on a new phone.\nKeep it somewhere safe. Saheli can't recover it for you.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "saheli-backup-code.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-[color-mix(in_srgb,var(--primary)_50%,transparent)] bg-surface p-5 sm:p-7">
      <h3 className="font-display text-[1.6rem] leading-tight text-ink">Save your backup code</h3>
      <p className="mt-1 text-ink-soft">You&apos;ll need this code and your password to restore on a new phone. Nobody, not even Saheli, can open your backup without both.</p>
      <p className="mt-5 select-all break-all rounded-2xl bg-surface-2 px-4 py-4 text-center font-mono text-[1.35rem] font-semibold tracking-wider text-ink sm:text-[1.6rem]">{code}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
          }}
        >
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {copied ? "Copied" : "Copy code"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={download}>
          <Download size={18} aria-hidden="true" /> Save as a file
        </button>
      </div>
      <label className="mt-5 flex items-start gap-3 text-ink">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        I&apos;ve saved my code somewhere safe, like a password manager or a note in a safe place.
      </label>
      <button type="button" className="btn btn-primary mt-4" disabled={!saved} onClick={onDone}>
        Done
      </button>
    </div>
  );
}

export function CloudBackup() {
  const hydrated = useHydrated();
  const sample = useAppStore((s) => s.sample);
  const b = useBackupStore();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [code, setCode] = useState("");
  const [rpw, setRpw] = useState("");
  const [busy, setBusy] = useState<"" | "create" | "restore" | "now" | "delete">("");
  const [error, setError] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    backupConfigured().then(setConfigured);
  }, []);

  async function run(kind: typeof busy, fn: () => Promise<void>) {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something didn't work. Please try again.");
    } finally {
      setBusy("");
    }
  }

  const header = (
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink">
        <CloudUpload size={20} aria-hidden="true" />
      </span>
      <div>
        <h2 id="backup-title" className="font-display text-[1.6rem] leading-tight text-ink">
          Your Saheli account: encrypted cloud backup
        </h2>
        <p className="mt-1 text-ink-soft">
          Your data is locked on this phone with your password before it&apos;s sent. Our server only ever stores scrambled data it can&apos;t read.
        </p>
      </div>
    </div>
  );

  const footnote = (
    <p className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
      <Lock size={14} className="mt-[4px] shrink-0" aria-hidden="true" />
      Report files and progress photos stay on this phone and aren&apos;t part of the backup.
    </p>
  );

  if (!hydrated) return <section className="card h-40" aria-busy="true" />;

  if (newCode) {
    return (
      <section aria-labelledby="backup-title" className="space-y-4">
        <SaveCode code={newCode} onDone={() => setNewCode(null)} />
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="backup-title">
      {header}

      {sample ? (
        <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-ink">Cloud backup isn&apos;t available while sample data is open. Exit the sample to back up your own data.</p>
      ) : configured === false ? (
        <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-ink">Cloud backup isn&apos;t switched on yet. Everything is still safe on this phone.</p>
      ) : b.id && b.code ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Check size={18} strokeWidth={3} className="text-accent-ink" aria-hidden="true" />
              {b.lastAt ? `Backed up ${when(b.lastAt)}` : "Backup is on"}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">Saheli backs up automatically once a day while you use it.</p>
            <p className="mt-2 text-sm text-ink">
              Code:{" "}
              <span className="font-mono font-semibold tracking-wide">{showCode ? b.code : `${b.code.slice(0, 12)}••••-••••`}</span>{" "}
              <button type="button" className="font-semibold text-primary-ink underline underline-offset-2" onClick={() => setShowCode((v) => !v)}>
                {showCode ? "Hide" : "Show"}
              </button>
            </p>
            {b.error && <p className="mt-2 text-sm text-[#9B1B30]">Last automatic backup didn&apos;t work: {b.error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => run("now", async () => void (await backupNow()))}>
              {busy === "now" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <CloudUpload size={18} aria-hidden="true" />} Back up now
            </button>
            {confirmDelete ? (
              <>
                <button type="button" className="btn bg-[#C62828] text-white" disabled={!!busy} onClick={() => run("delete", deleteCloudBackup).then(() => setConfirmDelete(false))}>
                  {busy === "delete" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Trash2 size={18} aria-hidden="true" />} Yes, delete my backup
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={18} aria-hidden="true" /> Delete backup
              </button>
            )}
          </div>
          {confirmDelete && <p className="text-sm text-ink-soft">This deletes the copy on our server. Everything on this phone stays.</p>}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <form
            className="rounded-2xl border border-line p-4 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.length < 8) return setError("Please use a password of at least 8 characters.");
              if (pw !== pw2) return setError("The two passwords don't match.");
              run("create", async () => {
                const c = await createBackup(pw);
                setPw("");
                setPw2("");
                setNewCode(c);
              });
            }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <KeyRound size={18} className="text-primary-ink" aria-hidden="true" /> Turn on backup
            </h3>
            <p className="mt-1 text-sm text-ink-soft">Pick a password you&apos;ll remember. Saheli can&apos;t reset it for you.</p>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-ink">Password</span>
              <input type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-ink">Type it again</span>
              <input type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary mt-4" disabled={!!busy || configured === null}>
              {busy === "create" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
              {busy === "create" ? "Locking and saving" : "Turn on backup"}
            </button>
          </form>

          <form
            className="rounded-2xl border border-line p-4 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!confirmRestore) return setConfirmRestore(true);
              run("restore", async () => {
                await restoreFromCloud(code, rpw);
                // A full reload so every store reads the restored data.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.assign("/app");
              });
            }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <RotateCcw size={18} className="text-primary-ink" aria-hidden="true" /> Restore on this phone
            </h3>
            <p className="mt-1 text-sm text-ink-soft">New phone? Enter your backup code and password.</p>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-ink">Backup code</span>
              <input className="input font-mono uppercase" placeholder="SAHELI-XXXX-XXXX-XXXX" autoCapitalize="characters" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-ink">Password</span>
              <input type="password" className="input" autoComplete="current-password" value={rpw} onChange={(e) => setRpw(e.target.value)} />
            </label>
            {confirmRestore && <p className="mt-3 text-sm text-[#9B1B30]">This replaces Saheli&apos;s data on this phone with your backup. Tap again to continue.</p>}
            <button type="submit" className="btn btn-secondary mt-4" disabled={!!busy || !code.trim() || !rpw || configured === null}>
              {busy === "restore" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
              {busy === "restore" ? "Unlocking" : confirmRestore ? "Yes, restore my backup" : "Restore"}
            </button>
          </form>
        </div>
      )}
      {error && <Err msg={error} />}
      {footnote}
    </section>
  );
}
