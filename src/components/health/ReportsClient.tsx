"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  ExternalLink,
  FileUp,
  Keyboard,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import {
  formatValue,
  isLowSide,
  isOutOfRange,
  LAB_BY_KEY,
  LAB_TESTS,
  labStatus,
  type LabKey,
  type LatestResult,
} from "@/lib/labTests";
import type { ReadReport } from "@/lib/reportParse";
import {
  blobToBase64,
  deleteReportFile,
  getReportFile,
  MAX_PDF_BYTES,
  resizeImage,
  saveReportFile,
} from "@/lib/reportFiles";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import type { LabReport, OtherResult } from "@/lib/types";
import { SectionTitle } from "./HealthCheckClient";
import { ResultCard, ResultTile } from "./ResultParts";
import { useHealthData } from "./useHealthData";

/* ---------------- Draft being checked ---------------- */

interface Draft {
  date: string;
  lab: string;
  rows: { key: LabKey; value: string; printed?: string; converted?: boolean }[];
  other: OtherResult[];
  fromAi: boolean;
  fileId?: string;
  fileName?: string;
  fileType?: string;
}

const STARTER_KEYS: LabKey[] = ["haemoglobin", "ferritin", "vitaminD", "b12", "tsh"];

function emptyDraft(): Draft {
  return { date: todayISO(), lab: "", rows: STARTER_KEYS.map((key) => ({ key, value: "" })), other: [], fromAi: false };
}

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; fileName: string }
  | { kind: "review"; draft: Draft }
  | { kind: "error"; message: string };

/* ---------------- Upload card ---------------- */

function UploadCard({ onDraft, configured }: { onDraft: (d: Draft) => void; configured: boolean | null }) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setPhase({ kind: "error", message: "Please choose a PDF or a photo of your report." });
      return;
    }
    if (isPdf && file.size > MAX_PDF_BYTES) {
      setPhase({ kind: "error", message: "That PDF is over 3 MB. Take a photo of each page instead, or type your numbers." });
      return;
    }
    setPhase({ kind: "reading", fileName: file.name });
    const fileId = `rep-${newId()}`;
    try {
      const blob = isPdf ? file : await resizeImage(file, 2000);
      await saveReportFile(fileId, blob).catch(() => undefined);
      const base = { fileId, fileName: file.name, fileType: isPdf ? "application/pdf" : "image/jpeg" };

      if (configured === false) {
        onDraft({ ...emptyDraft(), ...base });
        setPhase({ kind: "idle" });
        return;
      }
      const data = await blobToBase64(blob);
      const res = await fetch("/api/reports/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: isPdf ? "pdf" : "image", mediaType: isPdf ? "application/pdf" : "image/jpeg", data }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; report?: ReadReport; error?: string } | null;
      if (!res.ok || !json?.ok || !json.report) {
        await deleteReportFile(fileId).catch(() => undefined);
        setPhase({ kind: "error", message: json?.error ?? "Saheli couldn't read that file. Please try again, or type your numbers." });
        return;
      }
      const r = json.report;
      onDraft({
        date: r.testDate ?? todayISO(),
        lab: r.lab ?? "",
        rows: r.values.map((v) => ({ key: v.key, value: String(v.value), printed: v.printed, converted: v.converted })),
        other: r.other,
        fromAi: true,
        ...base,
      });
      setPhase({ kind: "idle" });
    } catch {
      await deleteReportFile(fileId).catch(() => undefined);
      setPhase({ kind: "error", message: "Something didn't work while reading that file. Please check your connection and try again." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  const reading = phase.kind === "reading";

  return (
    <section className="rounded-[var(--radius-card)] border-2 border-[color-mix(in_srgb,var(--primary)_50%,transparent)] bg-surface p-5 sm:p-7" aria-labelledby="upload-title">
      <div className="flex items-start gap-4">
        <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink sm:grid">
          <FileUp size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="upload-title" className="font-display text-[1.6rem] leading-tight text-ink">
            Upload a report
          </h2>
          <p className="mt-1 text-ink-soft">
            A PDF or a photo of any blood test. Saheli reads the numbers, you check them, and the file stays on your phone.
          </p>

          {configured === false && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-ink">
              <Sparkles size={16} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden="true" />
              Reading reports isn&apos;t switched on yet. You can still keep your file here and type the numbers in.
            </p>
          )}

          {reading ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-2 p-4" role="status" aria-live="polite">
              <Loader2 size={20} className="shrink-0 animate-spin text-primary-ink" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold text-ink">Reading your report</p>
                <p className="truncate text-sm text-ink-soft">{phase.fileName} · this takes about 15 seconds</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                <FileUp size={18} aria-hidden="true" /> Choose PDF or photo
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => cameraRef.current?.click()}>
                <Camera size={18} aria-hidden="true" /> Take a photo
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onDraft(emptyDraft())}>
                <Keyboard size={18} aria-hidden="true" /> Type numbers only
              </button>
            </div>
          )}

          {phase.kind === "error" && (
            <p className="mt-4 flex items-start gap-2 text-sm text-[#9B1B30]" role="alert">
              <AlertCircle size={16} className="mt-[3px] shrink-0" aria-hidden="true" />
              {phase.message}
            </p>
          )}
          <p className="mt-4 text-xs text-ink-soft">PDFs up to 3 MB. Photos are made smaller on your phone before reading.</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => handleFile(e.target.files?.[0])} />
    </section>
  );
}

