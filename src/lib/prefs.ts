"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Small device preferences (sugar unit, voice language) kept in localStorage. */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("saheli:pref:") && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`saheli:pref:${key}`);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`saheli:pref:${key}`, value);
  } catch {
    // private mode: keep it for this visit only
  }
  listeners.forEach((l) => l());
}

/** A remembered string preference. `fallback` is used until she picks one. */
export function usePref<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => readPref(key),
    () => null,
  );
  const set = useCallback((v: T) => writePref(key, v), [key]);
  return [((stored as T | null) ?? fallback) as T, set];
}
