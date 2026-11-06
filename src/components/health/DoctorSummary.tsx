"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { averageCycleLength } from "@/lib/cycle";
import { addDays, daysBetween, formatShort, parseISODate } from "@/lib/dates";
import { countSymptoms, cycleSummary, topSymptoms } from "@/lib/healthCheck";
import { chipHasResults } from "@/lib/healthCheck";
import { formatValue, isOutOfRange, LAB_BY_KEY, rangeText, STATUS_LABEL } from "@/lib/labTests";
import { STAGE_LABEL, useProfileStore } from "@/lib/store";
import { sugarBand } from "@/lib/sugar";
import type { SugarWhen } from "@/lib/types";
import { endoFlag, methodInfo, painSummary, pillDots, SCREENINGS } from "@/lib/care";
import type { Contraception, MethodId, PainLog } from "@/lib/careTypes";
import { loose, useHealthData } from "./useHealthData";

/* Shapes other pages store (see CLAUDE.md). Read loosely; a section hides when empty. */
interface SugarLike { at: string; value: number; when?: string }
interface MeasureLike { date: string; waist?: number; hip?: number; chest?: number; arm?: number; thigh?: number }
interface ContraceptionLike { method?: string; label?: string; brand?: string; pillTime?: string; packType?: number; fittedOn?: string; replaceBy?: string }
interface PmddLike { date: string; interferes?: boolean; result?: string }
interface HealthImportLike { steps?: Record<string, number>; sleepMin?: Record<string, number>; source?: string }

