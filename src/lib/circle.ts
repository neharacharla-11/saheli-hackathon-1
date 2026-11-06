/**
 * Circle: what the people she loves can see. Only a schedule of her phases (or her life stage)
 * and a few kind signals worked out on her phone. Never logs, moods, scores, food, journal,
 * chats or intimate symptoms.
 */
import { addDays, daysBetween, parseISODate } from "./dates";
import { phaseForDay, PHASE_LABEL, type Phase } from "./cycle";
import { pregnancyWeek, TRIMESTER_LABEL } from "./pregnancy";
import { weekInfo } from "./pregnancyContent";
import type { CircleMember, ProfileData } from "./types";

export type Relation = "partner" | "parent" | "sister" | "friend";
export type CircleMode = "cycle" | "pregnancy" | "menopause" | "newbaby";

export const RELATIONS: { id: Relation; label: string }[] = [
  { id: "partner", label: "Partner" },
  { id: "parent", label: "Parent" },
  { id: "sister", label: "Sister" },
  { id: "friend", label: "Friend" },
];

export function relationKind(relation: string): Relation {
  const r = relation.toLowerCase();
  if (/partner|husband|wife|boyfriend|girlfriend|fianc/.test(r)) return "partner";
  if (/parent|mother|mom|mum|father|dad|amma|papa|maa/.test(r)) return "parent";
  if (/sister|didi|cousin/.test(r)) return "sister";
  return "friend";
}

/* ---------------- What she shares ---------------- */

export interface ShareOption {
  id: string;
  label: string;
  line: string;
}

export const SHARE_OPTIONS: Record<"cycle" | "pregnancy" | "stage", ShareOption[]> = {
  cycle: [
    { id: "phase", label: "My phase and ways to help", line: "Which phase you're likely in, and small ways they can help." },
    { id: "period", label: "My period days", line: "A note on the days of your period." },
    { id: "helps", label: "What usually helps me", line: "Kind tips from symptoms you log often in each phase. Never the symptoms themselves." },
    { id: "headsup", label: "Heads-ups", line: "A gentle note before your harder days and your period." },
  ],
  pregnancy: [
    { id: "pregnancy", label: "My week and baby's size", line: "Your week, trimester and baby's size." },
    { id: "tips", label: "Ways to help", line: "Tips for this trimester." },
  ],
  stage: [
    { id: "stage", label: "Show my life stage", line: "That you're going through the change, or looking after a new baby." },
    { id: "week", label: "What's been hard this week", line: "Kind tips for up to 3 things that came up often this week." },
    { id: "harder", label: "Tell them when I've had harder days", line: "A nudge to check in, never your moods." },
  ],
};

export function shareGroup(mode: CircleMode): "cycle" | "pregnancy" | "stage" {
  return mode === "cycle" ? "cycle" : mode === "pregnancy" ? "pregnancy" : "stage";
}

export function defaultShares(): string[] {
  return ["phase", "period", "helps", "headsup", "pregnancy", "tips", "stage", "week", "harder"];
}

/* ---------------- The payload (all that leaves her phone) ---------------- */

export interface CirclePayload {
  v: 1;
  her: string;
  to: string;
  relation: Relation;
  at: string; // the day she last opened Saheli (YYYY-MM-DD)
  mode: CircleMode;
  paused?: boolean;
  cycle?: {
    lastStart: string;
    length: number;
    periodLength: number;
    helps?: Partial<Record<Phase, string[]>>;
    headsup?: boolean;
    period?: boolean;
    tips?: boolean;
  };
  pregnancy?: { due: string; tips?: boolean };
  stage?: { babyBorn?: string; week?: string[]; harder?: boolean };
}

/** Symptoms that may become a kind tip. Anything else (including intimate symptoms) is never used. */
const HELP_KEYS: Record<string, string> = {
  cravings: "cravings",
  cramps: "cramps",
  bloating: "bloating",
  fatigue: "tired",
  tired: "tired",
  tiredness: "tired",
  headache: "headache",
  headaches: "headache",
  "back pain": "backpain",
  backache: "backpain",
  "poor sleep": "sleep",
  "trouble sleeping": "sleep",
  insomnia: "sleep",
};

