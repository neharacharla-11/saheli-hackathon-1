import { describe, expect, it } from "vitest";
import { CSV_TEMPLATE, combineDaily, guessDayOrder, latestWeight, parseCsv, parseDateCell, parseHealthCsv, sleepFactor } from "./healthCsv";
import { finishApple, mergePeriodStarts, newAppleState, periodStartsFromDays, readAppleChunk } from "./appleHealth";

const today = "2026-11-06";

describe("parseDateCell", () => {
  it("reads many date styles", () => {
    expect(parseDateCell("2026-10-07")).toBe("2026-10-07");
    expect(parseDateCell("2026/10/07 08:15")).toBe("2026-10-07");
    expect(parseDateCell("07/10/2026")).toBe("2026-10-07");
    expect(parseDateCell("07/10/2026", "mdy")).toBe("2026-07-10");
    expect(parseDateCell("10/25/2026")).toBe("2026-10-25");
    expect(parseDateCell("25.10.2026")).toBe("2026-10-25");
    expect(parseDateCell("Oct 7, 2026")).toBe("2026-10-07");
    expect(parseDateCell("7 October 2026")).toBe("2026-10-07");
    expect(parseDateCell(String(new Date(2026, 9, 7, 12).getTime()))).toBe("2026-10-07");
    expect(parseDateCell(String(Math.floor(new Date(2026, 9, 7, 12).getTime() / 1000)))).toBe("2026-10-07");
    expect(parseDateCell("31/02/2026")).toBeNull();
    expect(parseDateCell("hello")).toBeNull();
  });

  it("guesses month-first only when the day is over 12", () => {
    expect(guessDayOrder(["10/03/2026", "10/25/2026"])).toBe("mdy");
    expect(guessDayOrder(["25/10/2026"])).toBe("dmy");
    expect(guessDayOrder(["01/02/2026"])).toBe("dmy");
  });
});

describe("parseCsv", () => {
  it("handles quotes, semicolons and CRLF", () => {
    expect(parseCsv('a,b\r\n"1,5","say ""hi"""\r\n')).toEqual([["a", "b"], ["1,5", 'say "hi"']]);
    expect(parseCsv("date;steps\n2026-10-01;100\n")).toEqual([["date", "steps"], ["2026-10-01", "100"]]);
  });
});

describe("parseHealthCsv", () => {
  it("reads our template", () => {
    const r = parseHealthCsv(CSV_TEMPLATE, today);
    expect(r.steps).toEqual({ "2026-11-01": 7421, "2026-11-02": 5310 });
    expect(r.sleepMin).toEqual({ "2026-11-01": 450, "2026-11-02": 405 });
    expect(r.weight).toEqual({ "2026-11-01": 62.1 });
  });

  it("reads Google Fit daily activity metrics (sleep in ms, weight in kg)", () => {
    const csv = `Date,Move Minutes count,Calories (kcal),Distance (m),Step count,Sleep duration (ms),Average weight (kg)
2026-10-30,40,1800,5200,6810,25200000,61.8
2026-10-31,22,1700,3000,4102,,
`;
    const r = parseHealthCsv(csv, today);
    expect(r.found.steps).toBe("Step count");
    expect(r.steps["2026-10-30"]).toBe(6810);
    expect(r.sleepMin["2026-10-30"]).toBe(420);
    expect(r.weight["2026-10-30"]).toBe(61.8);
  });

  it("reads Samsung Health files with a metadata first line and ms timestamps", () => {
    const t1 = new Date(2026, 9, 20, 9).getTime();
    const t2 = new Date(2026, 9, 21, 9).getTime();
    const csv = `com.samsung.health.step_daily_trend,6302,4
create_time,binning_data,count,speed,day_time,distance
2026-10-20 23:00:00.000,,8123,1.2,${t1},6000
2026-10-21 23:00:00.000,,5021,1.1,${t2},4000
`;
    const r = parseHealthCsv(csv, today, "com.samsung.health.step_daily_trend.20261106.csv");
    expect(r.found.steps).toBe("count");
    expect(r.steps).toEqual({ "2026-10-20": 8123, "2026-10-21": 5021 });
  });

  it("reads Fitbit sleep in minutes and weight in pounds, summing per day", () => {
    const csv = `Start Time,End Time,Minutes Asleep,Minutes Awake
"10/25/2026 11:10PM","10/26/2026 6:40AM","400","30"
"10/25/2026 2:00PM","10/25/2026 2:40PM","35","5"
`;
    const r = parseHealthCsv(csv, today);
    expect(r.sleepMin["2026-10-25"]).toBe(435);
    const w = parseHealthCsv("Date,Weight (lb)\n10/03/2026,137\n10/20/2026,136.5\n", today);
    expect(w.weight["2026-10-03"]).toBe(62.1);
    expect(latestWeight(w.weight)).toEqual({ date: "2026-10-20", kg: 61.9 });
  });

  it("works out sleep units when the header has none", () => {
    expect(sleepFactor("sleep", [7, 6.5, 8])).toBe(60);
    expect(sleepFactor("sleep", [420, 390])).toBe(1);
    expect(sleepFactor("Sleep (h)", [])).toBe(60);
    expect(sleepFactor("sleep_seconds", [])).toBe(1 / 60);
  });

  it("keeps only the last year and skips junk", () => {
    const r = parseHealthCsv("date,steps\n2025-01-01,5000\n2026-11-05,abc\n2026-11-05,9000\n2027-01-01,10\n", today);
    expect(r.steps).toEqual({ "2026-11-05": 9000 });
    expect(r.skipped).toBe(3);
  });

  it("returns nothing for files without useful columns", () => {
    expect(parseHealthCsv("name,colour\nA,blue\n", today).rows).toBe(0);
    expect(parseHealthCsv("", today).rows).toBe(0);
  });

  it("combines files keeping the larger daily value", () => {
    const c = combineDaily([
      { steps: { a: 100 }, sleepMin: {}, weight: { a: 60 } },
      { steps: { a: 300, b: 5 }, sleepMin: { a: 400 }, weight: {} },
    ]);
    expect(c).toEqual({ steps: { a: 300, b: 5 }, sleepMin: { a: 400 }, weight: { a: 60 } });
  });
});

