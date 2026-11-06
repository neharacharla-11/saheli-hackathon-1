import { Dumbbell, Flame, MessageCircleHeart } from "lucide-react";
import { CycleRing, WeatherBars } from "@/components/CycleRing";
import { LogoMark } from "@/components/Logo";

/** A phone showing Today on day 13 (ovulation window). Made-up data. */
export function PhoneMockup() {
  return (
    <div
      className="relative mx-auto w-[300px] max-w-full rounded-[40px] border border-line bg-surface p-3 shadow-[0_1px_2px_rgb(58_30_42/.04),0_30px_60px_-24px_rgb(58_30_42/.28)]"
      role="img"
      aria-label="Saheli's Today screen on a phone: cycle day 13, ovulation window, today's food target and workout"
    >
      <div className="overflow-hidden rounded-[30px] bg-bg px-4 pb-5 pt-3">
        <div className="mx-auto mb-3 h-[18px] w-24 rounded-full bg-ink/90" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <span className="font-display inline-flex items-baseline text-[1.35rem] leading-none text-logo">
            <LogoMark style={{ height: "1.05em", width: "auto", verticalAlign: "-0.045em", display: "inline" }} />
            aheli
          </span>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--ph-follicular)_18%,var(--surface))] px-2.5 py-1 text-[10px] font-semibold text-accent-ink">
            Ovulation window
          </span>
        </div>
        <p className="font-display mt-3 text-[1.35rem] leading-tight text-ink">Good evening, Neha</p>

        <div className="mt-3 rounded-[18px] border border-line bg-surface p-3">
          <div className="flex items-center gap-3">
            <CycleRing day={13} cycleLength={28} size={92} compact />
            <div className="min-w-0 flex-1">
              <p className="label" style={{ fontSize: "0.55rem" }}>
                Body weather
              </p>
              <p className="font-display mb-1.5 text-[0.85rem] leading-tight text-ink">Bright and social today</p>
              <WeatherBars
                compact
                color="var(--ph-ovulation)"
                rows={[
                  { label: "Energy", level: 5, word: "High" },
                  { label: "Mood", level: 4, word: "Good" },
                  { label: "Cravings", level: 1, word: "Low" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-line bg-surface p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-ink-soft">
              <Flame size={11} /> Today&apos;s target
            </p>
            <p className="tabular mt-0.5 text-[15px] font-bold text-ink">1,786 kcal</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-ink-soft">
              <Dumbbell size={11} /> Move
            </p>
            <p className="mt-0.5 text-[13px] font-bold leading-tight text-ink">Strength, 30 min</p>
          </div>
        </div>

        <div className="mt-2.5 flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
            <MessageCircleHeart size={14} />
          </span>
          <p className="rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-[11.5px] leading-snug text-ink">
            <span className="font-semibold">Bestie:</span> You&apos;re at your strongest this week. A good day for that
            heavier set.
          </p>
        </div>

        <div className="mt-3 flex h-10 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-on-primary shadow-[var(--shadow-soft)]">
          Log my mood
        </div>
      </div>
    </div>
  );
}
