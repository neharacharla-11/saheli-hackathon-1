import { friendlyError, readJson } from "@/lib/server/claude";
import { cleanDetails, INDEX_KEY, publicView, REQ_KEY, TTL, type CoachRecord } from "@/lib/server/coach";
import { hashSecret, isToken, kvConfigured, kvDel, kvGetJson, kvSetAdd, kvSetJson, kvSetRemove, randomToken, sameHash } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

const OFF = "Personal plans aren't switched on yet. Please try again later, or message Neha from Care, Talk to an expert.";

async function load(token: unknown, secret: unknown): Promise<CoachRecord | Response> {
  if (!isToken(token) || typeof secret !== "string" || secret.length < 16 || secret.length > 80) {
    return friendlyError("That request link isn't valid.", 400);
  }
  const rec = await kvGetJson<CoachRecord>(REQ_KEY(token));
  if (!rec || !sameHash(rec.secretHash, hashSecret(secret))) return friendlyError("We couldn't find that request.", 404);
  return rec;
}

/** GET with no params: is it switched on? With token + secret: the status and plan. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = p.get("token");
  if (!token) return Response.json({ configured: kvConfigured() });
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  try {
    const rec = await load(token, p.get("secret"));
    if (rec instanceof Response) return rec;
    return Response.json({ ok: true, request: publicView(rec) });
  } catch {
    return friendlyError("Couldn't check just now. Please try again.", 502);
  }
}

/** Send a new request. */
export async function POST(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ kind?: string; details?: unknown }>(req, 20_000);
  const kind = body?.kind === "diet" || body?.kind === "workout" ? body.kind : null;
  const details = cleanDetails(body?.details);
  if (!kind) return friendlyError("Please choose a diet or workout plan.", 400);
  if (!details) return friendlyError("Please add your name and pick at least one goal.", 400);

  const token = randomToken(12);
  const secret = randomToken(24);
  const now = new Date().toISOString();
  const rec: CoachRecord = { token, secretHash: hashSecret(secret), kind, details, status: "waiting", createdAt: now, updatedAt: now };
  try {
    await kvSetJson(REQ_KEY(token), rec, TTL);
    await kvSetAdd(INDEX_KEY, token);
    return Response.json({ ok: true, token, secret, request: publicView(rec) });
  } catch {
    return friendlyError("Couldn't send just now. Please try again.", 502);
  }
}

/** Edit a request (for example after Neha asks for changes). */
export async function PUT(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ token?: string; secret?: string; details?: unknown }>(req, 20_000);
  const details = cleanDetails(body?.details);
  if (!details) return friendlyError("Please add your name and pick at least one goal.", 400);
  try {
    const rec = await load(body?.token, body?.secret);
    if (rec instanceof Response) return rec;
    const next: CoachRecord = { ...rec, details, status: "waiting", coachNote: undefined, updatedAt: new Date().toISOString() };
    await kvSetJson(REQ_KEY(rec.token), next, TTL);
    return Response.json({ ok: true, request: publicView(next) });
  } catch {
    return friendlyError("Couldn't save just now. Please try again.", 502);
  }
}

/** Cancel and delete her request from the server. */
export async function DELETE(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<{ token?: string; secret?: string }>(req, 2_000);
  try {
    const rec = await load(body?.token, body?.secret);
    if (rec instanceof Response) return rec;
    await kvDel(REQ_KEY(rec.token));
    await kvSetRemove(INDEX_KEY, rec.token);
    return Response.json({ ok: true });
  } catch {
    return friendlyError("Couldn't delete just now. Please try again.", 502);
  }
}
