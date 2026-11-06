import Anthropic from "@anthropic-ai/sdk";

/** Model for chat, report reading and plate photos. */
export const CLAUDE_MODEL = "claude-sonnet-5-5";

/** True when the server has a Claude key. The key itself never leaves the server. */
export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

let client: Anthropic | null = null;

/** One shared client: 30 second timeout, and one retry on 429 / 529 (and other 5xx). */
export function claude(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30_000,
      maxRetries: 1,
    });
  }
  return client;
}

/** A kind JSON error the UI can show as is. */
export function friendlyError(message: string, status = 500, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export const NOT_SWITCHED_ON =
  "Saheli's AI isn't switched on yet. Everything else still works, and this will start working once it's set up.";

/** Turn an SDK error into a short, kind sentence and a status code. */
export function describeAiError(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { message: NOT_SWITCHED_ON, status: 503 };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { message: "A lot of people are talking to Saheli right now. Please try again in a minute.", status: 429 };
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return { message: "That took too long. Please try again.", status: 504 };
  }
  if (err instanceof Anthropic.BadRequestError) {
    return { message: "Saheli couldn't read that. Please try a different photo or a shorter message.", status: 400 };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { message: "Saheli couldn't reach its AI just now. Please check your connection and try again.", status: 502 };
  }
  if (err instanceof Anthropic.APIError) {
    return { message: "Saheli's AI is busy right now. Please try again in a moment.", status: 502 };
  }
  return { message: "Something didn't work. Please try again.", status: 500 };
}

/** Read a JSON body with a size cap (Vercel's limit is 4.5 MB). */
export async function readJson<T = unknown>(req: Request, maxBytes = 4_400_000): Promise<T | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
