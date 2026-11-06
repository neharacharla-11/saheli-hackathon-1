import { addDays } from "./dates";
import { USUAL_SCANS, weekStart } from "./pregnancy";
import type { ProfileData } from "./types";
import type { Appointment, BPReading, KickSession } from "./pregnancyTypes";

/** Made-up pregnancy data for Ananya, 30 weeks. Nothing here is real. */
export function withPregnancySample(key: string, data: ProfileData, today: string): ProfileData {
  if (key !== "ananya" || !data.profile?.dueDate) return data;
  const due = data.profile.dueDate;
  const at = (week: number, extraDays = 0, hour = 10) => {
    const d = addDays(weekStart(due, week), extraDays);
    return `${d}T${String(hour).padStart(2, "0")}:15:00`;
  };

  const appointments: Appointment[] = USUAL_SCANS.map((s, i) => ({
    id: `an-scan-${i}`,
    date: addDays(weekStart(due, s.week), 1),
    title: s.title,
    kind: /scan/i.test(s.title) ? "scan" : "checkup",
    note: s.note,
  }));
  appointments.push(
    { id: "an-plan-1", date: addDays(weekStart(due, 31), 5), title: "Prenatal yoga class", kind: "plan" },
    { id: "an-plan-2", date: addDays(weekStart(due, 34), 6), title: "Godh bharai at home", kind: "plan" },
  );

  const bpPlan: [number, number, number][] = [
    [12, 108, 70], [16, 110, 68], [20, 106, 66], [24, 112, 72], [26, 114, 74], [28, 118, 76], [29, 116, 74], [30, 120, 78],
  ];
  const bp: BPReading[] = bpPlan.map(([w, sys, dia], i) => ({
    id: `an-bp-${i}`,
    at: w === 30 ? `${today}T09:05:00` : at(w, 1),
    sys,
    dia,
    pulse: 82 + (i % 3) * 3,
  }));

  const gain: [number, number][] = [
    [8, 58.3], [10, 58.5], [12, 58.9], [14, 59.3], [16, 60.0], [18, 60.8], [20, 61.6],
    [22, 62.4], [24, 63.2], [26, 64.0], [28, 64.8], [30, 65.5],
  ];
  const pregWeights: Record<string, number> = {};
  for (const [w, kg] of gain) pregWeights[w === 30 ? today : addDays(weekStart(due, w), 2)] = kg;

  const kicks: KickSession[] = [];
  const mins = [24, 31, 19, 27, 22, 35, 18];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i - 1);
    const startMin = 19 * 60 + 10 + (i % 3) * 12;
    const s = new Date(`${d}T00:00:00`);
    s.setMinutes(startMin);
    const e = new Date(s.getTime() + mins[i] * 60_000);
    kicks.push({ id: `an-k-${i}`, start: s.toISOString(), end: e.toISOString(), count: 10 });
  }

  const todayLog = data.dayLogs[today] ?? {};

  return {
    ...data,
    profile: { ...data.profile, heightCm: data.profile.heightCm ?? 160 },
    appointments,
    bp,
    pregWeights,
    kicks,
    dayLogs: { ...data.dayLogs, [today]: { ...todayLog, symptoms: todayLog.symptoms ?? ["backache", "heartburn"] } },
    babyBook: {
      names: [
        { id: "an-n1", name: "Myra", note: "Arjun's favourite", fav: true },
        { id: "an-n2", name: "Aarav", note: "Means peaceful" },
        { id: "an-n3", name: "Anvi", note: "Nani suggested" },
        { id: "an-n4", name: "Kabir" },
      ],
      wishes: [
        { id: "an-w1", from: "Nani", text: "May you grow up surrounded by music, mangoes and so much love.", date: addDays(today, -20) },
        { id: "an-w2", from: "Arjun", text: "I already know your kicks. I can't wait to know your laugh.", date: addDays(today, -9) },
      ],
      letters: [
        {
          id: "an-l1",
          title: "The first time you kicked",
          body: "I was sitting on the balcony with chai when I felt you, a tiny flutter like a bubble. I laughed out loud. Papa ran in thinking something was wrong. Nothing was wrong. Everything was right.",
          date: addDays(weekStart(due, 19), 3),
        },
      ],
    },
    birthPlan: {
      name: "Ananya",
      hospital: "City Women's Hospital",
      doctor: "Dr. Mehta (made-up)",
      partner: "Arjun, and my mother if possible",
      calm: "Soft music, Arjun holding my hand, being told what's happening before it happens.",
      pain: ["Breathing and moving", "Warm water or a shower", "I'll decide on the day"],
      movement: ["Walk and change positions", "Birthing ball"],
      room: ["Dim lights", "My own music"],
      csection: ["My birth partner with me", "Skin-to-skin in theatre if possible", "Each step explained to me"],
      afterBirth: ["Skin-to-skin straight away", "Delayed cord clamping", "Baby stays with me"],
      feeding: "Breastfeeding",
      notes: "I'm vegetarian. Please speak to me in Hindi or English.",
    },
    pregnancy: {
      prePregnancyKg: 58,
      bag: ["y-notes", "y-plan", "y-gown", "y-bras", "y-pads", "y-toiletries", "y-charger", "b-vests", "b-sleepsuits", "b-hat", "b-nappies", "b-swaddle"],
      reminders: { iron: true, calcium: true, kicks: true },
      moodChecks: [{ date: addDays(today, -14), down: 1, interest: 0, anxious: 1, harm: false }],
      ended: null,
    },
  };
}
