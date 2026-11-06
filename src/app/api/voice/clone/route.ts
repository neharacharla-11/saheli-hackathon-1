import { cloningConfigured, elevenError, elevenFetch, isVoiceId, json, NEEDS_VERIFICATION, NOT_ON, SAHELI_MARK } from "../eleven";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Stay under Vercel's 4.5 MB request limit. */
const MAX_BYTES = 4 * 1024 * 1024;
const AUDIO = /^audio\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|wave|x-m4a|m4a|aac|flac)(;.*)?$/i;

/** Is voice cloning switched on? */
export async function GET() {
  return json(200, { configured: cloningConfigured() });
}

/**
 * Make a voice from a 30-60 second clip of a loved one (ElevenLabs Instant Voice Cloning).
 * Needs her explicit consent. Returns only the voice_id, which she keeps on her phone.
 */
export async function POST(req: Request) {
  if (!cloningConfigured()) return json(503, { ok: false, configured: false, error: NOT_ON });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES + 64 * 1024) return json(413, { ok: false, error: "That clip is too big. Please use a recording under 4 MB, about a minute long." });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, { ok: false, error: "Please choose or record a clip." });
  }

  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const relation = String(form.get("relation") ?? "").trim().slice(0, 40);
  const consent = form.get("consent") === "true";
  const file = form.get("clip");

  if (!name) return json(400, { ok: false, error: "Please add their name." });
  if (!consent) return json(400, { ok: false, error: `Please confirm you have ${name}'s permission to use their voice.` });
  if (!(file instanceof File) || file.size === 0) return json(400, { ok: false, error: "Please choose or record a clip." });
  if (file.size > MAX_BYTES) return json(413, { ok: false, error: "That clip is too big. Please use a recording under 4 MB, about a minute long." });
  if (file.size < 20 * 1024) return json(400, { ok: false, error: "That clip is too short. Please use 30 to 60 seconds of them speaking." });
  if (file.type && !AUDIO.test(file.type)) return json(415, { ok: false, error: "Please use an audio file, like MP3, M4A, WAV or a recording from this page." });

  const out = new FormData();
  out.append("name", `${name}${relation ? ` (${relation})` : ""} · Saheli`.slice(0, 80));
  out.append("description", `${SAHELI_MARK} a loved one's voice, added with their permission, used only to read Bestie's replies to one person.`);
  out.append("files", file, file.name || "clip.webm");
  out.append("remove_background_noise", "false");

  const res = await elevenFetch("/voices/add", { method: "POST", body: out });
  if (!res || !res.ok) {
    const e = await elevenError(res, "clone");
    return json(e.status, { ok: false, error: e.message });
  }
  const data = (await res.json()) as { voice_id?: string; requires_verification?: boolean };
  if (!isVoiceId(data.voice_id)) return json(502, { ok: false, error: "The voice service had a problem. Please try again." });
  // A voice that needs verification can't speak, so don't keep it: delete it and say why.
  if (data.requires_verification) {
    await elevenFetch(`/voices/${data.voice_id}`, { method: "DELETE" });
    return json(422, { ok: false, error: NEEDS_VERIFICATION });
  }
  return json(200, { ok: true, voiceId: data.voice_id });
}

/** Delete a voice she added. Only voices Saheli created can be deleted here. */
export async function DELETE(req: Request) {
  if (!cloningConfigured()) return json(200, { ok: true, removedLocally: true });
  let voiceId: unknown;
  try {
    voiceId = ((await req.json()) as { voiceId?: unknown }).voiceId;
  } catch {
    return json(400, { ok: false, error: "Unknown voice." });
  }
  if (!isVoiceId(voiceId)) return json(400, { ok: false, error: "Unknown voice." });

  const info = await elevenFetch(`/voices/${voiceId}`, { method: "GET" });
  if (info?.status === 404) return json(200, { ok: true }); // already gone
  if (!info || !info.ok) {
    const e = await elevenError(info, "delete");
    return json(e.status, { ok: false, error: e.message });
  }
  const v = (await info.json()) as { description?: string | null };
  if (!v.description?.startsWith(SAHELI_MARK)) return json(403, { ok: false, error: "That voice wasn't added from Saheli." });

  const res = await elevenFetch(`/voices/${voiceId}`, { method: "DELETE" });
  if (!res || (!res.ok && res.status !== 404)) {
    const e = await elevenError(res, "delete");
    return json(e.status, { ok: false, error: e.message });
  }
  return json(200, { ok: true });
}