const WEEK_KEYS: Record<string, string> = {
  "hot flashes": "hotflush",
  "hot flushes": "hotflush",
  "night sweats": "nightsweats",
  "poor sleep": "sleep",
  "trouble sleeping": "sleep",
  insomnia: "sleep",
  "joint pain": "joint",
  "mood swings": "moodswings",
  "brain fog": "brainfog",
  fatigue: "tired",
  tired: "tired",
  headache: "headache",
  "back pain": "backpain",
  "body ache": "bodyache",
  "body pain": "bodyache",
};

function keyOf(map: Record<string, string>, symptom: string): string | undefined {
  return map[symptom.trim().toLowerCase()];
}

export function modeFor(data: ProfileData, today: string): CircleMode {
  const p = data.profile;
  if (!p) return "cycle";
  if (p.stage === "pregnancy" && p.dueDate) return "pregnancy";
  if (p.stage === "menopause") return "menopause";
  if (p.stage === "postpartum") {
    const born = p.babyBirthDate;
    const periodsBack = born ? data.periodStarts.some((d) => d > born && d <= today) : false;
    if (!periodsBack) return "newbaby";
  }
  return "cycle";
}

/** For each phase, symptoms she logged on 2 or more days in that phase (whitelisted keys only). */
export function helpsByPhase(data: ProfileData, today: string): Partial<Record<Phase, string[]>> {
  const p = data.profile;
  const starts = [...data.periodStarts].sort();
  if (!p || !starts.length) return {};
  const counts: Partial<Record<Phase, Record<string, number>>> = {};
  for (const [date, log] of Object.entries(data.dayLogs)) {
    if (date > today || !log.symptoms?.length) continue;
    const start = [...starts].reverse().find((s) => s <= date);
    if (!start) continue;
    const day = daysBetween(start, date) + 1;
    if (day > p.cycleLength + 10) continue;
    const phase = phaseForDay(Math.min(day, p.cycleLength), p.cycleLength, p.periodLength);
    for (const s of log.symptoms) {
      const k = keyOf(HELP_KEYS, s);
      if (!k) continue;
      const c = (counts[phase] ??= {});
      c[k] = (c[k] ?? 0) + 1;
    }
  }
  const out: Partial<Record<Phase, string[]>> = {};
  for (const [phase, c] of Object.entries(counts) as [Phase, Record<string, number>][]) {
    const keys = Object.entries(c)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 3);
    if (keys.length) out[phase] = keys;
  }
  return out;
}

interface MenoScoreLike {
  date: string;
  scores: Record<string, number>;
}

function menoKey(item: string): string | undefined {
  const s = item.toLowerCase();
  if (/hot|flush|flash|sweat/.test(s)) return "hotflush";
  if (/sleep/.test(s)) return "sleep";
  if (/joint|muscle/.test(s)) return "joint";
  if (/exhaust|fatigue|tired/.test(s)) return "tired";
  if (/depress|irrit|anx|mood/.test(s)) return "moodswings";
  if (/fog|memory|concentr/.test(s)) return "brainfog";
  return undefined; // sexual, bladder and dryness items are never shared
}

/** Up to 3 symptoms that showed up on 2+ of the last 7 days, plus any item rated severe on her latest weekly score. */
export function weekSignals(data: ProfileData, today: string): string[] {
  const counts: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const log = data.dayLogs[addDays(today, -i)];
    const seen = new Set<string>();
    for (const s of log?.symptoms ?? []) {
      const k = keyOf(WEEK_KEYS, s);
      if (k) seen.add(k);
    }
    seen.forEach((k) => (counts[k] = (counts[k] ?? 0) + 1));
  }
  const keys = Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const scores = ((data as ProfileData & { menoScores?: MenoScoreLike[] }).menoScores ?? [])
    .filter((m) => m.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (scores && daysBetween(scores.date, today) <= 14) {
    for (const [item, v] of Object.entries(scores.scores)) {
      const k = menoKey(item);
      if (k && v >= 3 && !keys.includes(k)) keys.push(k);
    }
  }
  return keys.slice(0, 3);
}

