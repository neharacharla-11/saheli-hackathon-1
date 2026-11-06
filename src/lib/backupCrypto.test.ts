import { describe, expect, it } from "vitest";
import { collectBackup, decryptText, deriveKeys, encryptText, makeCode, normalizeCode, restoreBackup } from "./backupCrypto";

class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

describe("codes", () => {
  it("makes readable codes and normalises what she types", () => {
    const code = makeCode();
    expect(code).toMatch(/^SAHELI-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(normalizeCode("saheli 7k2q m9xp 4trw")).toBe("SAHELI-7K2Q-M9XP-4TRW");
    expect(normalizeCode("7K2Q-M9XP-4TRW")).toBe("SAHELI-7K2Q-M9XP-4TRW");
    expect(normalizeCode("SAHELI-7K2Q-M9XP")).toBeNull();
    expect(normalizeCode("SAHELI-0000-0000-0000")).toBeNull();
  });
});

describe("encryption", () => {
  it("derives the same keys from the same code and password, and different ones otherwise", async () => {
    const a = await deriveKeys("SAHELI-7K2Q-M9XP-4TRW", "correct horse", 1000);
    const b = await deriveKeys("SAHELI-7K2Q-M9XP-4TRW", "correct horse", 1000);
    const c = await deriveKeys("SAHELI-7K2Q-M9XP-4TRW", "wrong horse", 1000);
    expect(a).toEqual(b);
    expect(c.key).not.toBe(a.key);
    expect(c.id).toBe(a.id); // the id depends only on the code
    expect(a.auth).not.toContain(a.key);
  });

  it("round-trips data and refuses the wrong key", async () => {
    const k = await deriveKeys("SAHELI-7K2Q-M9XP-4TRW", "pw-12345", 1000);
    const bad = await deriveKeys("SAHELI-7K2Q-M9XP-4TRW", "pw-54321", 1000);
    const { iv, ct } = await encryptText(k.key, "her private notes");
    expect(ct).not.toContain("private");
    expect(await decryptText(k.key, iv, ct)).toBe("her private notes");
    await expect(decryptText(bad.key, iv, ct)).rejects.toBeTruthy();
  });
});

describe("collect and restore", () => {
  it("backs up Saheli keys but never the sample, and closes a sample on restore", () => {
    const s = new MemStorage();
    s.setItem("saheli:app", JSON.stringify({ state: { activeId: "me", sample: { key: "priya" } } }));
    s.setItem("saheli:profile:me", '{"state":{"profile":{"name":"Me"}}}');
    s.setItem("saheli:profile:sample", "{}");
    s.setItem("saheli:backup", "{}");
    s.setItem("other-app", "x");
    const json = collectBackup(s as unknown as Storage);
    const keys = Object.keys(JSON.parse(json).data);
    expect(keys.sort()).toEqual(["saheli:app", "saheli:profile:me"]);
    const fresh = new MemStorage();
    expect(restoreBackup(fresh as unknown as Storage, json)).toBe(2);
    expect(JSON.parse(fresh.getItem("saheli:app")!).state.sample).toBeNull();
    expect(() => restoreBackup(fresh as unknown as Storage, '{"v":2}')).toThrow();
  });
});
