import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import {
  bookingMessage,
  defaultReplaceBy,
  emailBooking,
  endoFlag,
  isBreakDay,
  packDay,
  painSummary,
  painWord,
  pillDots,
  pillStreak,
  replaceInfo,
  SCREENINGS,
  screeningStatus,
  screeningSummary,
  whatsappBooking,
} from "./care";
import type { Contraception, PainLog } from "./careTypes";

const TODAY = "2026-11-06";

describe("pill pack", () => {
  const pill: Contraception = { method: "combined", packType: 21, packStart: "2026-10-25", pillTime: "21:00", setAt: "2026-09-01" };

  it("counts the day of the pack and wraps every 28 days", () => {
    expect(packDay("2026-10-25", "2026-10-25")).toBe(1);
    expect(packDay("2026-10-25", TODAY)).toBe(13);
    expect(packDay("2026-10-25", "2026-11-21")).toBe(28);
    expect(packDay("2026-10-25", "2026-11-22")).toBe(1);
    expect(packDay("2026-10-25", "2026-10-24")).toBe(28); // before the pack started
  });

  it("has a break week on days 22-28 of a 21-day pack only", () => {
    expect(isBreakDay(pill, "2026-11-15")).toBe(true); // day 22
    expect(isBreakDay(pill, "2026-11-14")).toBe(false); // day 21
    expect(isBreakDay({ ...pill, packType: 28 }, "2026-11-15")).toBe(false);
    expect(isBreakDay({ method: "mini", packStart: "2026-10-25" }, "2026-11-15")).toBe(false);
  });

  it("streaks skip break days, and a missed pill ends the streak", () => {
    const taken: Record<string, boolean> = {};
    for (let i = 0; i < 20; i++) taken[addDays(TODAY, -i)] = true;
    delete taken[addDays(TODAY, -6)]; // one missed pill 6 days ago
    expect(pillStreak(pill, taken, TODAY)).toBe(6);
    // Not taken yet today: count from yesterday
    delete taken[TODAY];
    expect(pillStreak(pill, taken, TODAY)).toBe(5);
    const dots = pillDots(pill, taken, TODAY);
    expect(dots).toHaveLength(14);
    expect(dots[13].state).toBe("today");
    expect(dots[13 - 6].state).toBe("missed");
  });

  it("shows break dots in the break week", () => {
    const p = { ...pill, packStart: "2026-10-14" }; // today is day 24
    expect(pillDots(p, {}, TODAY).slice(-3).every((d) => d.state === "break")).toBe(true);
  });
});

describe("devices", () => {
  it("pre-fills replace-by dates", () => {
    expect(defaultReplaceBy("copper-iud", "2023-11-06")).toBe("2033-11-06");
    expect(defaultReplaceBy("hormonal-iud", "2026-03-12")).toBe("2031-03-12");
    expect(defaultReplaceBy("hormonal-iud", "2026-03-12", 8)).toBe("2034-03-12");
    expect(defaultReplaceBy("implant", "2026-01-10")).toBe("2029-01-10");
    expect(defaultReplaceBy("injection", "2026-10-01")).toBe("2026-12-31");
  });

  it("goes amber at 30 days and counts overdue days", () => {
    expect(replaceInfo("2029-03-12", TODAY).state).toBe("ok");
    expect(replaceInfo(addDays(TODAY, 30), TODAY).state).toBe("soon");
    expect(replaceInfo(addDays(TODAY, 31), TODAY).state).toBe("ok");
    expect(replaceInfo(addDays(TODAY, -4), TODAY)).toEqual({ state: "overdue", days: 4, months: 0 });
  });
});

describe("screenings", () => {
  const pap = SCREENINGS.find((s) => s.id === "pap")!;
  const mammo = SCREENINGS.find((s) => s.id === "mammogram")!;
  const vaccine = SCREENINGS.find((s) => s.id === "hpv-vaccine")!;

  it("works out the status from her age and last date", () => {
    expect(screeningStatus(pap, 27, undefined, TODAY).state).toBe("not-recorded");
    expect(screeningStatus(pap, 27, "2024-11-06", TODAY)).toEqual({ state: "up-to-date", last: "2024-11-06", next: "2027-11-06" });
    expect(screeningStatus(pap, 27, "2023-12-20", TODAY).state).toBe("due-soon"); // next 2026-12-20, 44 days
    expect(screeningStatus(pap, 27, "2023-01-01", TODAY).state).toBe("due-now");
    expect(screeningStatus(mammo, 27, undefined, TODAY).state).toBe("not-at-age");
    expect(screeningStatus(vaccine, 20, "2018-05-01", TODAY).state).toBe("up-to-date"); // once
  });

  it("summarises what's recommended at her age", () => {
    const s = screeningSummary(27, { pap: "2024-10-01", bp: "2025-08-01" }, TODAY);
    // 27: Pap, BP, dental
    expect(s.recommended).toBe(3);
    expect(s.needAttention).toBe(2); // BP due now, dental not recorded
  });
});

