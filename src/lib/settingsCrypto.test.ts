import { describe, expect, it } from "vitest";
import { checkPin, clearSaheliKeys, hashPin, isSaheliKey, isValidPin } from "./settingsCrypto";

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe("PIN", () => {
  it("accepts only 4 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
  });
  it("checks a salted hash", async () => {
    const h = await hashPin("2468", "salt-1");
    expect(h).toHaveLength(64);
    expect(await checkPin("2468", "salt-1", h)).toBe(true);
    expect(await checkPin("2469", "salt-1", h)).toBe(false);
    expect(await hashPin("2468", "salt-2")).not.toBe(h);
  });
});

describe("clearSaheliKeys", () => {
  it("removes only Saheli keys", () => {
    const s = new MemStorage();
    s.setItem("saheli:app", "{}");
    s.setItem("saheli:profile:a", '{"x":1}');
    s.setItem("other", "keep");
    clearSaheliKeys(s);
    expect(s.length).toBe(1);
    expect(s.getItem("other")).toBe("keep");
    expect(isSaheliKey("saheli:privacy")).toBe(true);
  });
});
