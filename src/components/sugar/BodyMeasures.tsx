"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Lock, Ruler, Trash2, X } from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import { deletePhoto, getPhoto, resizeImage, savePhoto } from "@/lib/reportFiles";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import type { Measure } from "@/lib/types";

const NO_MEASURES: Measure[] = [];
const IN = 2.54;

export const PARTS = [
  { key: "waist", label: "Waist", hint: "At the belly button" },
  { key: "hip", label: "Hips", hint: "Widest part" },
  { key: "chest", label: "Chest", hint: "Fullest part" },
  { key: "arm", label: "Upper arm", hint: "Midway, relaxed" },
  { key: "thigh", label: "Thigh", hint: "Widest part" },
] as const;

type PartKey = (typeof PARTS)[number]["key"];

/** Measurements are never shown with eating concerns or for the first-period stage. */
export function useMeasuresAllowed(): boolean {
  return useProfileStore((s) => !!s.profile && !s.profile.safety?.eatingConcerns && s.profile.stage !== "first-period");
}

function show(cm: number, imperial: boolean) {
  return imperial ? (cm / IN).toFixed(1) : cm.toFixed(1).replace(/\.0$/, "");
}

function Photo({ id, label }: { id: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    let live = true;
    getPhoto(id)
      .then((b) => {
        if (b && live) {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  if (!url) return <span className="grid h-20 w-16 place-items-center rounded-xl bg-surface-2 text-[10px] text-ink-soft">{label}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`${label} progress photo`} className="h-20 w-16 rounded-xl object-cover" />;
}

export function BodyMeasures() {
  const allowed = useMeasuresAllowed();
  const measures = useProfileStore((s) => s.measures ?? NO_MEASURES);
  const imperial = useProfileStore((s) => s.profile?.units === "imperial");
  const unit = imperial ? "in" : "cm";
  const [date, setDate] = useState(todayISO());
  const [vals, setVals] = useState<Record<PartKey, string>>({ waist: "", hip: "", chest: "", arm: "", thigh: "" });
  const [photos, setPhotos] = useState<{ front?: File; side?: File }>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const sorted = useMemo(() => [...measures].sort((a, b) => (a.date < b.date ? 1 : -1)), [measures]);

  if (!allowed) return null;

  const first = sorted[sorted.length - 1];
  const latest = sorted[0];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const m: Measure = { id: newId(), date };
    let any = false;
    for (const p of PARTS) {
      const raw = vals[p.key].trim().replace(",", ".");
      if (!raw) continue;
      const n = Number(raw);
      const cm = imperial ? n * IN : n;
      if (!Number.isFinite(n) || cm < 10 || cm > 250) {
        setError(`Please check your ${p.label.toLowerCase()} measurement.`);
        return;
      }
      m[p.key] = Math.round(cm * 10) / 10;
      any = true;
    }
    if (!any) {
      setError("Add at least one measurement.");
      return;
    }
    if (!date || date > todayISO()) {
      setError("Please pick the date you measured.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const ids: Measure["photos"] = {};
      for (const side of ["front", "side"] as const) {
        const f = photos[side];
        if (!f) continue;
        const id = `photo-${m.id}-${side}`;
        await savePhoto(id, await resizeImage(f, 1200, 0.82));
        ids[side] = id;
      }
      if (ids.front || ids.side) m.photos = ids;
    } catch {
      // Measurements still save if a photo can't be kept.
    }
    activeProfileStore().getState().addMeasure(m);
    setVals({ waist: "", hip: "", chest: "", arm: "", thigh: "" });
    setPhotos({});
    setSaving(false);
  }

  async function remove(m: Measure) {
    if (m.photos?.front) await deletePhoto(m.photos.front).catch(() => {});
    if (m.photos?.side) await deletePhoto(m.photos.side).catch(() => {});
    activeProfileStore().getState().removeMeasure(m.id);
  }

  const changes =
    first && latest && first.id !== latest.id
      ? PARTS.filter((p) => typeof first[p.key] === "number" && typeof latest[p.key] === "number").map((p) => ({
          ...p,
          diff: (latest[p.key] as number) - (first[p.key] as number),
        }))
      : [];

  return (
    <section className="space-y-5" aria-labelledby="body-title">
      <h2 id="body-title" className="flex items-center gap-2 font-display text-[1.6rem] leading-tight text-ink">
        <Ruler size={22} className="text-primary-ink" aria-hidden="true" /> Body measurements
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={save} className="card space-y-4" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Add measurements ({unit})</h3>
            <input type="date" className="input !h-10 !w-auto" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} aria-label="Date measured" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PARTS.map((p) => (
              <label key={p.key} className="block">
                <span className="block text-sm font-medium text-ink">{p.label}</span>
                <span className="mb-1 block text-xs text-ink-soft">{p.hint}</span>
                <input
                  className="input tabular"
                  inputMode="decimal"
                  placeholder={unit}
                  value={vals[p.key]}
                  onChange={(e) => setVals({ ...vals, [p.key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-ink">Progress photos (optional)</legend>
            <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-soft">
              <Lock size={12} aria-hidden="true" /> Kept only on this phone. Never backed up or shared.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["front", "side"] as const).map((side) => (
                <label key={side} className="chip cursor-pointer">
                  <Camera size={16} aria-hidden="true" />
                  {photos[side] ? `${side === "front" ? "Front" : "Side"} added` : side === "front" ? "Front photo" : "Side photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhotos((p) => ({ ...p, [side]: e.target.files?.[0] }))}
                  />
                  {photos[side] && (
                    <button
                      type="button"
                      aria-label={`Remove ${side} photo`}
                      onClick={(e) => {
                        e.preventDefault();
                        setPhotos((p) => ({ ...p, [side]: undefined }));
                      }}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p className="text-sm text-[#9B1B30]" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving" : "Save measurements"}
          </button>
        </form>

        <div className="card">
          <h3 className="font-semibold text-ink">Since your first entry</h3>
          {!first ? (
            <p className="mt-2 text-ink-soft">Measure every 2 weeks, at the same time of day, to see your progress. Inches often change before the scale does.</p>
          ) : changes.length === 0 ? (
            <p className="mt-2 text-ink-soft">Your first entry was on {formatShort(first.date)}. Add another in 2 weeks to see the change.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                {formatShort(first.date)} to {formatShort(latest.date)}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {changes.map((c) => (
                  <li key={c.key} className="rounded-2xl bg-surface-2 p-3">
                    <p className="text-sm text-ink-soft">{c.label}</p>
                    <p className="font-display text-[1.5rem] leading-tight text-ink tabular">
                      {c.diff > 0 ? "+" : c.diff < 0 ? "−" : ""}
                      {show(Math.abs(c.diff), imperial)} <span className="text-sm text-ink-soft">{unit}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm tabular">
            <thead>
              <tr className="text-ink-soft">
                <th className="py-2 pr-2 font-semibold">Date</th>
                {PARTS.map((p) => (
                  <th key={p.key} className="px-2 py-2 font-semibold">
                    {p.label}
                  </th>
                ))}
                <th className="px-2 py-2 font-semibold">Photos</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className="border-t border-line align-middle">
                  <td className="py-2 pr-2 whitespace-nowrap text-ink">{formatShort(m.date)}</td>
                  {PARTS.map((p) => (
                    <td key={p.key} className="px-2 py-2 text-ink">
                      {typeof m[p.key] === "number" ? show(m[p.key] as number, imperial) : "—"}
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="flex gap-1.5">
                      {m.photos?.front && <Photo id={m.photos.front} label="Front" />}
                      {m.photos?.side && <Photo id={m.photos.side} label="Side" />}
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                      aria-label={`Delete measurements from ${formatShort(m.date)}`}
                      onClick={() => remove(m)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-soft">All in {unit}.</p>
        </div>
      )}
    </section>
  );
}
