import { friendlyError, readJson } from "@/lib/server/claude";
import { cleanPlan, INDEX_KEY, PASS_KEY, REQ_KEY, TTL, type CoachRecord } from "@/lib/server/coach";
import { checkPasscode, hashPasscode, isToken, kvConfigured, kvGetJson, kvSetJson, kvSetMembers, kvSetRemove } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

const OFF = "The coach store isn't switched on yet. Add Upstash Redis from the Vercel Marketplace to turn it on.";

/** Is the store on, and has Neha set her passcode yet? */
export async function GET() {
  if (!kvConfigured()) return Response.json({ configured: false, hasPasscode: false });
  try {
    const stored = await kvGetJson<string>(PASS_KEY);
    return Response.json({ configured: true, hasPasscode: !!stored });
  } catch {
    return friendlyError("Couldn't reach the store just now.", 502);
  }
}

interface Body {
  action?: "setup" | "list" | "save";
  passcode?: string;
  token?: string;
  status?: string;
  plan?: unknown;
  note?: string;
}

export async function POST(req: Request) {
  if (!kvConfigured()) return friendlyError(OFF, 503, { configured: false });
  const body = await readJson<Body>(req, 60_000);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";
  if (passcode.length < 6 || passcode.length > 100) return friendlyError("Your passcode needs at least 6 characters.", 400);

  try {
    const stored = await kvGetJson<string>(PASS_KEY);

    if (body?.action === "setup") {
      if (stored) return friendlyError("A passcode is already set. Please sign in with it.", 409);
      await kvSetJson(PASS_KEY, hashPasscode(passcode));
      return Response.json({ ok: true });
    }

    if (!stored || !checkPasscode(passcode, stored)) {
      await new Promise((r) => setTimeout(r, 700));
      return friendlyError("That passcode doesn't match.", 401);
    }

    if (body?.action === "list") {
      const tokens = await kvSetMembers(INDEX_KEY);
      const recs: CoachRecord[] = [];
      for (const t of tokens.slice(0, 300)) {
        const r = await kvGetJson<CoachRecord>(REQ_KEY(t));
        if (r) recs.push(r);
        else await kvSetRemove(INDEX_KEY, t); // expired or deleted
      }
      recs.sort((a, b) => (a.status === "waiting" ? 0 : 1) - (b.status === "waiting" ? 0 : 1) || b.updatedAt.localeCompare(a.updatedAt));
      return Response.json({
        ok: true,
        requests: recs.map((r) => ({ token: r.token, kind: r.kind, details: r.details, status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt, coachNote: r.coachNote, plan: r.plan, draft: r.draft })),
      });
    }

    if (body?.action === "save") {
      if (!isToken(body.token)) return friendlyError("Unknown request.", 400);
      const rec = await kvGetJson<CoachRecord>(REQ_KEY(body.token));
      if (!rec) return friendlyError("That request no longer exists.", 404);
      const status = body.status === "ready" || body.status === "changes" || body.status === "waiting" ? body.status : null;
      if (!status) return friendlyError("Please choose ready or ask for changes.", 400);
      const plan = body.plan ? cleanPlan(body.plan) : null;
      if (status === "ready" && !plan) return friendlyError("Please write at least one meal or day before marking it ready.", 400);
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 800) : undefined;
      if (status === "changes" && !note) return friendlyError("Please write what you'd like her to change or add.", 400);
      const next: CoachRecord = {
        ...rec,
        // A draft stays on the server until she's sent it; then it becomes the plan.
        status: status === "waiting" ? rec.status : status,
        plan: status === "ready" ? plan! : rec.plan,
        draft: status === "ready" ? undefined : (plan ?? rec.draft),
        coachNote: status === "changes" ? note : status === "ready" ? undefined : rec.coachNote,
        updatedAt: status === "waiting" ? rec.updatedAt : new Date().toISOString(),
      };
      await kvSetJson(REQ_KEY(rec.token), next, TTL);
      return Response.json({ ok: true });
    }

    return friendlyError("Unknown action.", 400);
  } catch {
    return friendlyError("Couldn't reach the store just now. Please try again.", 502);
  }
}
