import type { CSSProperties } from "react";

/** The "S" from DM Serif Display (font units, y up), with a heart on the middle of its curve. */
const S_PATH =
  "M237 -18Q182 -18 125.0 -4.5Q68 9 30 31L35 167H45L76 102Q90 74 106.0 52.5Q122 31 150 19Q170 9 188.5 5.5Q207 2 230 2Q291 2 326.5 35.0Q362 68 362 120Q362 169 338.0 196.5Q314 224 261 250L220 268Q134 306 85.5 355.5Q37 405 37 487Q37 546 67.5 589.0Q98 632 152.5 655.0Q207 678 280 678Q333 678 380.5 664.0Q428 650 463 626L457 506H447L406 581Q389 616 372.0 630.5Q355 645 333 651Q320 655 309.0 656.5Q298 658 281 658Q230 658 195.0 628.5Q160 599 160 549Q160 498 187.0 467.5Q214 437 266 413L312 393Q408 351 450.0 303.5Q492 256 492 181Q492 93 425.5 37.5Q359 -18 237 -18Z";

const HEART_PATH =
  "M0 62 C-58 24 -88 -6 -88 -36 C-88 -62 -68 -82 -44 -82 C-24 -82 -8 -70 0 -52 C8 -70 24 -82 44 -82 C68 -82 88 -62 88 -36 C88 -6 58 24 0 62 Z";

interface LogoMarkProps {
  className?: string;
  style?: CSSProperties;
  /** Colour of the thin outline around the heart (the background behind the logo). */
  outline?: string;
  title?: string;
}

export function LogoMark({ className, style, outline = "var(--bg, #FDF4F6)", title }: LogoMarkProps) {
  return (
    <svg
      viewBox="14 -694 494 728"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g transform="scale(1 -1)">
        <path d={S_PATH} fill="#E0679A" />
      </g>
      <path
        d={HEART_PATH}
        transform="translate(262 -338) scale(0.92)"
        fill="#9B1B30"
        stroke={outline}
        strokeWidth={18}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

const SIZES = {
  sm: { font: "2.1rem", tag: "11px" },
  md: { font: "2.75rem", tag: "12.5px" },
  lg: { font: "3.6rem", tag: "15px" },
} as const;

interface LogoProps {
  size?: keyof typeof SIZES;
  tagline?: boolean;
  className?: string;
  outline?: string;
}

export const TAGLINE = "Made for every version of her by her";

/** Wordmark: the logo S followed by "aheli", with the tagline underneath. */
export function Logo({ size = "md", tagline = false, className = "", outline }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex flex-col items-start ${className}`} data-no-translate translate="no">
      <span
        className="font-display inline-block whitespace-nowrap leading-none text-logo"
        style={{ fontSize: s.font, paddingTop: "0.08em" }}
        aria-label="Saheli"
      >
        <LogoMark
          outline={outline}
          style={{ display: "inline", height: "1.05em", width: "auto", verticalAlign: "-0.045em" }}
        />
        <span aria-hidden="true">aheli</span>
      </span>
      {tagline && (
        <span
          className="font-display whitespace-nowrap italic tracking-[0.015em] text-tagline"
          style={{ fontSize: s.tag, marginTop: 6, lineHeight: 1.2 }}
        >
          {TAGLINE}
        </span>
      )}
    </span>
  );
}
