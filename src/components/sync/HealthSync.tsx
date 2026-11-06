"use client";

import { useEffect, useRef, useState } from "react";
import { Apple, Check, Download, FileSpreadsheet, Loader2, Smartphone, Trash2 } from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import { mergePeriodStarts, periodStartsFromDays, type AppleResult } from "@/lib/appleHealth";
import { combineDaily, CSV_TEMPLATE, latestWeight, parseHealthCsv, type DailyHealth } from "@/lib/healthCsv";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { HealthImport } from "@/lib/types";

interface Imported {
  source: string;
  data: DailyHealth;
  periodStarts: number;
  files?: number;
}

/** Merge new days into what she already imported, and add period starts. */
function saveImport(source: string, data: DailyHealth, periodDays: string[] = []): number {
  const store = activeProfileStore();
  const s = store.getState();
  const prev: HealthImport = s.health ?? {};
  const health: HealthImport = {
    ...prev,
    source,
    steps: { ...(prev.steps ?? {}), ...data.steps },
    sleepMin: { ...(prev.sleepMin ?? {}), ...data.sleepMin },
    weight: { ...(prev.weight ?? {}), ...data.weight },
    importedAt: new Date().toISOString(),
  };
  const starts = periodStartsFromDays(periodDays);
  const merged = mergePeriodStarts(s.periodStarts, starts);
  const added = merged.length - s.periodStarts.length;
  store.setState({ health });
  if (added > 0) s.setPeriodStarts(merged);
  return added;
}

function countDays(r: Record<string, number>) {
  return Object.keys(r).length;
}