const HARD_MOODS = new Set(["low", "anxious", "irritable", "overwhelmed", "stressed"]);

/** True when 2 of her last 4 logged days had a hard mood or stress 4+. */
export function harderDays(data: ProfileData, today: string): boolean {
  const logged = Object.entries(data.dayLogs)
    .filter(([d, l]) => d <= today && daysBetween(d, today) <= 14 && (l.mood || l.stress))
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 4);
  const hard = logged.filter(([, l]) => (l.mood && HARD_MOODS.has(l.mood)) || (l.stress ?? 0) >= 4).length;
  return hard >= 2;
}

export function buildPayload(data: ProfileData, member: CircleMember, today: string): CirclePayload {
  const p = data.profile;
  const her = (p?.name ?? "").trim().split(/\s+/)[0] || "She";
  const has = (k: string) => member.shares.includes(k);
  const mode = modeFor(data, today);
  const base: CirclePayload = { v: 1, her, to: member.name.trim().split(/\s+/)[0] || member.name, relation: relationKind(member.relation), at: today, mode };
  if (member.paused) return { ...base, paused: true };
  if (mode === "pregnancy" && p?.dueDate) {
    return has("pregnancy") ? { ...base, pregnancy: { due: p.dueDate, tips: has("tips") } } : base;
  }
  if (mode === "menopause" || mode === "newbaby") {
    if (!has("stage")) return base;
    return {
      ...base,
      stage: {
        babyBorn: mode === "newbaby" ? p?.babyBirthDate : undefined,
        week: has("week") ? weekSignals(data, today) : undefined,
        harder: has("harder") ? harderDays(data, today) : undefined,
      },
    };
  }
  const lastStart = [...data.periodStarts].filter((d) => d <= today).sort().pop();
  if (!p || !lastStart || !has("phase")) return base;
  return {
    ...base,
    cycle: {
      lastStart,
      length: p.cycleLength,
      periodLength: p.periodLength,
      helps: has("helps") ? helpsByPhase(data, today) : undefined,
      headsup: has("headsup"),
      period: has("period"),
      tips: true,
    },
  };
}

/** Keep only known fields with safe values, so the server never stores anything else. */
export function sanitizePayload(input: unknown): CirclePayload | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const str = (v: unknown, max = 40) => (typeof v === "string" ? v.slice(0, max) : undefined);
  const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const keys = (v: unknown, allowed: Set<string>) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && allowed.has(x)).slice(0, 4) : undefined;
  const modes: CircleMode[] = ["cycle", "pregnancy", "menopause", "newbaby"];
  const mode = modes.find((m) => m === o.mode);
  const her = str(o.her);
  const to = str(o.to);
  const at = date(o.at);
  if (!mode || !her || !to || !at) return null;
  const relation = RELATIONS.find((r) => r.id === o.relation)?.id ?? "friend";
  const out: CirclePayload = { v: 1, her, to, relation, at, mode };
  if (o.paused === true) return { ...out, paused: true };
  const helpSet = new Set(Object.values(HELP_KEYS));
  const weekSet = new Set(Object.values(WEEK_KEYS));
  const c = o.cycle as Record<string, unknown> | undefined;
  if (c && typeof c === "object" && date(c.lastStart)) {
    const length = Math.round(Number(c.length));
    const periodLength = Math.round(Number(c.periodLength));
    if (length >= 15 && length <= 90 && periodLength >= 1 && periodLength <= 15) {
      const helps: Partial<Record<Phase, string[]>> = {};
      const h = c.helps as Record<string, unknown> | undefined;
      if (h && typeof h === "object") {
        for (const ph of ["period", "follicular", "ovulation", "luteal"] as Phase[]) {
          const k = keys(h[ph], helpSet);
          if (k?.length) helps[ph] = k;
        }
      }
      out.cycle = {
        lastStart: date(c.lastStart)!,
        length,
        periodLength,
        helps: Object.keys(helps).length ? helps : undefined,
        headsup: c.headsup === true,
        period: c.period === true,
        tips: c.tips !== false,
      };
    }
  }
  const pg = o.pregnancy as Record<string, unknown> | undefined;
  if (pg && typeof pg === "object" && date(pg.due)) out.pregnancy = { due: date(pg.due)!, tips: pg.tips === true };
  const st = o.stage as Record<string, unknown> | undefined;
  if (st && typeof st === "object") {
    out.stage = { babyBorn: date(st.babyBorn), week: keys(st.week, weekSet), harder: st.harder === true };
  }
  return out;
}

