import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trimForSpeech } from "./eleven";
import * as clone from "./clone/route";
import * as speak from "./speak/route";

const VOICE = "AbCdEfGhIjKlMnOpQrSt";
const realFetch = globalThis.fetch;
let calls: { url: string; init?: RequestInit }[] = [];

function clipForm(over: Record<string, string> = {}, size = 64 * 1024, type = "audio/webm") {
  const f = new FormData();
  f.append("name", over.name ?? "Mom");
  f.append("relation", over.relation ?? "Mother");
  f.append("consent", over.consent ?? "true");
  f.append("clip", new File([new Uint8Array(size)], "clip.webm", { type }));
  return new Request("http://x/api/voice/clone", { method: "POST", body: f });
}

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.ELEVENLABS_API_KEY;
});

describe("voice cloning switched off", () => {
  it("says so kindly and never crashes", async () => {
    expect(await (await clone.GET()).json()).toEqual({ configured: false });
    const res = await clone.POST(clipForm());
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/isn't switched on yet/);
    expect((await speak.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "Hi", voiceId: VOICE }) }))).status).toBe(503);
  });
});

describe("voice cloning switched on", () => {
  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push({ url: u, init });
      if (u.endsWith("/voices/add")) return Response.json({ voice_id: VOICE, requires_verification: false });
      if (u.includes(`/voices/${VOICE}`) && (!init?.method || init.method === "GET")) return Response.json({ description: "Saheli: a loved one's voice" });
      if (u.includes("/voices/NotOursNotOurs12") && init?.method === "GET") return Response.json({ description: "Someone else's voice" });
      if (init?.method === "DELETE") return Response.json({ status: "ok" });
      if (u.includes("/text-to-speech/")) return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "audio/mpeg" } });
      return new Response("{}", { status: 404 });
    }) as typeof fetch;
  });

  it("needs her consent before anything is uploaded", async () => {
    const res = await clone.POST(clipForm({ consent: "false" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Mom's permission/);
    expect(calls).toHaveLength(0);
  });

  it("checks the name, size and type of the clip", async () => {
    expect((await clone.POST(clipForm({ name: "" }))).status).toBe(400);
    expect((await clone.POST(clipForm({}, 1024))).status).toBe(400); // too short
    expect((await clone.POST(clipForm({}, 5 * 1024 * 1024))).status).toBe(413);
    expect((await clone.POST(clipForm({}, 64 * 1024, "image/png"))).status).toBe(415);
    expect(calls).toHaveLength(0);
  });

  it("sends the clip to Instant Voice Cloning with the key on the server only, and returns the voice_id", async () => {
    const res = await clone.POST(clipForm());
    const body = await res.json();
    expect(body).toEqual({ ok: true, voiceId: VOICE });
    const call = calls[0];
    expect(call.url).toBe("https://api.elevenlabs.io/v1/voices/add");
    expect((call.init?.headers as Record<string, string>)["xi-api-key"]).toBe("test-key");
    const sent = call.init?.body as FormData;
    expect(String(sent.get("description"))).toMatch(/^Saheli:/);
    expect(sent.get("files")).toBeInstanceOf(File);
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("only deletes voices Saheli created", async () => {
    const ok = await clone.DELETE(new Request("http://x", { method: "DELETE", body: JSON.stringify({ voiceId: VOICE }) }));
    expect((await ok.json()).ok).toBe(true);
    expect(calls.some((c) => c.init?.method === "DELETE")).toBe(true);
    calls = [];
    const no = await clone.DELETE(new Request("http://x", { method: "DELETE", body: JSON.stringify({ voiceId: "NotOursNotOurs12" }) }));
    expect(no.status).toBe(403);
    expect(calls.some((c) => c.init?.method === "DELETE")).toBe(false);
    expect((await clone.DELETE(new Request("http://x", { method: "DELETE", body: JSON.stringify({ voiceId: "../../bad" }) }))).status).toBe(400);
  });

  it("speaks a reply in the chosen voice", async () => {
    const res = await speak.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "Rest today, and keep warm.", voiceId: VOICE }) }));
    expect(res.headers.get("content-type")).toBe("audio/mpeg");
    expect(calls[0].url).toContain(`/text-to-speech/${VOICE}`);
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ text: "Rest today, and keep warm.", model_id: "eleven_multilingual_v2" });
    expect((await speak.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "Hi", voiceId: "x" }) }))).status).toBe(400);
    expect((await speak.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "  ", voiceId: VOICE }) }))).status).toBe(400);
  });

  it("deletes a voice that needs verification and says why", async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/voices/add")) return Response.json({ voice_id: VOICE, requires_verification: true });
      return Response.json({ status: "ok" });
    }) as typeof fetch;
    const res = await clone.POST(clipForm());
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/record your loved one speaking live/);
    expect(calls.some((c) => c.init?.method === "DELETE" && c.url.endsWith(`/voices/${VOICE}`))).toBe(true);
  });

  it("explains a voice ElevenLabs won't speak with", async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({ detail: { type: "authorization_error", code: "voice_access_denied", status: "detected_captcha_voice" } }, { status: 401 }),
    ) as typeof fetch;
    const res = await speak.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "Hi there", voiceId: VOICE }) }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/needs to verify this voice/);
  });

  it("explains a key that is missing permissions", async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ detail: { status: "missing_permissions", message: "missing the permission voices_write" } }, { status: 401 })) as typeof fetch;
    const res = await clone.POST(clipForm());
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/needs more permissions/);
  });

  it("explains a plan without voice cloning", async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ detail: { status: "can_not_use_instant_voice_cloning" } }, { status: 401 })) as typeof fetch;
    const res = await clone.POST(clipForm());
    expect(res.status).toBe(402);
    expect((await res.json()).error).toMatch(/plan doesn't include voice cloning/);
  });
});

describe("trimForSpeech", () => {
  it("keeps short replies and cuts long ones at a sentence end", () => {
    expect(trimForSpeech("  Hello   there. ")).toBe("Hello there.");
    const long = "This is one sentence. ".repeat(100);
    const t = trimForSpeech(long);
    expect(t.length).toBeLessThanOrEqual(1200);
    expect(t.endsWith(".")).toBe(true);
  });
});
