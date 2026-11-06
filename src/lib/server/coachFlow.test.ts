import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/** A tiny fake of Upstash's REST API, so the whole coach flow runs without a server. */
const db = new Map<string, string | Set<string>>();
function fakeRedis(args: string[]) {
  const [cmd, key, ...rest] = args;
  switch (cmd) {
    case "GET":
      return (db.get(key) as string) ?? null;
    case "SET":
      db.set(key, rest[0]);
      return "OK";
    case "DEL":
      return db.delete(key) ? 1 : 0;
    case "SADD": {
      const s = (db.get(key) as Set<string>) ?? new Set<string>();
      s.add(rest[0]);
      db.set(key, s);
      return 1;
    }
    case "SREM":
      (db.get(key) as Set<string> | undefined)?.delete(rest[0]);
      return 1;
    case "SMEMBERS":
      return [...((db.get(key) as Set<string>) ?? [])];
  }
  throw new Error(`unknown ${cmd}`);
}

const realFetch = globalThis.fetch;
beforeAll(() => {
  process.env.KV_REST_API_URL = "https://fake.upstash.io";
  process.env.KV_REST_API_TOKEN = "token";
  globalThis.fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const result = fakeRedis(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ result }), { status: 200 });
  }) as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

const json = (method: string, body: unknown) =>
  new Request("http://x/api/coach", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("coach flow end to end", () => {
  it("she sends, Neha sets a passcode, drafts, marks ready, and her phone gets the plan", async () => {
    const her = await import("@/app/api/coach/route");
    const neha = await import("@/app/api/coach/admin/route");

    // She sends a request
    const sent = await (
      await her.POST(json("POST", { kind: "diet", details: { name: "Test", goals: ["More energy"], mealsPerDay: 4, shareNumbers: true, numbers: { age: 30 } } }))
    ).json();
    expect(sent.ok).toBe(true);
    const { token, secret } = sent;

    // A wrong secret finds nothing
    expect((await her.GET(new Request(`http://x/api/coach?token=${token}&secret=${"x".repeat(32)}`))).status).toBe(404);

    // Neha sets her passcode once, then can't set it again
    expect((await (await neha.POST(json("POST", { action: "setup", passcode: "secret-pass" }))).json()).ok).toBe(true);
    expect((await neha.POST(json("POST", { action: "setup", passcode: "other-pass" }))).status).toBe(409);
    expect((await neha.POST(json("POST", { action: "list", passcode: "wrong-pass" }))).status).toBe(401);

    const list = await (await neha.POST(json("POST", { action: "list", passcode: "secret-pass" }))).json();
    expect(list.requests).toHaveLength(1);
    expect(list.requests[0].details.numbers.age).toBe(30);
    expect(JSON.stringify(list)).not.toContain("secretHash");

    // A draft stays private
    const plan = { intro: "For you", meals: [{ slot: "Lunch", items: "Dal, 2 rotis, salad" }] };
    await neha.POST(json("POST", { action: "save", passcode: "secret-pass", token, status: "waiting", plan }));
    let mine = await (await her.GET(new Request(`http://x/api/coach?token=${token}&secret=${secret}`))).json();
    expect(mine.request.status).toBe("waiting");
    expect(mine.request.plan).toBeUndefined();

    // Asking for changes sends her the note
    await neha.POST(json("POST", { action: "save", passcode: "secret-pass", token, status: "changes", note: "What time is dinner?" }));
    mine = await (await her.GET(new Request(`http://x/api/coach?token=${token}&secret=${secret}`))).json();
    expect(mine.request.status).toBe("changes");
    expect(mine.request.coachNote).toBe("What time is dinner?");

    // She edits, Neha marks it ready, her phone gets the plan
    expect((await (await her.PUT(json("PUT", { token, secret, details: { name: "Test", goals: ["More energy"], routine: "Dinner at 9", shareNumbers: false } }))).json()).ok).toBe(true);
    await neha.POST(json("POST", { action: "save", passcode: "secret-pass", token, status: "ready", plan }));
    mine = await (await her.GET(new Request(`http://x/api/coach?token=${token}&secret=${secret}`))).json();
    expect(mine.request.status).toBe("ready");
    expect(mine.request.plan.meals[0].items).toContain("Dal");
    expect(mine.request.coachNote).toBeUndefined();

    // She cancels and it's gone from the server
    expect((await (await her.DELETE(json("DELETE", { token, secret }))).json()).ok).toBe(true);
    const after = await (await neha.POST(json("POST", { action: "list", passcode: "secret-pass" }))).json();
    expect(after.requests).toHaveLength(0);
  });
});
