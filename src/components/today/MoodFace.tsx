export type FaceMood = "great" | "good" | "okay" | "low" | "stressed";

export const FACE_MOODS: { id: FaceMood; label: string }[] = [
  { id: "great", label: "Great" },
  { id: "good", label: "Good" },
  { id: "okay", label: "Okay" },
  { id: "low", label: "Low" },
  { id: "stressed", label: "Stressed" },
];

/**
 * A hand-drawn face: a soft round face in a light tint of the primary colour,
 * primary-ink features, blush cheeks on happy faces. Picked: filled primary, white features.
 */
export function MoodFace({ mood, picked = false, size = 40 }: { mood: FaceMood; picked?: boolean; size?: number }) {
  const face = picked ? "var(--primary)" : "color-mix(in srgb, var(--primary) 18%, var(--surface))";
  const ink = picked ? "#FFFFFF" : "var(--primary-ink)";
  const cheek = picked ? "rgb(255 255 255 / 0.35)" : "color-mix(in srgb, var(--primary) 35%, transparent)";
  const happy = mood === "great" || mood === "good";
  const line = { stroke: ink, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill={face} />
      {happy && (
        <>
          <ellipse cx="10.5" cy="23.5" rx="3.2" ry="2" fill={cheek} />
          <ellipse cx="29.5" cy="23.5" rx="3.2" ry="2" fill={cheek} />
        </>
      )}
      {mood === "great" ? (
        <>
          {/* closed, smiling eyes */}
          <path d="M11.5 17.5 Q14 14.5 16.5 17.5" {...line} />
          <path d="M23.5 17.5 Q26 14.5 28.5 17.5" {...line} />
          {/* open smile */}
          <path d="M12.5 23 Q20 32 27.5 23 Z" fill={ink} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
        </>
      ) : (
        <>
          {mood === "stressed" && (
            <>
              <path d="M11 13 L16.5 15" {...line} />
              <path d="M29 13 L23.5 15" {...line} />
            </>
          )}
          <circle cx="14" cy="18" r="1.9" fill={ink} />
          <circle cx="26" cy="18" r="1.9" fill={ink} />
          {mood === "good" && <path d="M13.5 24.5 Q20 30 26.5 24.5" {...line} />}
          {mood === "okay" && <path d="M14 26 L26 26" {...line} />}
          {mood === "low" && <path d="M14.5 28 Q20 23.5 25.5 28" {...line} />}
          {mood === "stressed" && <path d="M12.5 27 Q14.375 24.5 16.25 27 T20 27 T23.75 27 T27.5 27" {...line} />}
        </>
      )}
    </svg>
  );
}
