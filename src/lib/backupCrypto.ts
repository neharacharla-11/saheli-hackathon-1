/**
 * Encrypted cloud backup, done entirely on her phone with Web Crypto.
 * Code + password -> PBKDF2 (210,000 rounds, SHA-256) -> an AES-GCM key and a
 * separate server secret. The server only ever sees ciphertext and a hash of that secret.
 */

export const PBKDF2_ROUNDS = 210_000;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0, O, 1, I or L

export function makeCode(rand: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = rand(12);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `SAHELI-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/** Accepts "saheli 7k2q m9xp 4trw" and friends. Returns null if it isn't a code. */
export function normalizeCode(input: string): string | null {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^SAHELI/, "");
  if (s.length !== 12 || [...s].some((c) => !ALPHABET.includes(c))) return null;
  return `SAHELI-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BackupKeys {
  /** Where the backup lives on the server (a hash of the code). */
  id: string;
  /** Proves she owns the backup; the server stores only its hash. */
  auth: string;
  /** Raw AES-256 key, base64. Kept on her phone for daily backups. */
  key: string;
}

export async function deriveKeys(code: string, password: string, rounds = PBKDF2_ROUNDS): Promise<BackupKeys> {
  const enc = new TextEncoder();
  const id = hex(await crypto.subtle.digest("SHA-256", enc.encode(`saheli-backup-id:${code}`)));
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(`saheli-backup:${code}`), iterations: rounds }, base, 512);
  const all = new Uint8Array(bits);
  return { id, key: toB64(all.slice(0, 32)), auth: hex(all.slice(32).buffer) };
}

async function aesKey(keyB64: string) {
  return crypto.subtle.importKey("raw", fromB64(keyB64), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptText(keyB64: string, text: string): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(keyB64), new TextEncoder().encode(text));
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function decryptText(keyB64: string, iv: string, ct: string): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, await aesKey(keyB64), fromB64(ct));
  return new TextDecoder().decode(plain);
}

/* ---------------- What goes in a backup ---------------- */

const SKIP = (k: string) => k === "saheli:backup" || k === "saheli:profile:sample" || k.startsWith("saheli:precache");

/** Everything Saheli keeps in localStorage, except the sample and the backup keys. */
export function collectBackup(storage: Storage): string {
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith("saheli:") && !SKIP(k)) data[k] = storage.getItem(k) ?? "";
  }
  return JSON.stringify({ v: 1, at: new Date().toISOString(), data });
}

/** Write a decrypted backup back. Closes any open sample. */
export function restoreBackup(storage: Storage, json: string): number {
  const parsed = JSON.parse(json) as { v?: number; data?: Record<string, string> };
  if (parsed.v !== 1 || !parsed.data) throw new Error("Not a Saheli backup");
  let n = 0;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (!k.startsWith("saheli:") || SKIP(k)) continue;
    let value = v;
    if (k === "saheli:app") {
      try {
        const app = JSON.parse(v) as { state?: { sample?: unknown } };
        if (app.state) app.state.sample = null;
        value = JSON.stringify(app);
      } catch {}
    }
    storage.setItem(k, value);
    n++;
  }
  return n;
}