function ImportSummary({ imp, onDone }: { imp: Imported; onDone: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const [used, setUsed] = useState(false);
  const w = latestWeight(imp.data.weight);
  const canWeigh = profile && !profile.safety?.eatingConcerns && profile.stage !== "first-period" && profile.stage !== "pregnancy";
  const lines = [
    countDays(imp.data.steps) && `${countDays(imp.data.steps)} ${countDays(imp.data.steps) === 1 ? "day" : "days"} of steps`,
    countDays(imp.data.sleepMin) && `${countDays(imp.data.sleepMin)} ${countDays(imp.data.sleepMin) === 1 ? "night" : "nights"} of sleep`,
    imp.periodStarts > 0 && `${imp.periodStarts} new period ${imp.periodStarts === 1 ? "start" : "starts"}`,
    canWeigh && w && `latest weight ${w.kg} kg on ${formatShort(w.date)}`,
  ].filter(Boolean);

  return (
    <div className="mt-4 rounded-2xl bg-surface-2 p-4" role="status">
      <p className="flex items-start gap-2 font-semibold text-ink">
        <Check size={18} strokeWidth={3} className="mt-[3px] shrink-0 text-accent-ink" aria-hidden="true" />
        {lines.length ? "Imported from " + imp.source : "Nothing new found in " + (imp.files && imp.files > 1 ? "those files" : "that file")}
      </p>
      {lines.length > 0 && <p className="mt-1 text-sm text-ink">{lines.join(" · ")}.</p>}
      {lines.length > 0 && <p className="mt-1 text-sm text-ink-soft">Your steps show on Move, your sleep on Mind, and both on your doctor summary.</p>}
      {!lines.length && <p className="mt-1 text-sm text-ink-soft">Check that the file has a date column and steps, sleep or weight. The template below shows the layout.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {canWeigh && w && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={used}
            onClick={() => {
              const s = activeProfileStore().getState();
              s.setWeight(w.date, w.kg);
              s.updateProfile({ weightKg: w.kg });
              setUsed(true);
            }}
          >
            {used ? <Check size={16} aria-hidden="true" /> : null}
            {used ? "Saved as your weight" : `Use ${w.kg} kg as my weight`}
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

/* ---------------- Apple Health ---------------- */

function AppleCard() {
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [imp, setImp] = useState<Imported | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function start(file: File | undefined) {
    if (!file) return;
    if (!/\.(zip|xml)$/i.test(file.name)) {
      setError("Please choose export.zip (or export.xml) from the Health app.");
      return;
    }
    setError("");
    setImp(null);
    setPct(0);
    workerRef.current?.terminate();
    const w = new Worker(new URL("../../workers/appleHealth.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<{ type: string; pct?: number; result?: AppleResult; message?: string }>) => {
      const m = e.data;
      if (m.type === "progress") setPct(m.pct ?? 0);
      else if (m.type === "error") {
        setPct(null);
        setError(m.message ?? "We couldn't read that file.");
        w.terminate();
      } else if (m.type === "done" && m.result) {
        const r = m.result;
        const added = saveImport("Apple Health", r, r.periodDays);
        setImp({ source: "Apple Health", data: r, periodStarts: added });
        setPct(null);
        w.terminate();
      }
    };
    w.onerror = () => {
      setPct(null);
      setError("We couldn't read that file. Please try again.");
    };
    w.postMessage({ file, today: todayISO() });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="card flex flex-col" aria-labelledby="apple-title">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink">
          <Apple size={20} aria-hidden="true" />
        </span>
        <h3 id="apple-title" className="font-display text-[1.35rem] leading-tight text-ink">
          Apple Health
        </h3>
      </div>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] text-ink">
        <li>On your iPhone, open the Health app and tap your picture.</li>
        <li>Tap Export All Health Data, then save export.zip to Files.</li>
        <li>Choose that file here. It&apos;s read on this phone and never uploaded.</li>
      </ol>
      <p className="mt-2 text-sm text-ink-soft">Brings in steps, sleep, period days and your latest weight from the last year.</p>
      <div className="mt-auto pt-4">
        {pct !== null ? (
          <div role="status" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Loader2 size={16} className="animate-spin text-primary-ink" aria-hidden="true" /> Reading your Health data · {pct}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Big exports can take a minute. Keep this page open.</p>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            Choose export.zip
          </button>
        )}
        {error && (
          <p className="mt-3 text-sm text-[#9B1B30]" role="alert">
            {error}
          </p>
        )}
        {imp && <ImportSummary imp={imp} onDone={() => setImp(null)} />}
      </div>
      <input ref={inputRef} type="file" accept=".zip,.xml,application/zip,text/xml" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => start(e.target.files?.[0])} />
    </section>
  );
}

/* ---------------- Android health apps ---------------- */

function AndroidCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imp, setImp] = useState<Imported | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function start(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    setImp(null);
    try {
      const today = todayISO();
      const results: DailyHealth[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 50 * 1024 * 1024) continue;
        results.push(parseHealthCsv(await f.text(), today, f.name));
      }
      const data = combineDaily(results);
      const any = countDays(data.steps) + countDays(data.sleepMin) + countDays(data.weight) > 0;
      if (any) saveImport("your health app", data);
      setImp({ source: "your health app", data, periodStarts: 0, files: files.length });
    } catch {
      setError("We couldn't read that file. Please choose a CSV file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "saheli-health-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <section className="card flex flex-col" aria-labelledby="android-title">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink">
          <Smartphone size={20} aria-hidden="true" />
        </span>
        <h3 id="android-title" className="font-display text-[1.35rem] leading-tight text-ink">
          Android health apps
        </h3>
      </div>
      <p className="mt-3 text-[15px] text-ink">
        Websites can&apos;t read Google Health Connect directly, so bring in a CSV file from your app instead:
      </p>
      <ul className="mt-2 space-y-1 text-sm text-ink">
        <li>
          <span className="font-semibold">Google Fit:</span> Google Takeout, then Fit, then the Daily activity metrics file
        </li>
        <li>
          <span className="font-semibold">Samsung Health:</span> Settings, then Download personal data
        </li>
        <li>
          <span className="font-semibold">Fitbit:</span> Settings, then Data export
        </li>
        <li>
          <span className="font-semibold">Health Sync:</span> export your data to CSV
        </li>
      </ul>
      <p className="mt-2 text-sm text-ink-soft">Steps, sleep and weight from the last year. You can choose several files at once.</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <FileSpreadsheet size={18} aria-hidden="true" />}
          Choose CSV files
        </button>
        <button type="button" className="btn btn-ghost" onClick={downloadTemplate}>
          <Download size={18} aria-hidden="true" /> Template
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-[#9B1B30]" role="alert">
          {error}
        </p>
      )}
      {imp && <ImportSummary imp={imp} onDone={() => setImp(null)} />}
      <input ref={inputRef} type="file" accept=".csv,text/csv" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => start(e.target.files)} />
    </section>
  );
}

/* ---------------- Section ---------------- */

export function HealthSync() {
  const health = useProfileStore((s) => s.health);
  const steps = countDays(health?.steps ?? {});
  const sleep = countDays(health?.sleepMin ?? {});
  return (
    <section className="space-y-4" aria-labelledby="sync-title">
      <div>
        <h2 id="sync-title" className="font-display text-[1.6rem] leading-tight text-ink">
          Health sync
        </h2>
        <p className="mt-1 text-ink-soft">Bring in steps, sleep and weight from your phone&apos;s health app. Everything stays on this phone.</p>
      </div>
      {health?.importedAt && (steps > 0 || sleep > 0) && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 !py-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">Last import {formatShort(health.importedAt.slice(0, 10))}</span>
            {health.source ? ` from ${health.source}` : ""} · {steps} days of steps · {sleep} nights of sleep
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => activeProfileStore().setState({ health: undefined })}
          >
            <Trash2 size={16} aria-hidden="true" /> Remove imported data
          </button>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <AppleCard />
        <AndroidCard />
      </div>
    </section>
  );
}