function long(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortYear(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

const SCREENING_NAMES: Record<string, string> = {
  pap: "Cervical screening (Pap/HPV)", hpv: "HPV test", cervical: "Cervical screening", mammogram: "Mammogram", bp: "Blood pressure",
  sugar: "Blood sugar", cholesterol: "Cholesterol", eyes: "Eye test", bowel: "Bowel screening", dental: "Dental check-up",
  bone: "Bone density", thyroid: "Thyroid", skin: "Skin check", breast: "Breast exam",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-5 [break-inside:avoid]">
      <h2 className="label mb-2">{title}</h2>
      <div className="text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export function DoctorSummary() {
  const { profile, dayLogs, periodStarts, today, suggestions, latest, have } = useHealthData();
  const state = useProfileStore((s) => s);
  const [notes, setNotes] = useState("");
  if (!profile) return null;

  const stage = profile.stage;
  const hideWeight = profile.safety?.eatingConcerns || stage === "first-period" || stage === "pregnancy";
  const counts = countSymptoms(dayLogs, today);
  const symptoms = topSymptoms(dayLogs, today);
  const cyc = cycleSummary(periodStarts, today);
  const lastStart = [...periodStarts].filter((d) => d <= today).sort().pop();
  const avgCycle = averageCycleLength(periodStarts.filter((d) => d >= addDays(today, -210)));

  const contraception = loose<ContraceptionLike | null>(state, "contraception");
  const screenings = loose<Record<string, string>>(state, "screenings");
  const sugar = (loose<SugarLike[]>(state, "sugar") ?? []).filter((s) => s && typeof s.value === "number" && s.at >= addDays(today, -14));
  const measures = (loose<MeasureLike[]>(state, "measures") ?? []).filter((m) => m && m.date).sort((a, b) => (a.date < b.date ? 1 : -1));
  const pmdd = (loose<PmddLike[]>(state, "pmdd") ?? []).filter((p) => p && p.date).sort((a, b) => (a.date < b.date ? 1 : -1));
  const hi = loose<HealthImportLike>(state, "health") ?? loose<HealthImportLike>(state, "healthImport");
  const weights = state.weights ?? {};
  const lastWeightDate = Object.keys(weights).sort().pop();

  // Pain diary and contraception (Care pages)
  const painLogs = (loose<PainLog[]>(state, "pain") ?? []).filter((p) => p && typeof p.date === "string" && typeof p.score === "number").map((p) => ({ ...p, places: p.places ?? [], helped: p.helped ?? [], missedDay: !!p.missedDay }));
  const painSum = painSummary(painLogs, today, 90);
  const painFlag = endoFlag(painLogs, periodStarts, today, profile.periodLength);
  const taken = loose<Record<string, boolean>>(state, "pillsTaken") ?? {};
  const pillWeek = (() => {
    if (!contraception?.method || !["combined", "mini"].includes(contraception.method)) return null;
    const dots = pillDots(contraception as Contraception, taken, today, 30).filter((d) => d.state === "taken" || d.state === "missed");
    return dots.length ? { of: dots.length, taken: dots.filter((d) => d.state === "taken").length, missed: dots.filter((d) => d.state === "missed").length } : null;
  })();
  const lastBreastCheck = [...(loose<string[]>(state, "breastChecks") ?? [])].sort().pop();
  const stepsVals = Object.entries(hi?.steps ?? {}).filter(([d]) => d >= addDays(today, -14)).map(([, v]) => v);
  const sleepVals = Object.entries(hi?.sleepMin ?? {}).filter(([d]) => d >= addDays(today, -14)).map(([, v]) => v);
  const stressVals = Object.entries(dayLogs).filter(([d, l]) => d >= addDays(today, -90) && typeof l.stress === "number").map(([, l]) => l.stress as number);

  const tests = new Map<string, boolean>();
  for (const s of suggestions) for (const t of s.tests) tests.set(t.label, chipHasResults(t, have) || !!tests.get(t.label));

  const usesCycle = !["pregnancy", "postpartum", "menopause"].includes(stage);
  const fasting = sugar.filter((s) => s.when === "fasting").map((s) => s.value);
  const after = sugar.filter((s) => s.when === "after").map((s) => s.value);

  return (
    <>
      {/* Print only the summary card. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #doctor-summary, #doctor-summary * { visibility: visible !important; }
        #doctor-summary { position: absolute; inset: 0 auto auto 0; width: 100%; max-width: none; border: 0 !important; padding: 0 !important; box-shadow: none !important; }
        .min-h-dvh, .h-dvh { min-height: 0 !important; height: auto !important; }
        @page { margin: 14mm; }
      }`}</style>

      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">One page for your doctor. Add your questions in the notes, then print or save it as a PDF.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" /> Print or save as PDF
        </button>
      </div>

      <article id="doctor-summary" className="theme-rose-light mx-auto max-w-[768px] rounded-[var(--radius-card)] border border-line bg-white p-6 text-ink sm:p-10">
        <header className="mb-6">
          <h1 className="font-display text-[2.2rem] leading-tight text-ink">Health summary</h1>
          <p className="mt-1 font-semibold text-ink">
            {profile.name}
            {profile.age ? ` · ${profile.age} years` : ""} · {STAGE_LABEL[stage]}
          </p>
          <p className="text-sm text-ink-soft">Prepared {long(today)} with Saheli</p>
          {(profile.heightCm || (!hideWeight && (lastWeightDate || profile.weightKg))) && (
            <p className="mt-1 text-sm text-ink tabular">
              {profile.heightCm ? `Height ${profile.heightCm} cm` : ""}
              {profile.heightCm && !hideWeight && (lastWeightDate || profile.weightKg) ? " · " : ""}
              {!hideWeight && lastWeightDate
                ? `Weight ${weights[lastWeightDate]} kg on ${formatShort(lastWeightDate)}`
                : !hideWeight && profile.weightKg
                  ? `Weight ${profile.weightKg} kg`
                  : ""}
            </p>
          )}
          {profile.safety?.conditions?.length ? <p className="text-sm text-ink">Conditions she mentioned: {profile.safety.conditions.join(", ")}</p> : null}
        </header>

        <div className="space-y-5">
          <Section title="Menstrual cycle">
            {usesCycle ? (
              lastStart ? (
                <ul className="space-y-0.5">
                  <li>Last period started {shortYear(lastStart)} (cycle day {daysBetween(lastStart, today) + 1} today).</li>
                  {avgCycle && (
                    <li className="tabular">
                      Average cycle {avgCycle} days
                      {cyc.shortest !== null && cyc.longest !== cyc.shortest ? `, ranging ${cyc.shortest} to ${cyc.longest} days` : ""}
                      {cyc.irregular ? " (irregular)" : " (regular)"}.
                    </li>
                  )}
                  {cyc.lengths.length > 0 && <li className="tabular">Recent cycle lengths: {cyc.lengths.join(", ")} days.</li>}
                  <li className="tabular">
                    Period usually lasts {profile.periodLength} days{counts.heavy ? `; heavy flow on ${counts.heavy} days in the last 3 months` : ""}.
                  </li>
                </ul>
              ) : (
                <p>No periods logged yet.</p>
              )
            ) : stage === "pregnancy" ? (
              <p>Pregnant{profile.dueDate ? `, due ${shortYear(profile.dueDate)}` : ""}.</p>
            ) : stage === "postpartum" ? (
              <p>Gave birth{profile.babyBirthDate ? ` on ${shortYear(profile.babyBirthDate)}` : ""}{profile.safety?.breastfeeding ? ", breastfeeding" : ""}.</p>
            ) : lastStart ? (
              <p>Last period logged {shortYear(lastStart)}{cyc.irregular ? "; cycles have become irregular" : ""}.</p>
            ) : (
              <p>No periods logged recently.</p>
            )}
          </Section>

          <Section title="Symptoms (last 3 months)">
            {symptoms.length ? (
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {symptoms.map((s) => (
                  <li key={s.name} className="flex justify-between gap-3 border-b border-dashed border-line py-1">
                    <span>{s.name}</span>
                    <span className="tabular text-ink-soft">{s.days} days</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No symptoms logged.</p>
            )}
            <p className="mt-2 text-sm text-ink-soft tabular">Based on {counts.daysLogged} days logged.</p>
          </Section>

          <Section title="Patterns">
            {suggestions.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold">{s.title}.</span> {s.reason.split(". ")[0]}.
                  </li>
                ))}
              </ul>
            ) : (
              <p>No patterns that need a test right now.</p>
            )}
          </Section>

          {tests.size > 0 && (
            <Section title="Suggested tests to discuss">
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {[...tests.entries()].map(([label, done]) => (
                  <li key={label} className="py-0.5">
                    {label}
                    {done ? <span className="text-ink-soft"> (recent result below)</span> : ""}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Latest results">
            {latest.length ? (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm tabular">
                  <thead>
                    <tr className="text-ink-soft">
                      <th className="px-1 py-1.5 font-semibold">Test</th>
                      <th className="px-1 py-1.5 font-semibold">Latest</th>
                      <th className="px-1 py-1.5 font-semibold">Date</th>
                      <th className="px-1 py-1.5 font-semibold">Previous</th>
                      <th className="px-1 py-1.5 font-semibold">Usual range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((r) => {
                      const t = LAB_BY_KEY[r.key];
                      const flag = isOutOfRange(r.status);
                      const prev = r.history[0];
                      return (
                        <tr key={r.key} className="border-t border-line align-top">
                          <td className="px-1 py-1.5">{t.name}</td>
                          <td className={`px-1 py-1.5 ${flag ? "font-semibold text-[#9B1B30]" : ""}`}>
                            {formatValue(r.key, r.value)} {t.unit}
                            {flag ? ` (${STATUS_LABEL[r.status].toLowerCase()})` : ""}
                          </td>
                          <td className="px-1 py-1.5 whitespace-nowrap">{shortYear(r.date)}</td>
                          <td className="px-1 py-1.5">{prev ? `${formatValue(r.key, prev.value)} (${formatShort(prev.date)})` : "—"}</td>
                          <td className="px-1 py-1.5 text-ink-soft">{rangeText(r.key)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No reports added yet.</p>
            )}
          </Section>

          {painSum && (
            <Section title="Pain diary, last 90 days">
              <ul className="space-y-0.5 tabular">
                <li>
                  {painSum.days} days logged, average {painSum.average.toFixed(1)} out of 10, worst {painSum.worst}.
                </li>
                <li>
                  Pain of 7 or more on {painSum.severeDays} {painSum.severeDays === 1 ? "day" : "days"}; missed work, college or plans on {painSum.missedDays}{" "}
                  {painSum.missedDays === 1 ? "day" : "days"}.
                </li>
                {painSum.places.length > 0 && <li>Where: {painSum.places.join(", ")}.</li>}
              </ul>
              {painFlag.show && (
                <div className="mt-2">
                  <p className="font-semibold">Signs worth checking for endometriosis or adenomyosis (a flag, not a diagnosis):</p>
                  <ul className="list-disc pl-5">
                    {(painFlag.reasons.length ? painFlag.reasons : [`Severe pain in ${painFlag.severeCycles} different cycles`]).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          <Section title="Contraception, screenings and mood">
            {contraception?.method && (
              <p className="mb-2">
                <span className="font-semibold">Contraception: </span>
                {methodInfo(contraception.method as MethodId)?.label ?? contraception.label ?? contraception.method}
                {contraception.brand ? ` (${contraception.brand})` : ""}
                {contraception.packType && ["combined", "mini"].includes(contraception.method) ? `, ${contraception.packType}-day pack` : ""}
                {contraception.pillTime ? `, taken at ${contraception.pillTime}` : ""}
                {contraception.fittedOn ? `, ${contraception.method === "injection" ? "last injection" : "fitted"} ${shortYear(contraception.fittedOn)}` : ""}
                {contraception.replaceBy ? `, ${contraception.method === "injection" ? "next due" : "replace by"} ${shortYear(contraception.replaceBy)}` : ""}.
                {pillWeek && ` Pills taken on ${pillWeek.taken} of the last ${pillWeek.of} pill days${pillWeek.missed ? ` (${pillWeek.missed} missed)` : ""}.`}
              </p>
            )}
            {screenings && Object.keys(screenings).length > 0 && (
              <ul className="mb-2 grid gap-x-6 sm:grid-cols-2">
                {Object.entries(screenings)
                  .filter(([, d]) => typeof d === "string" && d)
                  .map(([id, d]) => (
                    <li key={id} className="py-0.5">
                      {SCREENINGS.find((x) => x.id === id)?.name ?? SCREENING_NAMES[id] ?? id}: <span className="tabular">{shortYear(d)}</span>
                    </li>
                  ))}
              </ul>
            )}
            {lastBreastCheck && <p className="mb-1">Last breast self-check: {shortYear(lastBreastCheck)}.</p>}
            <p className="tabular">
              Low, stressed or anxious moods on {counts.lowMood} of {counts.daysLogged} logged days in the last 3 months
              {stressVals.length ? `; average stress ${avg(stressVals)!.toFixed(1)} out of 5` : ""}.
            </p>
            {pmdd[0] && (
              <p className="mt-1">
                Premenstrual check on {shortYear(pmdd[0].date)}: {pmdd[0].result ?? (pmdd[0].interferes ? "symptoms get in the way of daily life" : "recorded")} (a flag, not a diagnosis).
              </p>
            )}
          </Section>

          {sugar.length > 0 && (
            <Section title="Sugar (last 2 weeks)">
              <p className="tabular">
                {sugar.length} readings.
                {fasting.length ? ` Fasting average ${Math.round(avg(fasting)!)} mg/dL (${Math.min(...fasting)} to ${Math.max(...fasting)}).` : ""}
                {after.length ? ` After meals average ${Math.round(avg(after)!)} mg/dL.` : ""}
                {` ${Math.round((sugar.filter((r) => sugarBand(r.value, (r.when ?? "random") as SugarWhen) === "in-target").length / sugar.length) * 100)}% in target.`}
                {sugar.some((r) => r.value < 70) ? ` Lows under 70 mg/dL: ${sugar.filter((r) => r.value < 70).length}.` : ""}
              </p>
            </Section>
          )}

          {!profile.safety?.eatingConcerns && stage !== "first-period" && measures[0] && (
            <Section title="Measurements">
              {(() => {
                const parts = (["waist", "hip", "chest", "arm", "thigh"] as const).filter((k) => typeof measures[0][k] === "number");
                const first = measures[measures.length - 1];
                const label: Record<string, string> = { waist: "waist", hip: "hips", chest: "chest", arm: "upper arm", thigh: "thigh" };
                return (
                  <>
                    <p className="tabular">
                      {shortYear(measures[0].date)}: {parts.map((k) => `${label[k]} ${measures[0][k]} cm`).join(", ")}.
                    </p>
                    {first !== measures[0] && (
                      <p className="tabular text-ink-soft">
                        Change since {shortYear(first.date)}:{" "}
                        {parts
                          .filter((k) => typeof first[k] === "number")
                          .map((k) => {
                            const d = (measures[0][k] as number) - (first[k] as number);
                            return `${label[k]} ${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)} cm`;
                          })
                          .join(", ")}
                        .
                      </p>
                    )}
                  </>
                );
              })()}
            </Section>
          )}

          {(stepsVals.length > 0 || sleepVals.length > 0) && (
            <Section title="Steps and sleep (last 2 weeks, from your health app)">
              <p className="tabular">
                {stepsVals.length ? `About ${Math.round(avg(stepsVals)!).toLocaleString("en-US")} steps a day. ` : ""}
                {sleepVals.length ? `About ${(avg(sleepVals)! / 60).toFixed(1)} hours of sleep a night.` : ""}
              </p>
              {hi?.source && <p className="text-sm text-ink-soft">Imported from {hi.source}.</p>}
            </Section>
          )}

          <Section title="Notes">
            <label htmlFor="summary-notes" className="sr-only">
              Notes and questions for your doctor
            </label>
            <textarea
              id="summary-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Questions for your doctor, medicines you take, anything else."
              className="no-print w-full resize-y rounded-2xl border border-line bg-white p-3 text-[15px] text-ink"
            />
            <div className="hidden min-h-[120px] whitespace-pre-wrap rounded-2xl border border-line p-3 print:block">{notes}</div>
          </Section>
        </div>

        <p className="mt-8 border-t border-line pt-4 text-center text-sm text-ink-soft">
          Made with Saheli from what she logged on her phone. Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.
        </p>
      </article>
    </>
  );
}