/* ---------------- Links ---------------- */

export function encodePayload(p: CirclePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePayload(s: string): CirclePayload | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return sanitizePayload(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function circleLink(origin: string, member: CircleMember, payload: CirclePayload): string {
  if (member.token) return `${origin}/c/${member.token}`;
  return `${origin}/c/local#${encodePayload(payload)}`;
}

export function inviteText(her: string, to: string, link: string): string {
  return `Hi ${to}, I've added you to my Circle on Saheli. This private link shows how I may be feeling and small ways you can help. No app or account needed: ${link}`;
}

/* ---------------- What the person sees (worked out on their side, from the schedule) ---------------- */

export interface PhaseCard {
  phase: Phase;
  label: string;
  title: string;
  feeling: string;
  ways: string[];
  tip: string;
}

const PHASE_COPY: Record<Phase, { title: string; feeling: (n: string) => string; ways: string[] }> = {
  period: {
    title: "Rest and warmth",
    feeling: (n) => `${n} may feel tired, crampy or a little low. Her energy is at its lowest.`,
    ways: ["Take one chore off her list today.", "Make her a warm drink or a hot water bottle.", "Plan a quiet evening in."],
  },
  follicular: {
    title: "Fresh energy",
    feeling: (n) => `${n}'s energy is coming back. She may feel lighter, more social and up for plans.`,
    ways: ["Suggest a walk or something new together.", "Back her ideas and plans.", "Make time to really talk."],
  },
  ovulation: {
    title: "At her brightest",
    feeling: (n) => `${n} may feel confident, chatty and full of energy around now.`,
    ways: ["Plan a date, an outing or time with friends.", "Tell her what you appreciate about her.", "Join her for something active."],
  },
  luteal: {
    title: "Slowing down",
    feeling: (n) => `${n} may feel more tired, sensitive or bloated as her period gets closer.`,
    ways: ["Be patient if she's quieter or snappier than usual.", "Keep plans simple and low-pressure.", "Have her favourite snack ready."],
  },
};

const RELATION_TIP: Record<Phase, Record<Relation, string>> = {
  period: {
    partner: "A back rub or simply holding her can help more than words.",
    parent: "A home-cooked meal, like a warm khichdi or soup, says a lot.",
    sister: "Send her a funny message or her favourite show to watch.",
    friend: "Check in with a short message. No need to make plans.",
  },
  follicular: {
    partner: "Say yes to the plan she's been excited about.",
    parent: "Ask about what she's working on. She'll love to share.",
    sister: "A good time for that long-pending catch-up.",
    friend: "Invite her out. She's likely to enjoy it.",
  },
  ovulation: {
    partner: "Dress up a little and take her somewhere she likes.",
    parent: "Tell her you're proud of her.",
    sister: "Plan something fun together this week.",
    friend: "Rope her into a group plan.",
  },
  luteal: {
    partner: "Don't take a short temper personally. Ask what would help.",
    parent: "Offer help without advice. Just listen.",
    sister: "Send something sweet, or a voice note to make her laugh.",
    friend: "A low-key plan at home is perfect right now.",
  },
};

export const HELP_TIPS: Record<string, (n: string) => string> = {
  cravings: (n) => `${n} often craves something sweet around now. A small treat, like dark chocolate or her favourite mithai, can make her day.`,
  cramps: (n) => `${n} often gets cramps around now. A hot water bottle and a quiet evening help a lot.`,
  bloating: (n) => `${n} often feels bloated around now. Light, warm meals and a gentle walk together can help.`,
  tired: (n) => `${n} often feels tired around now. An early night or taking over dinner would mean a lot.`,
  headache: (n) => `${n} sometimes gets headaches around now. Dim lights, water and a little quiet help.`,
  backpain: (n) => `${n}'s back often aches around now. A back rub or a warm compress can bring relief.`,
  sleep: (n) => `${n} often sleeps badly around now. A calm, screen-free evening can help her rest.`,
};

export const WEEK_TIPS: Record<string, { label: string; tip: (n: string) => string }> = {
  hotflush: { label: "Hot flushes", tip: () => "Keep a fan handy, crack a window, and don't fuss if she needs to step out for air." },
  nightsweats: { label: "Night sweats", tip: () => "A cooler room and a spare set of sheets ready can make nights easier." },
  sleep: { label: "Trouble sleeping", tip: (n) => `Let ${n} sleep in when she can, and keep evenings calm.` },
  joint: { label: "Joint pain", tip: () => "Offer to carry the heavy bags, and suggest a gentle walk together." },
  moodswings: { label: "Mood swings", tip: () => "Be patient and don't take it personally. It's hormones, not you." },
  brainfog: { label: "Brain fog", tip: () => "Gently remind her of plans, and never tease about forgetting." },
  tired: { label: "Tiredness", tip: () => "Take a task off her plate this week, without being asked." },
  headache: { label: "Headaches", tip: () => "Quiet time, water and dim lights help." },
  backpain: { label: "Back pain", tip: () => "A warm compress or a back rub can bring relief." },
  bodyache: { label: "Body aches", tip: () => "A warm bath, a massage or simply doing the chores helps." },
};

export function phaseCard(her: string, relation: Relation, phase: Phase): PhaseCard {
  const c = PHASE_COPY[phase];
  return { phase, label: PHASE_LABEL[phase], title: c.title, feeling: c.feeling(her), ways: c.ways, tip: RELATION_TIP[phase][relation] };
}

export interface CycleView {
  day: number;
  phase: Phase;
  periodDay: number | null;
  daysToPeriod: number;
  headsUps: string[];
  helps: string[];
}

/** Project her schedule forward to the viewer's today. */
export function cycleView(p: CirclePayload, today: string): CycleView | null {
  const c = p.cycle;
  if (!c) return null;
  const since = daysBetween(c.lastStart, today);
  if (since < 0) return null;
  const day = (since % c.length) + 1;
  const phase = phaseForDay(day, c.length, c.periodLength);
  const daysToPeriod = c.length - day + 1;
  const headsUps: string[] = [];
  if (c.headsup) {
    if (phase !== "period" && daysToPeriod <= 3) {
      headsUps.push(
        daysToPeriod === 1
          ? `${p.her}'s period is likely to start tomorrow. Keep the evening easy.`
          : `${p.her}'s period is likely to start in about ${daysToPeriod} days. A little extra care goes a long way.`,
      );
    } else if (phase === "luteal" && daysToPeriod <= 7) {
      headsUps.push(`The days before ${p.her}'s period can feel harder. Be extra gentle this week.`);
    }
    if (phase === "period" && day <= 2) headsUps.push(`The first days of her period are often the hardest. Rest matters most today.`);
  }
  return {
    day,
    phase,
    periodDay: c.period && phase === "period" ? day : null,
    daysToPeriod,
    headsUps,
    helps: c.helps?.[phase] ?? [],
  };
}

export const TRIMESTER_TIPS: Record<1 | 2 | 3, string[]> = {
  1: ["She may feel sick and very tired. Take over cooking smells and chores.", "Small snacks and water close by help.", "Go with her to the first scan if you can."],
  2: ["Her energy often comes back. Plan gentle outings together.", "Help set up the baby's space and shop together.", "Feel the kicks with her and talk to the baby."],
  3: ["She may sleep badly and feel heavy. Let her rest.", "Learn the signs of labour and keep the hospital bag ready.", "Handle the visitors and errands so she doesn't have to."],
};

export function pregnancyView(p: CirclePayload, today: string) {
  if (!p.pregnancy) return null;
  const w = pregnancyWeek(p.pregnancy.due, today);
  const info = weekInfo(w.week);
  return {
    week: w.week,
    trimester: w.trimester,
    trimesterLabel: TRIMESTER_LABEL[w.trimester],
    size: info.size,
    daysToGo: w.daysToGo,
    tips: p.pregnancy.tips ? TRIMESTER_TIPS[w.trimester] : [],
  };
}

export function babyAgeLine(born: string, today: string): { age: string; line: string } {
  const days = Math.max(0, daysBetween(born, today));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const age = weeks < 8 ? `baby is ${weeks} week${weeks === 1 ? "" : "s"} old` : `baby is ${months} months old`;
  const line =
    weeks < 6
      ? "Her body is still healing from the birth. Rest and help at home matter most."
      : months < 4
        ? "Nights are often broken and days long. Sleep is precious right now."
        : months < 7
          ? "Baby is more awake and curious, and she may be returning to work or routine."
          : "Baby is on the move. She needs breaks and time for herself too.";
  return { age, line };
}

export const STAGE_COPY: Record<"menopause" | "newbaby", { title: string; line: (n: string) => string; ways: string[]; tip: Record<Relation, string> }> = {
  menopause: {
    title: "Going through the change",
    line: (n) => `${n} is going through perimenopause or menopause. Sleep, mood and energy can change from week to week.`,
    ways: ["Ask how she's sleeping, and let her rest.", "Keep the room cool and a fan close by.", "Join her for a walk or strength workout."],
    tip: {
      partner: "Be patient on hard days. It's hormones, and it passes.",
      parent: "Share what helped you, or just listen.",
      sister: "Swap stories. It helps to know she's not alone.",
      friend: "Plan something calm and fun together.",
    },
  },
  newbaby: {
    title: "Looking after a new baby",
    line: (n) => `${n} is caring for a new baby around the clock, and her body is still recovering.`,
    ways: ["Take a night feed or a morning shift so she can sleep.", "Bring food, do the laundry, wash the bottles.", "Ask how she is, not just how the baby is."],
    tip: {
      partner: "Take the baby for a walk so she gets an hour for herself.",
      parent: "Cook her nourishing food, and hold back on advice.",
      sister: "Visit briefly, bring food, and leave her to rest.",
      friend: "Send a message that doesn't need a reply.",
    },
  },
};

export const HARDER_LINE =
  "She's had a few harder days lately. A kind message, a hug or simply asking 'how are you, really?' can mean a lot.";

/** Weekly signals fade if she hasn't opened Saheli for 7 days. */
export function isStale(p: CirclePayload, today: string): boolean {
  return daysBetween(p.at, today) > 7;
}

export function pageTitle(p: CirclePayload): string {
  if (p.mode === "menopause" || p.mode === "newbaby") return `How ${p.her} is doing lately`;
  if (p.mode === "pregnancy") return `How ${p.her} may be feeling this week`;
  return `How ${p.her} may be feeling today`;
}

export function lastUpdatedLabel(p: CirclePayload, today: string): string {
  const d = daysBetween(p.at, today);
  if (d <= 0) return "Updated today";
  if (d === 1) return "Updated yesterday";
  return `Updated ${parseISODate(p.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
