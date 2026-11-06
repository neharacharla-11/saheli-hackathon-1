import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * A tiny client for Upstash Redis over its REST API (Vercel Marketplace sets
 * KV_REST_API_URL and KV_REST_API_TOKEN). No extra package needed.
 */
/** Upstash may set KV_REST_API_* or UPSTASH_REDIS_REST_* depending on how it was added. */
function kvUrl(): string {
  return (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
}
function kvToken(): string {
  return (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
}

export function kvConfigured(): boolean {
  return !!kvUrl() && !!kvToken();
}

async function command<T = unknown>(args: (string | number)[]): Promise<T> {
  const url = kvUrl().replace(/\/$/, "");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  const data = (await res.json()) as { result?: T; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result as T;
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await command<string | null>(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Store JSON, optionally expiring after ttlSeconds. */
export async function kvSetJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const args: (string | number)[] = ["SET", key, JSON.stringify(value)];
  if (ttlSeconds) args.push("EX", ttlSeconds);
  await command(args);
}

export async function kvDel(key: string): Promise<void> {
  await command(["DEL", key]);
}

export async function kvSetAdd(key: string, member: string): Promise<void> {
  await command(["SADD", key, member]);
}

export async function kvSetRemove(key: string, member: string): Promise<void> {
  await command(["SREM", key, member]);
}

export async function kvSetMembers(key: string): Promise<string[]> {
  return (await command<string[]>(["SMEMBERS", key])) ?? [];
}

/* ---------- tokens and secrets ---------- */

export function randomToken(bytes = 12): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Slow hash for a human passcode. Stored as salt:hash. */
export function hashPasscode(passcode: string, salt = randomBytes(16).toString("hex")): string {
  return `${salt}:${scryptSync(passcode, salt, 32).toString("hex")}`;
}

export function checkPasscode(passcode: string, stored: string): boolean {
  const [salt] = stored.split(":");
  if (!salt) return false;
  return sameHash(hashPasscode(passcode, salt), stored);
}

export function isToken(s: unknown): s is string {
  return typeof s === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(s);
}
