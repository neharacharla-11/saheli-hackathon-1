import { friendlyError, readJson } from "@/lib/server/claude";

export const dynamic = "force-dynamic";

function configured() {
  return !!process.env.ELEVENLABS_API_KEY?.trim() && !!process.env.ELEVENLABS_VOICE_ID?.trim();
}

/** Whether a loved one's voice is set up. Otherwise the phone's own voice reads aloud. */
export async function GET() {
  return Response.json({ configured: configured() });
}

export async function POST(req: Request) {
  if (!configured()) return friendlyError("A custom voice isn't switched on yet.", 503, { configured: false });
  const body = await readJson<{ text?: string }>(req, 20_000);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1500) : "";
  if (!text) return friendlyError("Nothing to read.", 400);

  const voice = encodeURIComponent(process.env.ELEVENLABS_VOICE_ID!.trim());
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!.trim(), "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
      }
      if (res.status !== 429 && res.status < 500) break;
    } catch {
      // try once more
    }
  }
  return friendlyError("The voice couldn't load just now. Your phone's voice will read it instead.", 502);
}
