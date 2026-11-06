"use client";

/**
 * A rounded pink bathroom scale. The ruler in the window slides (700ms ease)
 * so the fixed pink needle lands on the value.
 */
export function Scale({ value, unit }: { value: number | null; unit: "kg" | "lb" }) {
  const step = unit === "kg" ? 5 : 10; // a labelled number every 5 kg or 10 lb
  const pxPerUnit = unit === "kg" ? 9 : 4.5; // pixels per kg or lb
  const lo = unit === "kg" ? 20 : 50;
  const hi = unit === "kg" ? 200 : 440;
  const v = value !== null && Number.isFinite(value) ? Math.min(hi, Math.max(lo, value)) : unit === "kg" ? 60 : 130;
  const width = (hi - lo) * pxPerUnit;
  const ticks: { x: number; major: boolean; label?: number }[] = [];
  const minor = unit === "kg" ? 1 : 2;
  for (let n = lo; n <= hi; n += minor) {
    const major = n % step === 0;
    ticks.push({ x: (n - lo) * pxPerUnit, major, label: major ? n : undefined });
  }
  const offset = (v - lo) * pxPerUnit;

  return (
    <div className="mx-auto w-full max-w-[300px]" aria-hidden="true">
      <div className="relative rounded-[36px] bg-[color-mix(in_srgb,var(--primary)_22%,var(--surface))] px-5 pb-4 pt-4 shadow-[inset_0_-6px_0_rgb(0_0_0/0.05)]">
        {/* Ruler window */}
        <div className="relative h-[58px] overflow-hidden rounded-2xl border border-line bg-surface">
          <div
            className="absolute left-1/2 top-0 h-full"
            style={{ width, transform: `translateX(${-offset}px)`, transition: "transform 700ms ease" }}
          >
            <svg width={width} height={58} className="block overflow-visible">
              {ticks.map((t) => (
                <g key={t.x}>
                  <line
                    x1={t.x}
                    x2={t.x}
                    y1={0}
                    y2={t.major ? 18 : 10}
                    stroke="var(--ink-soft)"
                    strokeWidth={t.major ? 1.6 : 1}
                    strokeLinecap="round"
                    opacity={t.major ? 0.8 : 0.45}
                  />
                  {t.label !== undefined && (
                    <text x={t.x} y={36} textAnchor="middle" fontSize={12} fill="var(--ink-soft)" className="tabular" fontFamily="var(--font-sans)">
                      {t.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent" />
          {/* needle */}
          <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-logo" />
          <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-logo" />
        </div>
        {/* Reading */}
        <p className="mt-3 text-center">
          <span className="font-display tabular text-[44px] leading-none text-ink">{value !== null ? value.toFixed(1) : "--"}</span>
          <span className="ml-1.5 text-lg text-ink-soft">{unit}</span>
        </p>
        {/* Feet pads */}
        <div className="mt-3 flex justify-center gap-6">
          <span className="h-3 w-12 rounded-full bg-surface/70" />
          <span className="h-3 w-12 rounded-full bg-surface/70" />
        </div>
      </div>
    </div>
  );
}
