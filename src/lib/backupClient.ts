"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { collectBackup, decryptText, deriveKeys, encryptText, makeCode, normalizeCode, restoreBackup } from "./backupCrypto";
import { useAppStore } from "./store";

/** What this phone remembers about her cloud backup. Never the password. */
interface BackupState {
  code: string | null;
  id: string | null;
  auth: string | null;
  key: string | null;
  lastAt: string | null;
  error: string | null;
  set: (patch: Partial<BackupState>) => void;
  clear: () => void;
}

export const useBackupStore = create<BackupState>()(
  persist(
    (set) => ({
      code: null,
      id: null,
      auth: null,
      key: null,
      lastAt: null,
      error: null,
      set: (patch) => set(patch),
      clear: () => set({ code: null, id: null, auth: null, key: null, lastAt: null, error: null }),
    }),
    {
      name: "saheli:backup",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ code: s.code, id: s.id, auth: s.auth, key: s.key, lastAt: s.lastAt, error: s.error }),
    },
  ),
);

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; iv?: string; ct?: string; updatedAt?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "The backup service didn't answer. Please try again.");
  return json;
}

export async function backupConfigured(): Promise<boolean> {
  try {
    const r = await fetch("/api/backup");
    return !!((await r.json()) as { configured?: boolean }).configured;
  } catch {
    return false;
  }
}

/** Encrypt everything on this phone and upload it. */
export async function backupNow(): Promise<string> {
  const s = useBackupStore.getState();
  if (!s.id || !s.auth || !s.key) throw new Error("Set up your backup first.");
  if (useAppStore.getState().sample) throw new Error("Close the sample first.");
  const { iv, ct } = await encryptText(s.key, collectBackup(localStorage));
  const r = await call({ action: "save", id: s.id, auth: s.auth, iv, ct });
  const at = r.updatedAt ?? new Date().toISOString();
  s.set({ lastAt: at, error: null });
  return at;
}

/** Set up a new backup with her password. Returns the code to save. */
export async function createBackup(password: string): Promise<string> {
  const code = makeCode();
  const k = await deriveKeys(code, password);
  useBackupStore.getState().set({ code, ...k, lastAt: null, error: null });
  try {
    await backupNow();
  } catch (e) {
    useBackupStore.getState().clear();
    throw e;
  }
  return code;
}

/** Bring a backup onto this phone. Overwrites Saheli's data here. */
export async function restoreFromCloud(codeInput: string, password: string): Promise<number> {
  const code = normalizeCode(codeInput);
  if (!code) throw new Error("That code doesn't look right. It looks like SAHELI-7K2Q-M9XP-4TRW.");
  const k = await deriveKeys(code, password);
  const r = await call({ action: "load", id: k.id, auth: k.auth });
  let json: string;
  try {
    json = await decryptText(k.key, r.iv!, r.ct!);
  } catch {
    throw new Error("That code and password don't match. Check both and try again.");
  }
  const n = restoreBackup(localStorage, json);
  useBackupStore.getState().set({ code, ...k, lastAt: r.updatedAt ?? null, error: null });
  return n;
}

export async function deleteCloudBackup(): Promise<void> {
  const s = useBackupStore.getState();
  if (s.id && s.auth) await call({ action: "delete", id: s.id, auth: s.auth });
  s.clear();
}

/** Once a day, quietly back up if she set it up. */
export async function autoBackup(): Promise<void> {
  const s = useBackupStore.getState();
  if (!s.id || !s.key || !navigator.onLine || useAppStore.getState().sample) return;
  if (s.lastAt && Date.now() - new Date(s.lastAt).getTime() < 24 * 3600_000) return;
  try {
    await backupNow();
  } catch (e) {
    s.set({ error: e instanceof Error ? e.message : "Backup didn't work." });
  }
}
