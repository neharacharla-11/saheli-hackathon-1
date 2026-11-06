import { friendlyError, readJson } from "@/lib/server/claude";
import { hashSecret, kvConfigured, kvDel, kvGetJson, kvSetJson, sameHash } from "@/lib/server/kv";

export const runtime = "nodejs";

/**
 * Encrypted cloud backups. The phone encrypts everything before it arrives here;
 * this route only ever stores ciphertext and a hash of her secret.
 */
interface Stored {
  hash: string;
  iv: string;
  ct: string;
  updatedAt: string;
}

interface Body {
  action?: unknown;
  id?: unknown;
  auth?: unknown;
  iv?: unknown;
  ct?: unknown;
}

const NOT_ON = "Cloud backup isn't switched on yet. You can still back up to a file on the Privacy page.";
const KEEP_SECONDS = 400 * 24 * 3600;
const MAX_CT = 4_000_000;

const isHex64 = (s: unknown): s is string => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const isB64 = (s: unknown, max: number): s is string => typeof s === "string" && s.length > 0 && s.length <= max && /^[A-Za-z0-9+/]+={0,2}$/.test(s);

export function GET() {
  return Response.json({ ok: true, configured: kvConfigured() });
}

export async function POST(req: Request) {
  if (!kvConfigured()) return friendlyError(NOT_ON, 503, { configured: false });
  const body = await readJson<Body>(req, 4_400_000);
  if (!body) return friendlyError("That backup is too big or didn't come through. Please try again.", 400);
  const { action, id, auth } = body;
  if (!isHex64(id) || !isHex64(auth)) return friendlyError("That backup code doesn't look right.", 400);
  const key = `backup:${id}`;

  try {
    const existing = await kvGetJson<Stored>(key);
    const owns = existing ? sameHash(existing.hash, hashSecret(auth)) : false;

    if (action === "save") {
      if (!isB64(body.iv, 32) || !isB64(body.ct, MAX_CT)) return friendlyError("That backup is too big to save. Try removing old chats.", 413);
      if (existing && !owns) return friendlyError("That code and password don't match this backup.", 403);
      const updatedAt = new Date().toISOString();
      await kvSetJson(key, { hash: hashSecret(auth), iv: body.iv, ct: body.ct, updatedAt } satisfies Stored, KEEP_SECONDS);
      return Response.json({ ok: true, updatedAt });
    }
    if (action === "load") {
      if (!existing || !owns) return friendlyError("We couldn't find a backup for that code and password. Check both and try again.", 404);
      return Response.json({ ok: true, iv: existing.iv, ct: existing.ct, updatedAt: existing.updatedAt });
    }
    if (action === "delete") {
      if (!existing) return Response.json({ ok: true });
      if (!owns) return friendlyError("That code and password don't match this backup.", 403);
      await kvDel(key);
      return Response.json({ ok: true });
    }
    return friendlyError("Unknown request.", 400);
  } catch {
    return friendlyError("The backup service didn't answer. Please try again in a moment.", 502);
  }
}
