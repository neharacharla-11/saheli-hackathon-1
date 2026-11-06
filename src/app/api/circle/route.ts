import { friendlyError, readJson } from "@/lib/server/claude";
import { sanitizePayload, type CirclePayload } from "@/lib/circle";
import { hashSecret, isToken, kvConfigured, kvDel, kvGetJson, kvSetJson, randomToken, sameHash } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

const KEY = (token: string) => `circle:${token}`;
const TTL = 60 * 60 * 24 * 400; // a link quietly expires after about 13 months unused
const OFF = "Circle links aren't switched on yet.";

interface CircleRecord {
  secretHash: string;
  payload: CirclePayload;
  updatedAt: string;
}

async function owned(token: unknown, secret: unknown): Promise<CircleRecord | Response> {
  if (!isToken(token) || typeof secret !== "string" || secret.length < 16 || secret.length > 80) {
    return friendlyError("That Circle link isn't valid.", 400);
  }
  const rec = await kvGetJson<CircleRecord>(KEY(token));
  if (!rec || !sameHash(rec.secretHash, hashSecret(secret))) return friendlyError("We couldn't find that Circle link.", 404);
  return rec;
}

/** No token: is Circle sync switched on? With a token: what that person may see (no secret needed, no logs inside). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.json({ configured: kvConfigured() });
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  if (!isToken(token)) return friendlyError("That Circle link isn't valid.", 400);
  try {
    const rec = await kvGetJson<CircleRecord>(KEY(token));
    if (!rec) return friendlyError("This Circle link has been removed.", 404);
    return Response.json({ ok: true, payload: rec.payload }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return friendlyError("Couldn't load just now. Please try again.", 502);
  }
}

/** Create a private link for one person. */
export async function POST(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ payload?: unknown }>(req, 8_000);
  const payload = sanitizePayload(body?.payload);
  if (!payload) return friendlyError("Something was missing. Please try again.", 400);
  const token = randomToken(12);
  const secret = randomToken(24);
  try {
    await kvSetJson(KEY(token), { secretHash: hashSecret(secret), payload, updatedAt: new Date().toISOString() } satisfies CircleRecord, TTL);
    return Response.json({ ok: true, token, secret });
  } catch {
    return friendlyError("Couldn't create the link just now. Please try again.", 502);
  }
}

/** Update what the person sees. Runs when she opens Saheli. */
export async function PUT(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ token?: string; secret?: string; payload?: unknown }>(req, 8_000);
  const payload = sanitizePayload(body?.payload);
  if (!payload) return friendlyError("Something was missing. Please try again.", 400);
  try {
    const rec = await owned(body?.token, body?.secret);
    if (rec instanceof Response) return rec;
    await kvSetJson(KEY(body!.token!), { ...rec, payload, updatedAt: new Date().toISOString() } satisfies CircleRecord, TTL);
    return Response.json({ ok: true });
  } catch {
    return friendlyError("Couldn't update just now. It will try again next time.", 502);
  }
}

/** Remove a person: their link stops working. */
export async function DELETE(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ token?: string; secret?: string }>(req, 2_000);
  try {
    const rec = await owned(body?.token, body?.secret);
    if (rec instanceof Response) return rec;
    await kvDel(KEY(body!.token!));
    return Response.json({ ok: true });
  } catch {
    return friendlyError("Couldn't remove just now. Please try again.", 502);
  }
}
