"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { SAMPLE_GROUPS, SAMPLES } from "@/lib/samples";
import { buildSample } from "@/lib/sampleData";
import { profileStore, SAMPLE_ID, useAppStore } from "@/lib/store";

/** Open a made-up woman without touching her own data. Only one sample is kept at a time. */
export function openSample(key: string) {
  const meta = SAMPLES.find((s) => s.key === key);
  if (!meta) return;
  profileStore(SAMPLE_ID).getState().replaceAll(buildSample(key));
  useAppStore.getState().setSample({ key, name: meta.name, label: meta.label });
}

export function SamplePicker({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function choose(key: string) {
    openSample(key);
    onClose();
    router.push("/app");
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-surface p-5 shadow-2xl sm:p-7 md:max-w-[720px] md:rounded-[24px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-[1.9rem] leading-tight text-ink">
              Try with sample data
            </h2>
            <p className="mt-1 text-ink-soft">
              Open one of 12 made-up women to see how Saheli adapts. Your own data stays untouched.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {SAMPLE_GROUPS.map((g) => (
          <section key={g.id} className="mt-6">
            <h3 className="label">{g.label}</h3>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
              {SAMPLES.filter((s) => s.group === g.id).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => choose(s.key)}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition hover:border-primary/50 hover:bg-surface-2"
                >
                  <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg text-on-primary">
                    {s.name[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-ink">
                      {s.name}, <span className="tabular">{s.age}</span>
                    </span>
                    <span className="block text-sm leading-snug text-ink-soft">{s.line}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
