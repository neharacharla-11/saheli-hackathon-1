import { friendlyError, readJson } from "@/lib/server/claude";
import { hashSecret, isToken, kvConfigured, kvDel, kvGetJson, kvSetAdd, kvSetJson, kvSetRemove, randomToken, sameHash } from "@/lib/server/kv";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OFF = "Sending ideas isn't switched on yet. We've kept yours safe on this phone and will send it later.";
const KEY = (token: string) => `recommend:${token}`;
const INDEX = "recommend:index";
const TTL = 60 * 60 * 24 * 365; // a year
const TOPICS = ["song", "recipe", "workout", "feature", "other"] as const;
type Topic = (typeof TOPICS)[number];
type Status = "received" | "working" | "added";

interface RecommendRecord {
  token: string;
  secretHash: string;
  topic: Topic;
  text: string;
  name?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

function view(r: RecommendRecord) {
  return { token: r.token, topic: r.topic, status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

function withTimeout<T>(p: Promise<T>, ms = 30_000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function load(token: unknown, secret: unknown): Promise<RecommendRecord | Response> {
  if (!isToken(token) || typeof secret !== "string" || secret.length < 16 || secret.length > 80) {
    return friendlyError("That link isn't valid.", 400);
  }
  const rec = await withTimeout(kvGetJson<RecommendRecord>(KEY(token)));
  if (!rec || !sameHash(rec.secretHash, hashSecret(secret))) return friendlyError("We couldn't find that idea.", 404);
  return rec;
}

/** GET with no params: is it switched on? With token + secret: the latest status. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = p.get("token");
  if (!token) return Response.json({ configured: kvConfigured() });
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  try {
    const rec = await load(token, p.get("secret"));
    if (rec instanceof Response) return rec;
    return Response.json({ ok: true, suggestion: view(rec) });
  } catch {
    return friendlyError("Couldn't check just now. Please try again.", 502);
  }
}

/** Send a new idea. */
export async function POST(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ topic?: string; text?: string; name?: string }>(req, 10_000);
  if (!body) return friendlyError("Please write your idea and try again.", 400);
  const topic = TOPICS.includes(body.topic as Topic) ? (body.topic as Topic) : null;
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
  if (!topic) return friendlyError("Please choose what your idea is about.", 400);
  if (text.length < 3) return friendlyError("Please write a few words about your idea.", 400);

  const token = randomToken(12);
  const secret = randomToken(24);
  const now = new Date().toISOString();
  const rec: RecommendRecord = {
    token,
    secretHash: hashSecret(secret),
    topic,
    text,
    name: name || undefined,
    status: "received",
    createdAt: now,
    updatedAt: now,
  };
  try {
    await withTimeout(kvSetJson(KEY(token), rec, TTL));
    await withTimeout(kvSetAdd(INDEX, token));
    return Response.json({ ok: true, token, secret, suggestion: view(rec) });
  } catch {
    return friendlyError("Couldn't send just now. We've kept it on this phone, please try again.", 502);
  }
}

/** Remove her idea from the server. */
export async function DELETE(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ token?: string; secret?: string }>(req, 2_000);
  try {
    const rec = await load(body?.token, body?.secret);
    if (rec instanceof Response) return rec;
    await withTimeout(kvDel(KEY(rec.token)));
    await withTimeout(kvSetRemove(INDEX, rec.token));
    return Response.json({ ok: true });
  } catch {
    return friendlyError("Couldn't remove it just now. Please try again.", 502);
  }
}
