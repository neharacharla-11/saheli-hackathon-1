import { afterEach, describe, expect, it } from "vitest";
import { kvConfigured } from "./kv";

const KEYS = ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

describe("kvConfigured", () => {
  it("is off with nothing set", () => {
    expect(kvConfigured()).toBe(false);
  });
  it("accepts the Vercel KV names", () => {
    process.env.KV_REST_API_URL = "https://x.upstash.io";
    process.env.KV_REST_API_TOKEN = "t";
    expect(kvConfigured()).toBe(true);
  });
  it("accepts the Upstash names", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://x.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    expect(kvConfigured()).toBe(true);
  });
  it("needs both the URL and the token", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://x.upstash.io";
    expect(kvConfigured()).toBe(false);
  });
});
