"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { parseISODate, todayISO } from "@/lib/dates";
import { BIRTH_PLAN, type PlanField } from "@/lib/birthPlan";
import { useProfileStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { updateData } from "./data";

const PRINT_CSS = `
@media print {
  @page { margin: 16mm; }
  body * { visibility: hidden !important; }
  #birth-plan, #birth-plan * { visibility: visible !important; }
  #birth-plan { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
  #birth-plan .no-print { display: none !important; }
}`;

function longDate(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BirthPlanPage() {
  const profile = useProfileStore((s) => s.profile);
  const plan = useProfileStore((s) => s.birthPlan) ?? {};
  const hasAny = Object.values(plan).some((v) => (Array.isArray(v) ? v.length : String(v).trim()));
  const [editing, setEditing] = useState(!hasAny);

  if (!profile) return null;

  const value = (f: PlanField): string | string[] => plan[f.id] ?? (f.id === "name" ? profile.name : f.type === "multi" ? [] : "");
  const set = (id: string, v: string | string[]) => updateData((s) => ({ birthPlan: { ...(s.birthPlan ?? {}), [id]: v } }));

  function print() {
    setEditing(false);
    setTimeout(() => window.print(), 50);
  }

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={profile.stage === "pregnancy" ? "/app/stage" : "/app/pregnancy"} className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft size={16} aria-hidden /> Pregnancy
        </Link>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing((v) => !v)}>
            <Pencil size={15} aria-hidden /> {editing ? "Done" : "Edit"}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={print}>
            <Printer size={15} aria-hidden /> Print
          </button>
        </div>
      </div>

      <article id="birth-plan" className="card mx-auto max-w-[768px] sm:!p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Birth plan</p>
            <h1 className="mt-1 font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.6rem]">My birth plan</h1>
            <p className="mt-2 text-ink-soft">
              {profile.name}
              {profile.dueDate ? ` · due ${longDate(profile.dueDate)}` : ""}
            </p>
            <p className="text-sm text-ink-soft">Prepared {longDate(todayISO())} with Saheli</p>
          </div>
          <Logo size="sm" />
        </div>
        <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">
          These are my wishes if all goes well. I understand plans can change for my safety or my baby&apos;s, and I&apos;d like to be told why.
        </p>

        {BIRTH_PLAN.map((section) => (
          <section key={section.id} className="mt-7 border-t border-line pt-5" style={{ breakInside: "avoid" }}>
            <h2 className="label">{section.title}</h2>
            <div className="mt-3 space-y-4">
              {section.fields.map((f) => {
                const v = value(f);
                if (!editing) {
                  const text = Array.isArray(v) ? v.join(" · ") : v;
                  return (
                    <div key={f.id} className="grid gap-0.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                      <p className="text-sm font-semibold text-ink-soft">{f.label}</p>
                      <p className={`text-[15px] ${text ? "text-ink" : "text-ink-soft italic"}`}>{text || "Not decided yet"}</p>
                    </div>
                  );
                }
                return (
                  <div key={f.id}>
                    <p className="mb-1.5 text-sm font-semibold text-ink">{f.label}</p>
                    {f.type === "text" && (
                      <input className="input" value={v as string} placeholder={f.placeholder} onChange={(e) => set(f.id, e.target.value)} />
                    )}
                    {f.type === "long" && (
                      <textarea className="input min-h-[96px] py-3" value={v as string} placeholder={f.placeholder} onChange={(e) => set(f.id, e.target.value)} />
                    )}
                    {(f.type === "multi" || f.type === "single") && (
                      <div className="flex flex-wrap gap-2">
                        {f.options?.map((o) => {
                          const on = Array.isArray(v) ? v.includes(o) : v === o;
                          return (
                            <button
                              key={o}
                              type="button"
                              className="chip"
                              aria-pressed={on}
                              onClick={() => {
                                if (f.type === "single") set(f.id, on ? "" : o);
                                else {
                                  const arr = Array.isArray(v) ? v : [];
                                  set(f.id, on ? arr.filter((x) => x !== o) : [...arr, o]);
                                }
                              }}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <p className="mt-8 border-t border-line pt-4 text-sm text-ink-soft">
          Thank you for caring for me and my baby. Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.
        </p>
        {editing && (
          <div className="no-print mt-5 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setEditing(false)}>
              Done
            </button>
          </div>
        )}
      </article>
    </>
  );
}
