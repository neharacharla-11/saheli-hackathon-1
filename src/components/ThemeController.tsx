"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { APP_STORE_KEY, useAppStore, useProfileStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import type { Mood } from "@/lib/types";

const DARK_ONLY = new Set(["midnight", "night-garden"]);

const MOOD_PALETTE: Partial<Record<Mood, string>> = {
  great: "happy",
  energetic: "energetic",
  calm: "calm",
  low: "low",
  anxious: "anxious",
  irritable: "irritable",
  overwhelmed: "overwhelmed",
  stressed: "overwhelmed",
};

function subscribeScheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Keeps data-theme, data-mode and data-mood on <html> in step with her settings. */
export function ThemeController() {
  const theme = useAppStore((s) => s.theme);
  const mode = useAppStore((s) => s.mode);
  const moodAdaptive = useAppStore((s) => s.moodAdaptive);
  const todaysMood = useProfileStore((s) => s.dayLogs[todayISO()]?.mood);
  const pathname = usePathname();
  const systemDark = useSyncExternalStore(
    subscribeScheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  useEffect(() => {
    const root = document.documentElement;
    const dark = DARK_ONLY.has(theme) || mode === "dark" || (mode === "system" && systemDark);
    root.dataset.theme = theme;
    root.dataset.mode = dark ? "dark" : "light";
    const inApp = pathname?.startsWith("/app") ?? false;
    const mood = inApp && moodAdaptive && todaysMood ? MOOD_PALETTE[todaysMood] : undefined;
    if (mood) root.dataset.mood = mood;
    else delete root.dataset.mood;
  }, [theme, mode, systemDark, moodAdaptive, todaysMood, pathname]);

  return null;
}

/** Runs before paint so the saved theme shows with no flash. */
export const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  APP_STORE_KEY,
)})||"{}").state||{};var t=s.theme||"rose";var m=s.mode||"light";var d=t==="midnight"||t==="night-garden"||m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=t;r.dataset.mode=d?"dark":"light";}catch(e){}})();`;