describe("endometriosis flag", () => {
  const starts = [addDays(TODAY, -75), addDays(TODAY, -46), addDays(TODAY, -17)];
  const log = (date: string, score: number, extra: Partial<PainLog> = {}): PainLog => ({ date, score, places: ["Lower tummy"], helped: ["Heat pad"], missedDay: false, ...extra });

  it("shows for severe pain in 3 cycles on its own", () => {
    const pain = starts.flatMap((s) => [log(s, 7), log(addDays(s, 1), 8)]);
    const f = endoFlag(pain, starts, TODAY);
    expect(f.severeCycles).toBe(3);
    expect(f.show).toBe(true);
  });

  it("needs 2 reasons otherwise", () => {
    const pain = [log(starts[1], 7), log(starts[2], 8)]; // severe in 2 cycles only
    expect(endoFlag(pain, starts, TODAY).show).toBe(false);
    const more = [...pain, log(addDays(starts[1], 1), 6, { missedDay: true }), log(addDays(starts[2], 1), 6, { missedDay: true })];
    const f = endoFlag(more, starts, TODAY);
    expect(f.show).toBe(true);
    expect(f.reasons).toHaveLength(2);
  });

  it("counts pain with sex or pooing, nothing helped, and pain away from the period", () => {
    const pain = [
      log(addDays(starts[1], 12), 5, { places: ["During or after sex"] }),
      log(addDays(starts[2], 10), 6, { places: ["When pooing"], helped: ["Nothing helped"] }),
      log(addDays(starts[2], 12), 6, { helped: ["Nothing helped"] }),
    ];
    const f = endoFlag(pain, starts, TODAY);
    expect(f.reasons.some((r) => r.includes("sex, pooing or peeing"))).toBe(true);
    expect(f.reasons.some((r) => r.includes("nothing helped"))).toBe(true);
    expect(f.reasons.some((r) => r.includes("away from your period"))).toBe(true);
    expect(f.show).toBe(true);
  });

  it("ignores entries older than 120 days", () => {
    const old = [log(addDays(TODAY, -200), 9, { missedDay: true }), log(addDays(TODAY, -170), 9, { missedDay: true }), log(addDays(TODAY, -140), 9, { missedDay: true })];
    expect(endoFlag(old, [], TODAY).show).toBe(false);
  });

  it("summarises the last 90 days for the doctor", () => {
    const pain = [log(addDays(TODAY, -5), 8, { missedDay: true }), log(addDays(TODAY, -4), 4), log(addDays(TODAY, -100), 9)];
    expect(painSummary(pain, TODAY)).toEqual({ days: 2, average: 6, worst: 8, severeDays: 1, missedDays: 1, places: ["Lower tummy"] });
    expect(painWord(0)).toBe("No pain");
    expect(painWord(8)).toBe("Severe");
    expect(painWord(10)).toBe("Worst possible");
  });
});

describe("booking message", () => {
  const b = { name: "Priya", topic: "PCOS and food", time: "Weekday evenings", how: "Video call", note: "  I'd like help with cravings. ", includeAbout: true, age: 27, stage: "Regular cycle" };

  it("writes a clear message with only what she chose to share", () => {
    const m = bookingMessage(b);
    expect(m).toContain("Hi Neha, I'm Priya.");
    expect(m).toContain("Topic: PCOS and food");
    expect(m).toContain("How: Video call");
    expect(m).toContain("About me: 27 years, Regular cycle");
    expect(m).toContain("Note: I'd like help with cravings.");
    expect(bookingMessage({ ...b, includeAbout: false })).not.toContain("27");
  });

  it("links to Neha's WhatsApp and email with the message encoded", () => {
    const m = bookingMessage(b);
    expect(whatsappBooking(m)).toBe(`https://wa.me/918767327311?text=${encodeURIComponent(m)}`);
    expect(emailBooking(m, b.topic)).toMatch(/^mailto:neharacharla0011@gmail\.com\?subject=Saheli%3A%20PCOS%20and%20food&body=/);
  });
});

describe("Care sample women", async () => {
  const { buildSample } = await import("./sampleData");
  it("Priya: day 13 of a 21-day pack, one missed pill 6 days ago, and the endometriosis flag", () => {
    const d = buildSample("priya", TODAY);
    const c = d.contraception!;
    expect(packDay(c.packStart!, TODAY)).toBe(13);
    expect(d.pillsTaken![addDays(TODAY, -6)]).toBeUndefined();
    expect(pillDots(c, d.pillsTaken!, TODAY).filter((x) => x.state === "missed")).toHaveLength(1);
    expect(d.pain).toHaveLength(12);
    const f = endoFlag(d.pain!, d.periodStarts, TODAY);
    expect(f.show).toBe(true);
    expect(f.severeCycles).toBe(3);
    expect(screeningStatus(SCREENINGS.find((s) => s.id === "bp")!, 27, d.screenings!.bp, TODAY).state).toBe("due-now");
  });
  it("Nisha: copper IUD fitted 3 years ago, about 7 years left", () => {
    const c = buildSample("nisha", TODAY).contraception!;
    expect(c.method).toBe("copper-iud");
    expect(replaceInfo(c.replaceBy!, TODAY).months).toBeGreaterThan(80);
  });
});
