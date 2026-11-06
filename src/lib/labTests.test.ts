import { describe, expect, it } from "vitest";
import { labStatus, latestResults, matchLabName, toOurUnit, trendText, reportContextLines, rangeText } from "./labTests";

describe("labStatus", () => {
  it("flags low, borderline and normal values", () => {
    expect(labStatus("haemoglobin", 9.9)).toBe("low");
    expect(labStatus("haemoglobin", 11.2)).toBe("a-little-low");
    expect(labStatus("haemoglobin", 13)).toBe("normal");
    expect(labStatus("ferritin", 8)).toBe("low");
    expect(labStatus("ferritin", 22)).toBe("a-little-low");
    expect(labStatus("vitaminD", 14)).toBe("low");
    expect(labStatus("vitaminD", 25)).toBe("a-little-low");
    expect(labStatus("hba1c", 6.0)).toBe("a-little-high");
    expect(labStatus("hba1c", 7.2)).toBe("high");
    expect(labStatus("tsh", 9.8)).toBe("a-little-high");
    expect(labStatus("hdl", 95)).toBe("normal");
    expect(labStatus("hdl", 44)).toBe("low");
  });
});

describe("names and units", () => {
  it("matches printed names without mixing up Hb and HbA1c", () => {
    expect(matchLabName("Hemoglobin (Hb)")).toBe("haemoglobin");
    expect(matchLabName("HbA1c")).toBe("hba1c");
    expect(matchLabName("Glycated Haemoglobin")).toBe("hba1c");
    expect(matchLabName("25-OH Vitamin D")).toBe("vitaminD");
    expect(matchLabName("HDL Cholesterol")).toBe("hdl");
    expect(matchLabName("Serum Ferritin")).toBe("ferritin");
    expect(matchLabName("MCV")).toBeUndefined();
  });

  it("converts common units to ours", () => {
    expect(toOurUnit("vitaminD", 50, "nmol/L")).toBeCloseTo(20.03, 1);
    expect(toOurUnit("platelets", 2.5, "lakh/cumm")).toBe(250);
    expect(toOurUnit("fastingSugar", 5.5, "mmol/L")).toBe(99);
    expect(toOurUnit("hba1c", 53, "mmol/mol")).toBeCloseTo(7.0, 1);
    expect(toOurUnit("haemoglobin", 120, "g/L")).toBe(12);
    expect(toOurUnit("tsh", 2.1, "µIU/mL")).toBe(2.1);
    expect(toOurUnit("haemoglobin", 11, "gm/dL")).toBe(11);
    expect(toOurUnit("ferritin", 10, "furlongs")).toBeUndefined();
  });

  it("writes ranges in words", () => {
    expect(rangeText("haemoglobin")).toBe("12 to 15.5 g/dL");
    expect(rangeText("ldl")).toBe("under 130 mg/dL");
    expect(rangeText("hdl")).toBe("50 or more mg/dL");
  });
});

describe("latest results and trends", () => {
  const reports = [
    { id: "a", date: "2026-07-09", values: { haemoglobin: 9.9, ferritin: 8 } },
    { id: "b", date: "2026-10-07", values: { haemoglobin: 11.2 } },
  ];
  it("keeps the newest value with history", () => {
    const latest = latestResults(reports);
    const hb = latest.find((r) => r.key === "haemoglobin")!;
    expect(hb.value).toBe(11.2);
    expect(hb.history).toEqual([{ value: 9.9, date: "2026-07-09" }]);
    expect(latest.find((r) => r.key === "ferritin")!.value).toBe(8);
  });
  it("describes the trend in plain words", () => {
    const hb = latestResults(reports).find((r) => r.key === "haemoglobin")!;
    expect(trendText(hb)).toBe("Up from 9.9 since Jul 2026 · getting better");
  });
  it("calls a rising HbA1c worth watching and a falling one getting better", () => {
    const up = latestResults([{ id: "a", date: "2026-01-01", values: { hba1c: 6.0 } }, { id: "b", date: "2026-05-01", values: { hba1c: 6.8 } }])[0];
    expect(trendText(up)).toContain("worth watching");
    const down = latestResults([{ id: "a", date: "2026-01-01", values: { hba1c: 8.1 } }, { id: "b", date: "2026-05-01", values: { hba1c: 7.2 } }])[0];
    expect(trendText(down)).toBe("Down from 8.1 since Jan 2026 · getting better");
  });
  it("gives the chat a line per result", () => {
    expect(reportContextLines(reports)[0]).toContain("Haemoglobin: 11.2 g/dL");
  });
});