describe("Apple Health", () => {
  const xml = `<?xml version="1.0"?>
<HealthData>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Priya's iPhone" unit="count" startDate="2026-11-01 08:00:00 +0530" endDate="2026-11-01 08:10:00 +0530" value="1200"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Priya's iPhone" unit="count" startDate="2026-11-01 18:00:00 +0530" endDate="2026-11-01 18:10:00 +0530" value="800"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Priya's Watch" unit="count" startDate="2026-11-01 08:00:00 +0530" endDate="2026-11-01 08:10:00 +0530" value="2500"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Watch" startDate="2026-11-01 23:00:00 +0530" endDate="2026-11-02 03:00:00 +0530" value="HKCategoryValueSleepAnalysisAsleepCore"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Watch" startDate="2026-11-02 03:00:00 +0530" endDate="2026-11-02 06:30:00 +0530" value="HKCategoryValueSleepAnalysisAsleepDeep"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Watch" startDate="2026-11-01 22:30:00 +0530" endDate="2026-11-02 07:00:00 +0530" value="HKCategoryValueSleepAnalysisInBed"/>
 <Record type="HKCategoryTypeIdentifierMenstrualFlow" sourceName="Health" startDate="2026-10-18 00:00:00 +0530" endDate="2026-10-18 00:00:00 +0530" value="HKCategoryValueMenstrualFlowHeavy"/>
 <Record type="HKCategoryTypeIdentifierMenstrualFlow" sourceName="Health" startDate="2026-10-19 00:00:00 +0530" endDate="2026-10-19 00:00:00 +0530" value="HKCategoryValueMenstrualFlowMedium"/>
 <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" unit="lb" startDate="2026-11-03 07:00:00 +0530" endDate="2026-11-03 07:00:00 +0530" value="137"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Old" unit="count" startDate="2024-11-01 08:00:00 +0530" endDate="2024-11-01 08:10:00 +0530" value="99"/>
</HealthData>`;

  it("reads records across chunk boundaries and avoids double counting", () => {
    const st = newAppleState(today);
    let carry = "";
    for (let i = 0; i < xml.length; i += 37) carry = readAppleChunk(st, carry, xml.slice(i, i + 37));
    readAppleChunk(st, carry, "\n");
    const r = finishApple(st);
    expect(r.steps).toEqual({ "2026-11-01": 2500 });
    expect(r.sleepMin).toEqual({ "2026-11-02": 450 });
    expect(r.periodDays).toEqual(["2026-10-18", "2026-10-19"]);
    expect(r.weight).toEqual({ "2026-11-03": 62.1 });
  });

  it("turns period days into starts and merges with hers", () => {
    expect(periodStartsFromDays(["2026-09-20", "2026-09-21", "2026-09-23", "2026-10-18", "2026-10-19"])).toEqual(["2026-09-20", "2026-10-18"]);
    expect(mergePeriodStarts(["2026-10-17"], ["2026-09-20", "2026-10-18"])).toEqual(["2026-09-20", "2026-10-17"]);
  });
});
