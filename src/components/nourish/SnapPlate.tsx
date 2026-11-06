"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Totals } from "@/lib/foods";
import { fmt, Notice } from "./bits";

export interface SnapItem {
  foodId: string | null;
  name: string;
  portion: string;
  qty: number;
  per: Totals;
}

/** Shrink a photo to at most 2000px on the long side, as JPEG. */
export async function resizeToJpeg(file: File, max = 2000, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("bad image"));
      i.src = url;
    });
    const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let q = quality;
    let data = canvas.toDataURL("image/jpeg", q);
    // Stay well under Vercel's 4.5 MB body limit.
    while (data.length > 3_800_000 && q > 0.4) {
      q -= 0.15;
      data = canvas.toDataURL("image/jpeg", q);
    }
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SnapPlate({ onConfirm, showNumbers }: { onConfirm: (items: SnapItem[]) => void; showNumbers: boolean }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<SnapItem[] | null>(null);
  const [note, setNote] = useState("");
  const [hint, setHint] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/plate")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => live && setConfigured(!!d.configured))
      .catch(() => live && setConfigured(false));
    return () => {
      live = false;
    };
  }, []);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError("");
    setItems(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    setBusy(true);
    try {
      const data = await resizeToJpeg(file);
      setPreview(data);
      const res = await fetch("/api/plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data.split(",")[1], mediaType: "image/jpeg", hint }),
      });
      const out = (await res.json()) as { ok?: boolean; items?: SnapItem[]; note?: string; error?: string; configured?: boolean };
      if (out.configured === false) setConfigured(false);
      if (!res.ok || !out.ok || !out.items) {
        setError(out.error ?? "Saheli couldn't read that photo. Please try another one.");
      } else {
        setItems(out.items);
        setNote(out.note ?? "");
      }
    } catch {
      setError("Saheli couldn't open that photo. Please try another one.");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function setQty(i: number, qty: number) {
    setItems((cur) => (cur ? cur.map((it, j) => (j === i ? { ...it, qty: Math.max(0.5, Math.round(qty * 2) / 2) } : it)) : cur));
  }

  return (
    <section className="card" aria-labelledby="snap-title">
      <div className="mb-2 flex items-center gap-2">
        <Camera size={20} className="text-primary-ink" aria-hidden="true" />
        <h3 id="snap-title" className="font-display text-[1.35rem] text-ink">
          Snap your plate
        </h3>
      </div>
      <p className="text-[15px] text-ink-soft">Take or upload a photo of your meal. Saheli spots the foods and portions, and you check them before anything is saved.</p>

      {configured === false ? (
        <div className="mt-4">
          <Notice icon={Sparkles}>Snap your plate isn&apos;t switched on yet. You can still build your thali by tapping foods above.</Notice>
        </div>
      ) : (
        <>
          <input
            className="input mt-4"
            placeholder="Optional: tell Saheli something, e.g. 2 rotis, dal and bhindi"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            aria-label="Tell Saheli about the meal (optional)"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => cameraRef.current?.click()} disabled={busy || configured === null}>
              <Camera size={18} aria-hidden="true" />
              Take a photo
            </button>
            <button className="btn btn-secondary" onClick={() => uploadRef.current?.click()} disabled={busy || configured === null}>
              <ImageUp size={18} aria-hidden="true" />
              Upload a photo
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
            <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
          </div>
        </>
      )}

      {(preview || busy) && (
        <div className="mt-4 flex gap-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your meal" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          )}
          {busy && (
            <p className="flex items-center gap-2 self-center text-sm text-ink-soft" role="status">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Looking at your plate...
            </p>
          )}
          {note && !busy && items && <p className="self-center text-sm text-ink-soft">{note}</p>}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {items && !busy && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-ink">Is this right? Change the amounts or remove anything.</p>
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line px-3">
            {items.map((it, i) => (
              <li key={`${it.name}-${i}`} className="flex items-center gap-2 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{it.name}</span>
                  <span className="block truncate text-[13px] text-ink-soft">
                    {it.portion}
                    {showNumbers && ` · ${fmt(it.per.kcal * it.qty)} kcal`}
                    {!it.foodId && " · estimated"}
                  </span>
                </span>
                <button className="grid h-8 w-8 place-items-center rounded-full border border-line" onClick={() => setQty(i, it.qty - (it.qty <= 1 ? 0.5 : 1))} aria-label={`Less ${it.name}`}>
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular">{it.qty}</span>
                <button className="grid h-8 w-8 place-items-center rounded-full border border-line" onClick={() => setQty(i, it.qty + 1)} aria-label={`More ${it.name}`}>
                  <Plus size={14} aria-hidden="true" />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={`Remove ${it.name}`}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              disabled={!items.length}
              onClick={() => {
                onConfirm(items);
                setItems(null);
                setPreview(null);
                setNote("");
              }}
            >
              Looks right, put it on my plate
            </button>
            <button className="btn btn-ghost" onClick={() => { setItems(null); setPreview(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
