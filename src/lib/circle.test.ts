import { describe, expect, it } from "vitest";
import {
  buildPayload,
  cycleView,
  decodePayload,
  encodePayload,
  harderDays,
  isStale,
  modeFor,
  sanitizePayload,
  weekSignals,
} from "./circle";
import { addDays } from "./dates";
import { emptyProfileData } from "./store";
import type { CircleMember, Profile, ProfileData } from "./types";

const today = "2026-11-06";
const profile = (patch: Partial<Profile> = {}): Profile => ({
  name: "Priya Sharma",
  country: "IN",
  units: "metric",
  stage: "cycle",
  cycleLength: 29,
  periodLength: 5,
  companionName: "Bestie",
  safety: { pregnant: false, breastfeeding: false, medicalCondition: false, conditions: [], eatingConcerns: false },
  createdAt: "2026-01-01",
  ...patch,
});
const member: CircleMember = {
  id: "m1",
  name: "Rahul Verma",
  relation: "Partner",
  shares: ["phase", "period", "helps", "headsup", "stage", "week", "harder", "pregnancy", "tips"],
  status: "not-shared",
  addedAt: today,
};
const data = (patch: Partial<ProfileData> = {}): ProfileData => ({ ...emptyProfileData(), profile: profile(), ...patch });

describe("cycle payload", () => {
  // lastStart = day 1, today is day 19 (luteal)
  const lastStart = addDays(today, -18);
  const starts = [addDays(lastStart, -58), addDays(lastStart, -29), lastStart];
  const logs: ProfileData["dayLogs"] = {};
  // cravings on luteal days of the two previous cycles; vaginal dryness and discharge must never leak
  logs[addDays(lastStart, -8)] = { symptoms: ["Cravings", "Vaginal dryness"], mood: "low", note: "secret note" };
  logs[addDays(lastStart, -37)] = { symptoms: ["Cravings", "Discharge"] };
  logs[addDays(lastStart, 1)] = { symptoms: ["Cramps"] };

  it("shares only the schedule and whitelisted tips", () => {
    const p = buildPayload(data({ periodStarts: starts, dayLogs: logs }), member, today);
    expect(p.her).toBe("Priya");
    expect(p.to).toBe("Rahul");
    expect(p.relation).toBe("partner");
    expect(p.cycle?.lastStart).toBe(lastStart);
    expect(p.cycle?.helps?.luteal).toEqual(["cravings"]);
    expect(p.cycle?.helps?.period).toBeUndefined(); // cramps only once
    const json = JSON.stringify(p);
    for (const word of ["dryness", "Discharge", "low", "secret", "Sharma", "mood"]) expect(json).not.toContain(word);
  });

  it("works out day, phase and period day on the viewer's side", () => {
    const p = buildPayload(data({ periodStarts: starts, dayLogs: logs }), member, today);
    const v = cycleView(p, today)!;
    expect(v.day).toBe(19);
    expect(v.phase).toBe("luteal");
    expect(v.helps).toEqual(["cravings"]);
    const v2 = cycleView(p, addDays(lastStart, 29 + 1))!;
    expect(v2.periodDay).toBe(2);
  });

  it("respects pause and switches", () => {
    expect(buildPayload(data({ periodStarts: starts }), { ...member, paused: true }, today)).toMatchObject({ paused: true });
    expect(buildPayload(data({ periodStarts: starts, dayLogs: logs }), { ...member, shares: ["phase"] }, today).cycle?.helps).toBeUndefined();
  });
});

describe("life-stage mode", () => {
  const meno = (logs: ProfileData["dayLogs"]) => data({ profile: profile({ name: "Sunita", stage: "menopause" }), dayLogs: logs });

  it("finds symptoms on 2+ of the last 7 days, max 3, never intimate ones", () => {
    const logs: ProfileData["dayLogs"] = {};
    for (const i of [0, 1, 3]) logs[addDays(today, -i)] = { symptoms: ["Hot flashes", "Night sweats", "Vaginal dryness"] };
    logs[addDays(today, -2)] = { symptoms: ["Joint pain", "Brain fog"] };
    logs[addDays(today, -4)] = { symptoms: ["Joint pain"] };
    logs[addDays(today, -10)] = { symptoms: ["Brain fog"] };
    expect(weekSignals(meno(logs), today)).toEqual(["hotflush", "nightsweats", "joint"]);
  });

  it("adds severe items from the latest menopause score", () => {
    const d = { ...meno({}), menoScores: [{ date: addDays(today, -3), scores: { sleepProblems: 3, vaginalDryness: 4, hotFlushes: 1 } }] };
    expect(weekSignals(d, today)).toEqual(["sleep"]);
  });

  it("flags harder days when 2 of the last 4 logged days were hard", () => {
    const logs: ProfileData["dayLogs"] = {
      [today]: { mood: "good" },
      [addDays(today, -1)]: { mood: "anxious" },
      [addDays(today, -3)]: { mood: "okay", stress: 4 },
      [addDays(today, -5)]: { mood: "great" },
    };
    expect(harderDays(meno(logs), today)).toBe(true);
    expect(harderDays(meno({ [today]: { mood: "low" } }), today)).toBe(false);
  });

  it("uses new-baby mode until her periods come back", () => {
    const born = addDays(today, -70);
    const d = data({ profile: profile({ stage: "postpartum", babyBirthDate: born }) });
    expect(modeFor(d, today)).toBe("newbaby");
    expect(modeFor({ ...d, periodStarts: [addDays(today, -5)] }, today)).toBe("cycle");
  });

  it("fades after 7 days without opening Saheli", () => {
    const p = buildPayload(meno({}), member, today);
    expect(isStale(p, addDays(today, 7))).toBe(false);
    expect(isStale(p, addDays(today, 8))).toBe(true);
  });
});

describe("links", () => {
  it("round-trips through the hash and drops unknown fields", () => {
    const p = buildPayload(data({ profile: profile({ name: "Ananya", stage: "pregnancy", dueDate: "2027-01-15" }) }), member, today);
    const back = decodePayload(encodePayload({ ...p, ...({ secret: "x" } as object) }));
    expect(back).toEqual(p);
    expect(JSON.stringify(back)).not.toContain("secret");
  });

  it("rejects junk", () => {
    expect(sanitizePayload({ her: "A" })).toBeNull();
    expect(decodePayload("%%%")).toBeNull();
  });
});

describe("short links", () => {
  it("makes 8 readable characters and always uses the live site", async () => {
    const { shortToken, circleLink, CIRCLE_SITE } = await import("./circle");
    const t = shortToken((n) => Uint8Array.from({ length: n }, (_, i) => i * 37));
    expect(t).toMatch(/^[a-z2-9]{8}$/);
    expect(circleLink({ ...member, token: t }, buildPayload(data(), member, today))).toBe(`${CIRCLE_SITE}/c/${t}`);
    expect(circleLink(member, buildPayload(data(), member, today))).toMatch(/^https:\/\/saheli-hackathon-win\.vercel\.app\/c\/local#/);
  });
});
