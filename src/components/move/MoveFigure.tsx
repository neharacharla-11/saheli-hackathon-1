import type { ReactNode } from "react";
import type { MoveIcon } from "@/lib/workoutLibrary";

/** Stick figures for each move: a soft tinted circle, the figure in primary-ink, equipment in accent. */
export function MoveFigure({ icon, size = 64, className }: { icon: MoveIcon; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="64" height="64" rx="18" fill="color-mix(in srgb, var(--primary) 13%, var(--surface))" />
      <line x1="6" y1="55" x2="58" y2="55" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
      <g fill="none" stroke="var(--primary-ink)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {FIGURES[icon]}
      </g>
    </svg>
  );
}

const Head = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r="4.6" fill="var(--primary-ink)" stroke="none" />;
const P = ({ d }: { d: string }) => <path d={d} />;
const Bell = ({ x, y, v = false }: { x: number; y: number; v?: boolean }) => (
  <g stroke="var(--accent-ink)" strokeWidth="2.6">
    {v ? <path d={`M${x} ${y - 4}V${y + 4}M${x - 3} ${y - 4}h6M${x - 3} ${y + 4}h6`} /> : <path d={`M${x - 4} ${y}H${x + 4}M${x - 4} ${y - 3}v6M${x + 4} ${y - 3}v6`} />}
  </g>
);
const Kit = ({ d, fill }: { d: string; fill?: boolean }) => (
  <path d={d} stroke="var(--accent-ink)" strokeWidth="2.6" fill={fill ? "color-mix(in srgb, var(--accent) 35%, var(--surface))" : "none"} />
);

const FIGURES: Record<MoveIcon, ReactNode> = {
  march: (
    <>
      <Head x={32} y={11} />
      <P d="M32 16V33M32 21L24 29M32 21L40 15M32 33V53M32 33L42 38V48" />
    </>
  ),
  walk: (
    <>
      <Head x={32} y={11} />
      <P d="M32 16L33 33M32 21L25 29M32 21L39 28M33 33L26 53M33 33L41 53" />
    </>
  ),
  squat: (
    <>
      <Head x={27} y={16} />
      <P d="M28 21L38 36M38 36L26 40L28 54M29 24L15 27" />
    </>
  ),
  lunge: (
    <>
      <Head x={32} y={9} />
      <P d="M32 14V32M32 32L22 40V54M32 32L41 48L52 53M32 19L26 28M32 19L38 28" />
    </>
  ),
  bridge: (
    <>
      <Head x={10} y={47} />
      <P d="M15 49L34 37L45 39L47 54M16 50L27 54" />
    </>
  ),
  plank: (
    <>
      <Head x={12} y={33} />
      <P d="M17 36L52 46M19 37V47H28" />
    </>
  ),
  pushup: (
    <>
      <Head x={12} y={29} />
      <P d="M17 32L52 46M19 33V54" />
    </>
  ),
  row: (
    <>
      <Head x={19} y={19} />
      <P d="M23 23L41 30M41 30L38 54M41 30L46 54M26 25L28 37" />
      <Bell x={28} y={40} />
    </>
  ),
  press: (
    <>
      <Head x={32} y={16} />
      <P d="M32 21V38M32 24L24 16V8M32 24L40 16V8M32 38L26 54M32 38L38 54" />
      <Bell x={24} y={6} />
      <Bell x={40} y={6} />
    </>
  ),
  hinge: (
    <>
      <Head x={17} y={22} />
      <P d="M21 26L40 32M40 32L38 54M40 32L44 54M24 28L25 43" />
      <Bell x={25} y={45} />
    </>
  ),
  stretch: (
    <>
      <Head x={30} y={13} />
      <P d="M31 18Q35 27 33 37M32 21L44 8M32 23L25 32M33 37L27 54M33 37L39 54" />
    </>
  ),
  breathe: (
    <>
      <Head x={32} y={17} />
      <P d="M32 22V40M32 40L19 46L36 49M32 40L45 46L28 49M32 27L25 33L32 35" />
      <path d="M44 16q4 4 0 8M49 13q6 7 0 14" stroke="var(--accent-ink)" strokeWidth="2.2" />
    </>
  ),
  child: (
    <>
      <Head x={14} y={47} />
      <P d="M19 44Q31 30 44 44M44 44L41 53H56M19 47L6 52" />
    </>
  ),
  catcow: (
    <>
      <Head x={13} y={30} />
      <P d="M18 32Q32 22 46 32M20 33V54M46 32V54H57" />
    </>
  ),
  birddog: (
    <>
      <Head x={17} y={28} />
      <P d="M22 32H42M24 32V54M22 31L8 25M42 32V54H48M42 32L58 29" />
    </>
  ),
  bike: (
    <>
      <circle cx="16" cy="45" r="8" stroke="var(--accent-ink)" strokeWidth="2.6" />
      <circle cx="48" cy="45" r="8" stroke="var(--accent-ink)" strokeWidth="2.6" />
      <Kit d="M16 45L28 31H43L48 45M28 31L32 45H16M43 31L45 24" />
      <Head x={30} y={10} />
      <P d="M30 15L28 30M29 19L43 23M28 30L36 38L32 45" />
    </>
  ),
  legpress: (
    <>
      <Kit d="M8 47L24 47L14 30" />
      <Kit d="M48 26L54 30V48L48 52Z" fill />
      <Head x={14} y={27} />
      <P d="M17 31L25 44M25 44L37 34L48 39M18 34L28 44" />
    </>
  ),
  pulldown: (
    <>
      <Kit d="M12 6H52M32 6V2M24 46H40V55" />
      <Head x={32} y={20} />
      <P d="M32 25V42M32 28L22 19L20 7M32 28L42 19L44 7M32 42H44V54" />
    </>
  ),
  stepup: (
    <>
      <Kit d="M34 41H54V55H34Z" fill />
      <Head x={29} y={9} />
      <P d="M29 14V31M29 31L40 35V41M29 31L25 54M29 18L23 27M29 18L35 27" />
    </>
  ),
  clam: (
    <>
      <Head x={9} y={41} />
      <P d="M14 43L35 45M35 45L46 34L50 46M35 45L46 51L52 53M14 42L12 32" />
    </>
  ),
  jump: (
    <>
      <Head x={32} y={9} />
      <P d="M32 14V31M32 19L23 9M32 19L41 9M32 31L25 43M32 31L39 43" />
      <path d="M22 50h6M36 50h6" stroke="var(--accent-ink)" strokeWidth="2.4" />
    </>
  ),
  carry: (
    <>
      <Head x={32} y={11} />
      <P d="M32 16V34M32 20L25 33M32 20L39 33M32 34L27 54M32 34L37 54" />
      <Bell x={25} y={37} v />
      <Bell x={39} y={37} v />
    </>
  ),
  balance: (
    <>
      <Head x={32} y={10} />
      <P d="M32 15V33M32 20L19 23M32 20L45 23M32 33V54M32 33L41 38L35 45" />
    </>
  ),
  deadbug: (
    <>
      <Head x={11} y={45} />
      <P d="M16 46H36M21 46L20 30M27 46L30 31M36 46L41 34H51M36 46L57 41" />
    </>
  ),
};
