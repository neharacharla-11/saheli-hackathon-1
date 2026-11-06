import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { normaliseDict, normKey, translate, LANGS } from "./index";

const root = path.resolve(__dirname, "../../..");
const strings: string[] = JSON.parse(fs.readFileSync(path.join(root, "scripts/strings.json"), "utf8"));
const dict = (lang: string): Record<string, string> =>
  JSON.parse(fs.readFileSync(path.join(__dirname, `dicts/${lang}.json`), "utf8"));

describe("dictionaries", () => {
  for (const { code } of LANGS.filter((l) => l.code !== "en")) {
    it(`${code} has every on-screen string, none empty`, () => {
      const d = normaliseDict(dict(code));
      const missing = strings.filter((s) => !d[normKey(s)]?.trim());
      expect(missing.slice(0, 10)).toEqual([]);
      expect(missing.length).toBe(0);
    });
  }
});

describe("translate", () => {
  const d = normaliseDict({ Today: "आज", "Your cycle": "आपका चक्र", "Add {}": "{} जोड़ें", "Talk to {}…": "{} से बात करें…", "It's okay": "ठीक है" });

  it("keeps surrounding spaces and matches capitals", () => {
    expect(translate("  Today ", d)).toBe("  आज ");
    expect(translate("YOUR CYCLE", d)).toBe("आपका चक्र");
  });
  it("matches curly quotes and collapsed spaces", () => {
    expect(translate("It’s   okay", d)).toBe("ठीक है");
  });
  it("fills name patterns", () => {
    expect(translate("Add Rahul", d)).toBe("Rahul जोड़ें");
    expect(translate("Talk to Neha…", d)).toBe("Neha से बात करें…");
  });
  it("leaves unknown text and numbers alone", () => {
    expect(translate("Something new", d)).toBe("Something new");
    expect(translate("42", d)).toBe("42");
  });
});
