import { describe, expect, it } from "vitest";
import { DICTIONARIES, translate } from "./index";

describe("translate", () => {
  it("leaves English alone", () => {
    expect(translate("Today", "en")).toBe("Today");
  });

  it("finds exact strings and keeps surrounding spaces", () => {
    expect(translate("Today", "hi")).toBe("आज");
    expect(translate("  Save  ", "mr")).toBe("  सेव्ह करा  ");
  });

  it("matches eyebrows written in capitals", () => {
    expect(translate("PREGNANCY", "hi")).toBe("गर्भावस्था");
  });

  it("keeps trailing punctuation", () => {
    expect(translate("Sample data:", "hi")).toBe("नमूना डेटा:");
    expect(translate("Health summary.", "mr")).toBe("आरोग्य सारांश.");
  });

  it("fills patterns with numbers and names", () => {
    expect(translate("Week 30, day 0", "hi")).toBe("सप्ताह 30, दिन 0");
    expect(translate("2 of 8", "mr")).toBe("8 पैकी 2");
    expect(translate("in 11 days", "hi")).toBe("11 दिन में");
    expect(translate("12 of 23 packed", "hi")).toBe("23 में से 12 पैक");
    expect(translate("Hello, Priya", "mr")).toBe("नमस्कार, Priya");
    expect(translate("Today is day 2 of Priya's period", "hi")).toBe("आज Priya के पीरियड का 2वाँ दिन है");
  });

  it("returns the original when there is no translation", () => {
    expect(translate("Something brand new here", "hi")).toBe("Something brand new here");
    expect(translate("120/78", "hi")).toBe("120/78");
    expect(translate("For pain, I'd like to try", "hi")).toBe("For pain, I'd like to try");
  });

  it("has the same keys in Hindi and Marathi", () => {
    const hi = Object.keys(DICTIONARIES.hi.strings).sort();
    const mr = Object.keys(DICTIONARIES.mr.strings).sort();
    expect(mr).toEqual(hi);
    expect(hi.length).toBeGreaterThan(200);
  });
});
