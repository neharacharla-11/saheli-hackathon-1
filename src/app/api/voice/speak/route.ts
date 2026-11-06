import { cloningConfigured, elevenError, elevenFetch, isVoiceId, json, NOT_ON, trimForSpeech } from "../eleven";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return json(200, { configured: cloningConfigured() });
}

/** Turn one Bestie reply into audio in the voice she chose. */
export async function POST(req: Request) {
  if (!cloningConfigured()) return json(503, { ok: false, configured: false, error: NOT_ON });
  let body: { text?: unknown; voiceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Nothing to read." });
  }
  if (!isVoiceId(body.voiceId)) return json(400, { ok: false, error: "Please choose a voice." });
  const text = typeof body.text === "string" ? trimForSpeech(body.text) : "";
  if (!text) return json(400, { ok: false, error: "Nothing to read." });

  const res = await elevenFetch(`/text-to-speech/${body.voiceId}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });
  if (!res || !res.ok || !res.body) {
    const e = await elevenError(res, "speak");
    return json(e.status, { ok: false, error: e.message });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
