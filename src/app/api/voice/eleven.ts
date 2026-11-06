/** ElevenLabs helpers for Bestie's loved-one voices. The key stays on the server. */

export const ELEVEN = "https://api.elevenlabs.io/v1";
/** Every voice Saheli creates starts its description with this, so we only ever delete our own. */
export const SAHELI_MARK = "Saheli:";

export function elevenKey(): string {
  return process.env.ELEVENLABS_API_KEY?.trim() ?? "";
}

export function cloningConfigured(): boolean {
  return !!elevenKey();
}

export const NOT_ON = "Voice cloning isn't switched on yet. Bestie will use your phone's voice for now.";

/** ElevenLabs voice ids are short letters and numbers. */
export function isVoiceId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9]{10,40}$/.test(v);
}

export function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** One call with a 30 second timeout and one retry on 429 or 5xx. */
export async function elevenFetch(path: string, init: RequestInit): Promise<Response | null> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(`${ELEVEN}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), "xi-api-key": elevenKey() },
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });
      if (res.status !== 429 && res.status < 500) return res;
    } catch {
      res = null;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
  }
  return res;
}

/** A kind sentence for an ElevenLabs error. */
export async function elevenError(res: Response | null, what: "clone" | "speak" | "delete"): Promise<{ status: number; message: string }> {
  if (!res) return { status: 504, message: "The voice service didn't answer. Please try again in a moment." };
  let detail = "";
  try {
    const body = (await res.json()) as { detail?: { status?: string; message?: string } | { msg?: string }[] | string };
    detail = JSON.stringify(body.detail ?? "").toLowerCase();
  } catch {
    // no body
  }
  if (res.status === 401) {
    if (detail.includes("instant_voice_cloning") || detail.includes("subscription") || detail.includes("plan")) {
      return { status: 402, message: "Your ElevenLabs plan doesn't include voice cloning yet. Bestie will use your phone's voice." };
    }
    return { status: 503, message: NOT_ON };
  }
  if (res.status === 403) return { status: 402, message: "Your ElevenLabs plan doesn't allow this yet. Bestie will use your phone's voice." };
  if (res.status === 429) return { status: 429, message: "The voice service is busy. Please try again in a minute." };
  if (res.status === 422 || res.status === 400) {
    if (what === "clone") return { status: 422, message: "That clip couldn't be used. Try a clear 30 to 60 second recording of just their voice, with no music." };
    return { status: 422, message: "That reply couldn't be read aloud. Your phone's voice will read it instead." };
  }
  if (res.status === 404) return { status: 404, message: "That voice no longer exists. Please add it again." };
  return { status: 502, message: "The voice service had a problem. Please try again." };
}

/** Keep each request short: cut at a sentence end near 1,200 characters. */
export function trimForSpeech(text: string, max = 1200): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}
