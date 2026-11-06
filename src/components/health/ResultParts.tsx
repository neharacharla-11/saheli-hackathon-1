import { Dumbbell, Salad, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatShort } from "@/lib/dates";
import {
  adviceFor,
  formatValue,
  LAB_BY_KEY,
  rangeText,
  STATUS_LABEL,
  trendDirection,
  trendText,
  type LabStatus,
  type LatestResult,
} from "@/lib/labTests";

const PILL: Record<LabStatus, string> = {
  low: "bg-[#FDE2E2] text-[#9B1B30]",
  high: "bg-[#FDE2E2] text-[#9B1B30]",
  "a-little-low": "bg-[#FEF3C7] text-[#92400E]",
  "a-little-high": "bg-[#FEF3C7] text-[#92400E]",
  normal: "bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] text-accent-ink",
};

export function StatusPill({ status, className = "" }: { status: LabStatus; className?: string }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${PILL[status]} ${className}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Small hand-made line chart of a test over time, with the usual range shaded. */
export function Sparkline({ result, width = 140, height = 44 }: { result: LatestResult; width?: number; height?: number }) {
  const pts = [...result.history].reverse().concat({ value: result.value, date: result.date });
  if (pts.length < 2) return null;
  const t = LAB_BY_KEY[result.key];
  const [lo, hi] = t.range;
  const vals = pts.map((p) => p.value);
  const min = Math.min(...vals, lo);
  const max = Math.max(...vals, t.highIsFine ? Math.min(...vals) : hi);
  const pad = (max - min) * 0.15 || 1;
  const y = (v: number) => height - 6 - ((v - (min - pad)) / (max + pad - (min - pad))) * (height - 12);
  const x = (i: number) => 6 + (i * (width - 12)) / (pts.length - 1);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const bandTop = y(Math.min(hi, max + pad));
  const bandBottom = y(Math.max(lo, min - pad));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${t.name} over time`} className="shrink-0">
      <rect x={0} y={bandTop} width={width} height={Math.max(0, bandBottom - bandTop)} rx={4} fill="var(--accent)" opacity={0.16} />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.value)} r={i === pts.length - 1 ? 4 : 3} fill={i === pts.length - 1 ? "var(--primary)" : "var(--surface)"} stroke="var(--primary)" strokeWidth={2} />
      ))}
    </svg>
  );
}

export function TrendLine({ result, className = "" }: { result: LatestResult; className?: string }) {
  const text = trendText(result);
  if (!text) return null;
  const prev = result.history[0];
  const dir = trendDirection(result.key, prev.value, result.value);
  const Icon = result.value > prev.value ? TrendingUp : result.value < prev.value ? TrendingDown : Minus;
  const colour = dir === "better" ? "text-accent-ink" : dir === "worse" ? "text-[#92400E]" : "text-ink-soft";
  return (
    <p className={`flex items-center gap-1.5 text-sm font-medium ${colour} ${className}`}>
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      <span className="tabular">{text}</span>
    </p>
  );
}

/** Full card for a result outside the usual range. */
export function ResultCard({ result }: { result: LatestResult }) {
  const t = LAB_BY_KEY[result.key];
  const advice = adviceFor(result.key, result.value);
  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[1.35rem] leading-tight text-ink">{t.name}</h3>
            <StatusPill status={result.status} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display tabular text-[2rem] leading-none text-ink">{formatValue(result.key, result.value)}</span>
            <span className="text-sm text-ink-soft">{t.unit}</span>
          </p>
          <p className="mt-1.5 text-sm text-ink-soft tabular">
            Usual range {rangeText(result.key)} · {formatShort(result.date)}
          </p>
        </div>
        <Sparkline result={result} />
      </div>
      <TrendLine result={result} className="mt-3" />
      {advice && (
        <>
          <p className="mt-3 text-ink">{advice.means}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="label mb-1 flex items-center gap-1.5">
                <Salad size={14} aria-hidden="true" /> Food
              </p>
              <p className="text-[15px] leading-relaxed text-ink">{advice.food}</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="label mb-1 flex items-center gap-1.5">
                <Dumbbell size={14} aria-hidden="true" /> Movement
              </p>
              <p className="text-[15px] leading-relaxed text-ink">{advice.move}</p>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

/** Small tile for a result in the usual range. */
export function ResultTile({ result }: { result: LatestResult }) {
  const t = LAB_BY_KEY[result.key];
  return (
    <div className="rounded-[var(--radius-tile)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{t.name}</p>
        <StatusPill status={result.status} />
      </div>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display tabular text-[1.5rem] leading-tight text-ink">{formatValue(result.key, result.value)}</span>
        <span className="text-xs text-ink-soft">{t.unit}</span>
      </p>
      <p className="text-xs text-ink-soft tabular">{formatShort(result.date)}</p>
      {result.history[0] && <TrendLine result={result} className="mt-1.5 !text-xs" />}
    </div>
  );
}