/* ---------------- Check the numbers ---------------- */

function ReviewCard({ draft: initial, onDone }: { draft: Draft; onDone: (saved: boolean) => void }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const uid = useId();
  const used = new Set(draft.rows.map((r) => r.key));
  const available = LAB_TESTS.filter((t) => !used.has(t.key));

  function setRow(i: number, value: string) {
    setDraft((d) => ({ ...d, rows: d.rows.map((r, j) => (j === i ? { ...r, value } : r)) }));
  }

  function save() {
    const values: Record<string, number> = {};
    for (const r of draft.rows) {
      const v = r.value.trim().replace(",", ".");
      if (!v) continue;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        setError(`Please check the number for ${LAB_BY_KEY[r.key].name}.`);
        return;
      }
      values[r.key] = n;
    }
    if (!draft.date || draft.date > todayISO()) {
      setError("Please add the date of the test.");
      return;
    }
    if (!Object.keys(values).length && !draft.other.length) {
      setError("Add at least one number to save this report.");
      return;
    }
    const report: LabReport = {
      id: draft.fileId ?? `rep-${newId()}`,
      date: draft.date,
      lab: draft.lab.trim() || undefined,
      values,
      other: draft.other,
      fileId: draft.fileId,
      fileName: draft.fileName,
      fileType: draft.fileType,
      source: draft.fromAi || draft.fileId ? "upload" : "typed",
      addedAt: new Date().toISOString(),
    };
    activeProfileStore().getState().addReport(report);
    onDone(true);
  }

  async function cancel() {
    if (draft.fileId) await deleteReportFile(draft.fileId).catch(() => undefined);
    onDone(false);
  }

  return (
    <section className="card" aria-labelledby={`${uid}-t`}>
      <h2 id={`${uid}-t`} className="font-display text-[1.6rem] leading-tight text-ink">
        {draft.fromAi ? "Check the numbers" : "Type your numbers"}
      </h2>
      <p className="mt-1 text-ink-soft">
        {draft.fromAi
          ? "Saheli read these from your report. Check each highlighted number against the paper before you save."
          : "Copy the numbers from your report. Leave out any you don't have."}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Test date</span>
          <input type="date" className="input" value={draft.date} max={todayISO()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Lab name</span>
          <input type="text" className="input" placeholder="e.g. CityCare Diagnostics" value={draft.lab} onChange={(e) => setDraft({ ...draft, lab: e.target.value })} />
        </label>
      </div>

      <ul className="mt-5 space-y-2.5">
        {draft.rows.map((r, i) => {
          const t = LAB_BY_KEY[r.key];
          const n = Number(r.value);
          const status = r.value && Number.isFinite(n) ? labStatus(r.key, n) : null;
          const hl = draft.fromAi;
          return (
            <li
              key={r.key}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl p-3 ${
                hl ? "border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface))]" : "border border-line"
              }`}
            >
              <label htmlFor={`${uid}-${r.key}`} className="min-w-0 flex-1 basis-40">
                <span className="block font-medium text-ink">{t.name}</span>
                {r.printed && (
                  <span className="block text-xs text-ink-soft">
                    Report says {r.printed}
                    {r.converted ? ` · shown in ${t.unit}` : ""}
                  </span>
                )}
                {status && isOutOfRange(status) && <span className="block text-xs font-semibold text-[#9B1B30]">{isLowSide(status) ? "Below" : "Above"} the usual range</span>}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${uid}-${r.key}`}
                  className="input !h-11 w-28 text-right tabular"
                  inputMode="decimal"
                  value={r.value}
                  placeholder="—"
                  onChange={(e) => setRow(i, e.target.value)}
                />
                <span className="w-16 text-sm text-ink-soft">{t.unit}</span>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                  aria-label={`Remove ${t.name}`}
                  onClick={() => setDraft((d) => ({ ...d, rows: d.rows.filter((_, j) => j !== i) }))}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {available.length > 0 && (
        <label className="mt-3 flex max-w-sm items-center gap-2">
          <Plus size={16} className="shrink-0 text-ink-soft" aria-hidden="true" />
          <span className="sr-only">Add a test</span>
          <select
            className="input !h-11"
            value=""
            onChange={(e) => {
              const key = e.target.value as LabKey;
              if (key) setDraft((d) => ({ ...d, rows: [...d.rows, { key, value: "" }] }));
            }}
          >
            <option value="">Add a test</option>
            {available.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {draft.other.length > 0 && (
        <details className="mt-5 rounded-2xl bg-surface-2 p-4">
          <summary className="font-semibold text-ink">Also on this report ({draft.other.length})</summary>
          <ul className="mt-2 divide-y divide-line text-sm">
            {draft.other.map((o, i) => (
              <li key={`${o.name}-${i}`} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 text-ink">{o.name}</span>
                <span className="tabular text-ink">
                  {o.value} {o.unit}
                </span>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface"
                  aria-label={`Remove ${o.name}`}
                  onClick={() => setDraft((d) => ({ ...d, other: d.other.filter((_, j) => j !== i) }))}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-[#9B1B30]" role="alert">
          <AlertCircle size={16} className="mt-[3px] shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button type="button" className="btn btn-primary" onClick={save}>
          <Check size={18} aria-hidden="true" /> {draft.fromAi ? "Looks right, save" : "Save report"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={cancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}

/* ---------------- How Saheli uses your results ---------------- */

const USE_LINES: Partial<Record<LabKey, { low?: string; high?: string }>> = {
  haemoglobin: { low: "Nourish puts iron-rich foods with vitamin C first, and Move keeps workouts gentle." },
  ferritin: { low: "Nourish adds iron foods to your meals and your grocery list." },
  vitaminD: { low: "Move suggests a morning walk in the sun, and Nourish adds vitamin D foods." },
  b12: { low: "Nourish adds dairy, eggs or fortified foods for B12." },
  folate: { low: "Nourish adds leafy greens and dals for folate." },
  tsh: { high: "Your checklist can remind you about thyroid medicine, and Nourish adds selenium and iodine foods.", low: "Move keeps workouts moderate until your thyroid settles." },
  fastingSugar: { high: "Nourish favours low-GI meals and Move suggests a walk after meals." },
  hba1c: { high: "Nourish favours low-GI meals and Move suggests a walk after meals." },
  fastingInsulin: { high: "Nourish picks insulin-friendly meals and Move adds strength work." },
  cholesterol: { high: "Nourish adds oats, dals and nuts, and Move adds brisk cardio." },
  ldl: { high: "Nourish adds oats, dals and nuts, and Move adds brisk cardio." },
  triglycerides: { high: "Nourish cuts back on sweets and refined carbs." },
  hdl: { low: "Nourish adds healthy fats, and Move adds cardio you enjoy." },
  calcium: { low: "Nourish adds ragi, curd and sesame, and Move adds weight-bearing exercise." },
  testosterone: { high: "Nourish picks insulin-friendly meals that help PCOS hormones." },
};

function UsingResults({ latest }: { latest: LatestResult[] }) {
  const lines = new Set<string>();
  for (const r of latest) {
    if (!isOutOfRange(r.status)) continue;
    const l = USE_LINES[r.key];
    const text = isLowSide(r.status) ? l?.low : l?.high;
    if (text) lines.add(text);
  }
  const all = [
    ...lines,
    "Your Bestie knows your latest numbers when you chat.",
    "Health check ticks the tests you already have results for.",
    "Your doctor summary lists every result with its previous value.",
  ];
  return (
    <section className="panel" aria-labelledby="using">
      <h2 id="using" className="font-display text-[1.4rem] leading-tight text-ink">
        How Saheli is using your results
      </h2>
      <ul className="mt-3 space-y-2">
        {all.map((l) => (
          <li key={l} className="flex items-start gap-2.5 text-ink">
            <Check size={16} strokeWidth={3} className="mt-[5px] shrink-0 text-accent-ink" aria-hidden="true" />
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Coach share ---------------- */

function CoachShare() {
  const on = useProfileStore((s) => !!s.shareReportsWithCoach);
  return (
    <section className="card flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold text-ink">Your coach</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Share your latest report numbers when you ask Neha for a diet or workout plan. Files are never shared.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Share report numbers with your coach"
        onClick={() => activeProfileStore().getState().setShareReportsWithCoach(!on)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
      </button>
    </section>
  );
}

/* ---------------- All reports ---------------- */

function ReportItem({ report }: { report: LabReport }) {
  const [confirm, setConfirm] = useState(false);
  const [fileMissing, setFileMissing] = useState(false);
  const keys = LAB_TESTS.filter((t) => report.values[t.key] !== undefined).map((t) => t.key);

  async function openFile() {
    if (!report.fileId) return;
    const blob = await getReportFile(report.fileId).catch(() => undefined);
    if (!blob) {
      setFileMissing(true);
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function remove() {
    if (report.fileId) await deleteReportFile(report.fileId).catch(() => undefined);
    activeProfileStore().getState().removeReport(report.id);
  }

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{report.lab || "Blood report"}</h3>
          <p className="text-sm text-ink-soft tabular">
            {formatShort(report.date)}, {report.date.slice(0, 4)} · {keys.length} {keys.length === 1 ? "result" : "results"} Saheli knows
            {report.source === "typed" ? " · typed in" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {report.fileId && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={openFile}>
              <ExternalLink size={16} aria-hidden="true" /> Open file
            </button>
          )}
          {confirm ? (
            <>
              <button type="button" className="btn btn-sm bg-[#C62828] text-white" onClick={remove}>
                Delete
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>
                Keep
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)} aria-label={`Delete report from ${report.date}`}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {fileMissing && <p className="mt-2 text-sm text-ink-soft">The file isn&apos;t on this phone any more. The numbers are still saved.</p>}
      <ul className="mt-4 flex flex-wrap gap-2">
        {keys.map((k) => {
          const v = report.values[k];
          const st = labStatus(k, v);
          return (
            <li
              key={k}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm ${
                isOutOfRange(st) ? "border-[#9B1B30]/30 bg-[#FDE2E2] text-[#5c1020]" : "border-line text-ink"
              }`}
            >
              <span>{LAB_BY_KEY[k].name}</span>
              <span className="font-semibold tabular">{formatValue(k, v)}</span>
            </li>
          );
        })}
      </ul>
      {report.other.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm font-semibold text-primary-ink">Also on this report ({report.other.length})</summary>
          <ul className="mt-2 divide-y divide-line text-sm">
            {report.other.map((o, i) => (
              <li key={`${o.name}-${i}`} className="flex flex-wrap justify-between gap-x-3 py-2">
                <span className="text-ink">{o.name}</span>
                <span className="tabular text-ink-soft">
                  {o.value} {o.unit}
                  {o.range ? ` · usual ${o.range}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

/* ---------------- Page ---------------- */

export function ReportsClient() {
  const { profile, reports, latest } = useHealthData();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/reports/read")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => live && setConfigured(!!j.configured))
      .catch(() => live && setConfigured(null));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (draft) reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [draft]);

  if (!profile) return null;

  const out = latest.filter((r) => isOutOfRange(r.status));
  const inRange = latest.filter((r) => !isOutOfRange(r.status));
  const sorted = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-10">
      {draft ? (
        <div ref={reviewRef} className="scroll-mt-24">
          <ReviewCard
            draft={draft}
            onDone={(saved) => {
              setDraft(null);
              setSavedNote(saved);
            }}
          />
        </div>
      ) : (
        <UploadCard configured={configured} onDraft={(d) => { setSavedNote(false); setDraft(d); }} />
      )}

      {savedNote && (
        <p className="-mt-6 flex items-center gap-2 text-sm font-medium text-accent-ink" role="status">
          <Check size={16} strokeWidth={3} aria-hidden="true" /> Saved. Your results below are up to date.
        </p>
      )}

      <section aria-labelledby="meaning">
        <SectionTitle>
          <span id="meaning">What your latest results mean</span>
        </SectionTitle>
        {latest.length === 0 ? (
          <div className="card text-ink-soft">
            Your results will show here, each one explained with food and movement tips. Upload a report or type your numbers to start.
          </div>
        ) : (
          <div className="space-y-5">
            {out.length > 0 && (
              <div className="space-y-5">
                {out.map((r) => (
                  <ResultCard key={r.key} result={r} />
                ))}
              </div>
            )}
            {inRange.length > 0 && (
              <div>
                <p className="label mb-3">In the usual range</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {inRange.map((r) => (
                    <ResultTile key={r.key} result={r} />
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-ink-soft">Usual ranges are a general guide for adult women. Your lab&apos;s own range on the paper may differ a little.</p>
          </div>
        )}
      </section>

      {latest.length > 0 && <UsingResults latest={latest} />}

      <CoachShare />

      <section aria-labelledby="all-reports">
        <SectionTitle aside={sorted.length > 0 ? <p className="text-sm text-ink-soft tabular">{sorted.length} saved on this phone</p> : undefined}>
          <span id="all-reports">All reports</span>
        </SectionTitle>
        {sorted.length === 0 ? (
          <div className="card text-ink-soft">No reports yet. Your uploads will be listed here.</div>
        ) : (
          <div className="space-y-5">
            {sorted.map((r) => (
              <ReportItem key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-sm text-ink-soft">
        Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.{" "}
        <Link href="/app/report" className="font-semibold text-primary-ink underline underline-offset-2">
          Make a doctor summary
        </Link>
      </p>
    </div>
  );
}
