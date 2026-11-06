/**
 * Move: structured workouts for each phase and stage, at home or the gym,
 * with a step-by-step list for guided mode.
 */
import type { Phase } from "./cycle";
import { addDays, parseISODate } from "./dates";
import type { LifeStage } from "./types";

export type Place = "home" | "gym";
export type Minutes = 15 | 30 | 45;
export type Mode = Phase | "pregnancy" | "postpartum" | "menopause" | "first-period";

export type MoveIcon =
  | "march" | "squat" | "lunge" | "bridge" | "plank" | "pushup" | "row" | "press" | "hinge"
  | "stretch" | "breathe" | "child" | "catcow" | "bike" | "legpress" | "pulldown" | "stepup"
  | "clam" | "birddog" | "jump" | "carry" | "balance" | "walk" | "deadbug";

export interface Move {
  id: string;
  name: string;
  icon: MoveIcon;
  reps?: number;
  seconds?: number;
  perSide?: boolean;
  how: string;
  easier: string;
  harder: string;
}

/** "12 reps", "10 reps each side", "40 sec", "5 min". */
export function doseLabel(m: Move): string {
  const side = m.perSide ? " each side" : "";
  if (m.reps) return `${m.reps} reps${side}`;
  const s = m.seconds ?? 30;
  return `${s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} sec`}${side}`;
}

const mv = (
  id: string,
  name: string,
  icon: MoveIcon,
  dose: { reps?: number; seconds?: number; perSide?: boolean },
  how: string,
  easier: string,
  harder: string,
): Move => ({ id, name, icon, ...dose, how, easier, harder });

/* ---------------- The moves ---------------- */

const M = {
  // Warm-ups
  march: mv("march", "March with arm swings", "march", { seconds: 60 }, "Lift your knees one at a time and swing your arms.", "Small steps, hold a chair.", "Jog lightly on the spot."),
  rolls: mv("rolls", "Shoulder and neck rolls", "stretch", { seconds: 60 }, "Roll your shoulders back slowly, then tip each ear to your shoulder.", "Seated on a chair.", "Add big arm circles."),
  catcow: mv("catcow", "Cat-cow", "catcow", { seconds: 60 }, "On hands and knees, round your back breathing out, let your belly drop breathing in.", "Seated, hands on knees.", "Pause 2 breaths at each end."),
  hipCircles: mv("hipCircles", "Hip circles", "balance", { seconds: 30, perSide: true }, "Hold a wall and draw slow circles with one knee.", "Smaller circles.", "No hand on the wall."),
  slowSquat: mv("slowSquat", "Slow squats", "squat", { reps: 10 }, "Feet hip-width, sit back like into a chair, stand tall.", "Squat to a chair and stand.", "Pause 2 seconds at the bottom."),
  bikeEasy: mv("bikeEasy", "Bike, easy pace", "bike", { seconds: 300 }, "Easy pace where you can still chat.", "Lower resistance.", "Add a little resistance after 2 minutes."),
  treadWalk: mv("treadWalk", "Treadmill walk", "walk", { seconds: 300 }, "Brisk walk, arms swinging, tall posture.", "Slower pace.", "Raise the incline to 5-8%."),

  // Home strength
  squat: mv("squat", "Bodyweight squat", "squat", { reps: 12 }, "Feet hip-width, chest up, sit back and down, push through your heels.", "Squat to a chair.", "Hold a water bottle or bag at your chest."),
  lunge: mv("lunge", "Reverse lunge", "lunge", { reps: 10, perSide: true }, "Step one foot back, lower both knees, push back up.", "Hold a chair, smaller step.", "Hold a bag of rice in each hand."),
  bridge: mv("bridge", "Glute bridge", "bridge", { reps: 12 }, "On your back, knees bent, squeeze your bottom and lift your hips.", "Smaller lift.", "One leg at a time."),
  pushupWall: mv("pushupWall", "Wall push-up", "pushup", { reps: 10 }, "Hands on a wall, body straight, bend your elbows and push away.", "Stand closer to the wall.", "Hands on a table or the floor on your knees."),
  pushup: mv("pushup", "Knee push-up", "pushup", { reps: 10 }, "Hands under shoulders, knees down, lower your chest and push up.", "Hands on a table.", "Full push-up on your toes."),
  plank: mv("plank", "Plank", "plank", { seconds: 30 }, "Forearms down, body in a straight line, breathe steadily.", "Knees down.", "Lift one foot for 5 seconds at a time."),
  birddog: mv("birddog", "Bird-dog", "birddog", { reps: 8, perSide: true }, "On hands and knees, reach one arm and the opposite leg long, then swap.", "Move only the leg.", "Hold each reach for 3 seconds."),
  bottleRow: mv("bottleRow", "Bent-over row (bottles)", "row", { reps: 12 }, "Hinge forward with a flat back, pull water bottles to your ribs.", "One arm, other hand on a table.", "Use full 2-litre bottles."),
  bottlePress: mv("bottlePress", "Overhead press (bottles)", "press", { reps: 10 }, "Press water bottles from your shoulders up overhead, ribs down.", "Seated on a chair.", "Slow 3-second lowering."),
  goodMorning: mv("goodMorning", "Hip hinge", "hinge", { reps: 12 }, "Soft knees, push your hips back with a flat back, then stand tall.", "Smaller hinge, hands on thighs.", "Hold a heavy bag at your chest."),
  jumpSquat: mv("jumpSquat", "Squat jump", "jump", { seconds: 30 }, "Squat, then jump up and land softly back into a squat.", "Squat and rise onto your toes.", "Go faster, land quietly."),
  skater: mv("skater", "Skater steps", "lunge", { seconds: 40 }, "Step wide side to side, swinging your arms across.", "Step, don't hop.", "Small hops side to side."),
  mountain: mv("mountain", "Mountain climbers", "plank", { seconds: 30 }, "From a high plank, drive your knees in one at a time.", "Hands on a sofa, slow steps.", "Faster, keep hips low."),
  deadbug: mv("deadbug", "Dead bug", "deadbug", { reps: 8, perSide: true }, "On your back, arms up, lower the opposite arm and leg slowly.", "Move only the legs.", "Hold a bottle in your hands."),
  clam: mv("clam", "Side-lying clam", "clam", { reps: 12, perSide: true }, "Lie on your side, knees bent, lift the top knee keeping feet together.", "Smaller lift.", "Add a resistance band above the knees."),
  stepupHome: mv("stepupHome", "Step-up", "stepup", { reps: 10, perSide: true }, "Step up onto a sturdy step, stand tall, step down.", "Lower step, hold a rail.", "Hold a bag of rice."),
  balance: mv("balance", "Single-leg balance", "balance", { seconds: 30, perSide: true }, "Stand on one leg, tall, eyes on a point ahead.", "Fingertip on a wall.", "Close your eyes."),
  heelDrop: mv("heelDrop", "Heel drops", "jump", { reps: 15 }, "Rise onto your toes, then drop onto your heels firmly. Good for bones.", "Rise and lower slowly.", "Small hops instead."),
  pelvicTilt: mv("pelvicTilt", "Standing pelvic tilt", "stretch", { reps: 10 }, "Back against a wall, gently flatten your lower back, then release.", "Smaller tilt.", "Hold each tilt for 3 breaths."),
  kegel: mv("kegel", "Pelvic floor squeeze", "breathe", { reps: 10 }, "Breathe out and gently lift and squeeze as if stopping wee, then fully relax.", "Hold for 2 seconds.", "Hold for 5 seconds."),
  heelSlide: mv("heelSlide", "Heel slides", "deadbug", { reps: 8, perSide: true }, "On your back, knees bent, slowly slide one heel away and back, belly gently in.", "Smaller slide.", "Slide both heels together."),
  walk: mv("walk", "Brisk walk", "walk", { seconds: 300 }, "Walk briskly enough to breathe a little faster.", "Easy pace.", "Find a slope or stairs."),
  dance: mv("dance", "Dance to one song", "jump", { seconds: 180 }, "Put on a song you love and move however feels good.", "Sway and step.", "Big moves, sing along."),
  yogaFlow: mv("yogaFlow", "Gentle yoga flow", "catcow", { seconds: 180 }, "Move slowly between cat-cow, child's pose and a low lunge.", "Stay in child's pose.", "Add a downward dog."),

  // Gym
  gobletSquat: mv("gobletSquat", "Goblet squat (dumbbell)", "squat", { reps: 10 }, "Hold a dumbbell at your chest, sit down between your heels, drive up.", "Lighter dumbbell, squat to a bench.", "Heavier dumbbell, 3-second lowering."),
  legPress: mv("legPress", "Leg press machine", "legpress", { reps: 10 }, "Feet hip-width on the plate, lower until knees reach 90 degrees, press away.", "Lighter weight.", "Heavier, pause at the bottom."),
  legPressLight: mv("legPressLight", "Leg press, light", "legpress", { reps: 12 }, "A light weight you could lift 20 times. Smooth and slow.", "Lighter still.", "Keep it light today."),
  pulldown: mv("pulldown", "Lat pulldown machine", "pulldown", { reps: 10 }, "Pull the bar to your upper chest, elbows down, chest up.", "Lighter weight.", "Heavier, 2-second squeeze."),
  pulldownLight: mv("pulldownLight", "Lat pulldown, light", "pulldown", { reps: 12 }, "A light weight, smooth pulls, relaxed shoulders.", "Lighter still.", "Keep it light today."),
  cableRow: mv("cableRow", "Seated cable row", "row", { reps: 10 }, "Sit tall, pull the handle to your belly, squeeze your shoulder blades.", "Lighter weight.", "Heavier, slow return."),
  cableRowLight: mv("cableRowLight", "Seated row, light", "row", { reps: 12 }, "Sit tall and pull gently to your belly. No straining.", "Lighter still.", "Keep it light today."),
  rdl: mv("rdl", "Romanian deadlift (dumbbells)", "hinge", { reps: 10 }, "Dumbbells by your thighs, push hips back with a flat back, stand tall.", "Lighter dumbbells, smaller range.", "Heavier, single-leg."),
  chestPress: mv("chestPress", "Chest press machine", "pushup", { reps: 10 }, "Handles at chest height, press forward, control the way back.", "Lighter weight.", "Heavier, 3-second return."),
  dbBench: mv("dbBench", "Dumbbell bench press", "press", { reps: 8 }, "Lie on a bench, press dumbbells up from your chest, lower slowly.", "Lighter dumbbells.", "Heavier for 6 reps."),
  dbShoulder: mv("dbShoulder", "Seated dumbbell shoulder press", "press", { reps: 10 }, "Sit tall with back support, press dumbbells overhead, ribs down.", "Lighter dumbbells.", "Standing, heavier."),
  hipThrust: mv("hipThrust", "Hip thrust (machine or barbell)", "bridge", { reps: 10 }, "Upper back on a bench, drive your hips up and squeeze at the top.", "Bodyweight only.", "Heavier, pause 2 seconds."),
  walkLunge: mv("walkLunge", "Walking lunge (dumbbells)", "lunge", { reps: 8, perSide: true }, "Long steps, back knee towards the floor, tall chest.", "No dumbbells, hold a rail.", "Heavier dumbbells."),
  stepupDb: mv("stepupDb", "Dumbbell step-up", "stepup", { reps: 8, perSide: true }, "Step onto a box with dumbbells in hand, stand tall, step down slowly.", "Lower box, no weight.", "Higher box, heavier."),
  rower: mv("rower", "Rowing machine, hard", "row", { seconds: 60 }, "Push with your legs, then pull. Hard but steady for 60 seconds.", "Easy pace.", "Sprint the last 15 seconds."),
  legCurl: mv("legCurl", "Leg curl machine", "bridge", { reps: 12 }, "Curl the pad towards you slowly, control the way back.", "Lighter weight.", "One leg at a time."),
  kickback: mv("kickback", "Cable glute kickback", "birddog", { reps: 12, perSide: true }, "Strap on one ankle, kick back and up, squeezing your bottom.", "Lighter weight.", "Pause at the top."),
  inclineWalk: mv("inclineWalk", "Incline treadmill walk", "walk", { seconds: 300 }, "Incline 6-10%, a pace where you can talk in short sentences.", "Lower incline.", "Steeper incline."),
  farmer: mv("farmer", "Farmer's carry", "carry", { seconds: 40 }, "Hold a heavy dumbbell in each hand and walk tall and slow.", "Lighter dumbbells.", "Heavier, or one hand only."),
  supportedSquat: mv("supportedSquat", "Squat to bench", "squat", { reps: 10 }, "Sit back to a bench and stand up, holding a light dumbbell if comfortable.", "Hold a rail.", "Keep it gentle."),
  ballBridge: mv("ballBridge", "Glute bridge on a mat", "bridge", { reps: 10 }, "Knees bent, breathe out and lift your hips gently.", "Smaller lift.", "Hold 3 seconds at the top."),

  // Cool-downs
  child: mv("child", "Child's pose", "child", { seconds: 60 }, "Kneel, sit back to your heels, rest your forehead down.", "Pillow under your belly.", "Walk your hands to each side."),
  kneeHug: mv("kneeHug", "Lying knee hug", "deadbug", { seconds: 60 }, "On your back, hug both knees in and rock side to side.", "One knee at a time.", "Add slow circles."),
  breathe: mv("breathe", "Slow belly breathing", "breathe", { seconds: 60 }, "One hand on your belly. In for 4, out for 6.", "Just breathe naturally.", "Out for 8."),
  hamstring: mv("hamstring", "Hamstring stretch", "stretch", { seconds: 30, perSide: true }, "Heel forward, toes up, hinge from your hips.", "Smaller hinge.", "Reach for your toes."),
  quad: mv("quad", "Quad stretch", "stretch", { seconds: 30, perSide: true }, "Hold a wall, bend one knee and hold your ankle behind you.", "Use a strap or towel.", "Tuck your pelvis under."),
  chest: mv("chest", "Chest opener", "stretch", { seconds: 30 }, "Clasp your hands behind you and lift them gently.", "Hands on your lower back.", "Hold a doorway and lean."),
  sideStretch: mv("sideStretch", "Seated side stretch", "stretch", { seconds: 30, perSide: true }, "Sit tall, reach one arm up and over.", "Hand on your head.", "Reach further."),
} satisfies Record<string, Move>;

type MoveId = keyof typeof M;

interface Template {
  title: Record<Place, string>;
  line: string;
  level: string;
  gentle?: boolean;
  warmup: MoveId[];
  main: Record<Place, MoveId[]>;
  cooldown: MoveId[];
  note?: string;
}

const TEMPLATES: Record<Mode, Template> = {
  period: {
    title: { home: "Gentle yoga and a slow walk", gym: "Easy cardio and light machines" },
    line: "Soft movement eases cramps and lifts your mood. Go slowly and stop if anything hurts.",
    level: "Gentle",
    gentle: true,
    warmup: ["rolls", "catcow", "march"],
    main: {
      home: ["yogaFlow", "bridge", "birddog", "walk", "clam", "pelvicTilt"],
      gym: ["bikeEasy", "cableRowLight", "legPressLight", "pulldownLight", "ballBridge", "treadWalk"],
    },
    cooldown: ["child", "kneeHug", "breathe"],
  },
  follicular: {
    title: { home: "Full-body strength at home", gym: "Strength builder" },
    line: "Your energy is rising, so this is a great week to build strength and try something a little harder.",
    level: "Beginner to intermediate",
    warmup: ["march", "slowSquat", "hipCircles"],
    main: {
      home: ["squat", "pushup", "lunge", "bottleRow", "bridge", "plank"],
      gym: ["gobletSquat", "pulldown", "rdl", "chestPress", "walkLunge", "plank"],
    },
    cooldown: ["hamstring", "quad", "chest"],
  },
  ovulation: {
    title: { home: "Power intervals at home", gym: "Heavy strength and intervals" },
    line: "You're usually at your strongest now. Heavier lifts and short bursts feel good. Warm up well to protect your joints.",
    level: "Intermediate",
    warmup: ["march", "slowSquat", "hipCircles"],
    main: {
      home: ["jumpSquat", "pushup", "skater", "lunge", "mountain", "bridge"],
      gym: ["legPress", "dbBench", "hipThrust", "cableRow", "rower", "stepupDb"],
    },
    cooldown: ["hamstring", "quad", "chest"],
  },
  luteal: {
    title: { home: "Steady strength and Pilates", gym: "Steady strength" },
    line: "Energy dips a little before your period. Moderate strength and slow core work keep you strong without wearing you out.",
    level: "Beginner",
    warmup: ["march", "catcow", "hipCircles"],
    main: {
      home: ["squat", "bridge", "birddog", "pushupWall", "deadbug", "clam"],
      gym: ["inclineWalk", "legCurl", "dbShoulder", "kickback", "pulldown", "deadbug"],
    },
    cooldown: ["child", "hamstring", "breathe"],
  },
  pregnancy: {
    title: { home: "Gentle pregnancy strength", gym: "Gentle pregnancy strength" },
    line: "Safe, steady movement for pregnancy. Check with your doctor first, keep a pace where you can talk, and stop if anything feels wrong.",
    level: "Gentle",
    gentle: true,
    warmup: ["march", "rolls", "catcow"],
    main: {
      home: ["supportedSquat", "pushupWall", "clam", "pelvicTilt", "kegel", "walk"],
      gym: ["bikeEasy", "cableRowLight", "dbShoulder", "supportedSquat", "clam", "kegel"],
    },
    cooldown: ["sideStretch", "child", "breathe"],
    note: "Avoid lying flat on your back after the first trimester, contact sports and anything with a risk of falling. Stop and call your doctor if you have bleeding, dizziness, chest pain or fluid leaking.",
  },
  postpartum: {
    title: { home: "Gentle recovery after birth", gym: "Gentle recovery after birth" },
    line: "Start with breathing and your pelvic floor. Most women wait for their 6-week check before anything harder. Go slowly and be kind to yourself.",
    level: "Recovery",
    gentle: true,
    warmup: ["breathe", "rolls", "march"],
    main: {
      home: ["kegel", "heelSlide", "ballBridge", "pelvicTilt", "pushupWall", "walk"],
      gym: ["treadWalk", "kegel", "cableRowLight", "ballBridge", "heelSlide", "supportedSquat"],
    },
    cooldown: ["child", "kneeHug", "breathe"],
    note: "Call your doctor if you have heavy bleeding, pain in your belly, or a bulge or heaviness down below. Wait for your doctor's okay after a caesarean.",
  },
  menopause: {
    title: { home: "Strength for strong bones", gym: "Strength for bones and heart" },
    line: "Lifting and gentle impact protect your bones, heart and mood after 45. Balance work helps you stay steady.",
    level: "Beginner",
    warmup: ["march", "slowSquat", "hipCircles"],
    main: {
      home: ["squat", "stepupHome", "bottleRow", "heelDrop", "balance", "bottlePress"],
      gym: ["legPress", "stepupDb", "cableRow", "chestPress", "farmer", "balance"],
    },
    cooldown: ["hamstring", "chest", "breathe"],
  },
  "first-period": {
    title: { home: "Feel-good stretches and play", gym: "Feel-good stretches and play" },
    line: "Moving your body can ease cramps and help you feel happier. Pick what feels fun today.",
    level: "Easy",
    gentle: true,
    warmup: ["march", "rolls", "catcow"],
    main: {
      home: ["dance", "bridge", "birddog", "yogaFlow", "balance", "walk"],
      gym: ["dance", "bridge", "birddog", "yogaFlow", "balance", "walk"],
    },
    cooldown: ["child", "kneeHug", "breathe"],
  },
};

export const MODE_LABEL: Record<Mode, string> = {
  period: "Period",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  pregnancy: "Pregnancy",
  postpartum: "After birth",
  menopause: "Menopause",
  "first-period": "First periods",
};

export const PHASE_MODES: Phase[] = ["period", "follicular", "ovulation", "luteal"];

/** Her default workout mode: stage first, then cycle phase. */
export function modeFor(stage: LifeStage | undefined, phase: Phase | null): Mode {
  if (stage === "pregnancy" || stage === "postpartum" || stage === "menopause" || stage === "first-period") return stage;
  return phase ?? "follicular";
}

/** Can she browse other phases' workouts? Not in pregnancy, after birth, menopause or first periods. */
export function canBrowsePhases(stage: LifeStage | undefined): boolean {
  return !stage || ["cycle", "pcos", "ttc"].includes(stage);
}

const LAYOUT: Record<Minutes, { count: number; rounds: number; restSec: number; warm: number; cool: number }> = {
  15: { count: 3, rounds: 2, restSec: 30, warm: 2, cool: 2 },
  30: { count: 4, rounds: 3, restSec: 40, warm: 3, cool: 3 },
  45: { count: 6, rounds: 3, restSec: 45, warm: 3, cool: 3 },
};

export interface Session {
  key: string;
  mode: Mode;
  place: Place;
  minutes: Minutes;
  title: string;
  line: string;
  level: string;
  gentle: boolean;
  warmup: Move[];
  main: Move[];
  rounds: number;
  restSec: number;
  cooldown: Move[];
  note?: string;
}

export function buildSession(mode: Mode, place: Place, minutes: Minutes): Session {
  const t = TEMPLATES[mode];
  const l = LAYOUT[minutes];
  const gentle = !!t.gentle;
  return {
    key: `${mode}-${place}-${minutes}`,
    mode,
    place,
    minutes,
    title: t.title[place],
    line: t.line,
    level: t.level,
    gentle,
    warmup: t.warmup.slice(0, l.warm).map((id) => M[id]),
    main: t.main[place].slice(0, l.count).map((id) => M[id]),
    rounds: gentle ? Math.min(l.rounds, 2) : l.rounds,
    restSec: gentle ? l.restSec + 15 : l.restSec,
    cooldown: t.cooldown.slice(0, l.cool).map((id) => M[id]),
    note: t.note,
  };
}

/* ---------------- Guided mode ---------------- */

export type Section = "Warm-up" | "Main" | "Cool-down";

export interface GuidedStep {
  kind: "move" | "rest";
  section: Section;
  move: Move; // for rest: the move coming next
  round?: number;
  rounds?: number;
  /** Countdown length for timed moves and rests (each side included). */
  seconds?: number;
  reps?: number;
}

/** Every step in order: warm-up, main rounds with rests between moves, cool-down. */
export function guidedSteps(s: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const timed = (m: Move) => (m.reps ? undefined : (m.seconds ?? 30) * (m.perSide ? 2 : 1));
  for (const m of s.warmup) steps.push({ kind: "move", section: "Warm-up", move: m, seconds: timed(m), reps: m.reps });
  for (let r = 1; r <= s.rounds; r++) {
    s.main.forEach((m, i) => {
      const last = r === s.rounds && i === s.main.length - 1;
      steps.push({ kind: "move", section: "Main", move: m, round: r, rounds: s.rounds, seconds: timed(m), reps: m.reps });
      if (!last) {
        const next = s.main[(i + 1) % s.main.length];
        steps.push({ kind: "rest", section: "Main", move: next, round: i + 1 === s.main.length ? r + 1 : r, rounds: s.rounds, seconds: s.restSec });
      }
    });
  }
  for (const m of s.cooldown) steps.push({ kind: "move", section: "Cool-down", move: m, seconds: timed(m), reps: m.reps });
  return steps;
}

/* ---------------- Workouts she has done ---------------- */

export interface WorkoutDone {
  date: string;
  at: string;
  minutes: number;
  title: string;
  mode: string;
  place: Place;
}

/** Start of her week (Sunday, like the calendars). */
export function weekStart(today: string): string {
  return addDays(today, -parseISODate(today).getDay());
}

export function workoutsThisWeek(done: WorkoutDone[] | undefined, today: string): number {
  const start = weekStart(today);
  return (done ?? []).filter((w) => w.date >= start && w.date <= today).length;
}

/** Weeks in a row (ending this week, or last week if none yet this week) with at least one workout. */
export function weekStreak(done: WorkoutDone[] | undefined, today: string): number {
  const weeks = new Set((done ?? []).map((w) => weekStart(w.date)));
  let start = weekStart(today);
  if (!weeks.has(start)) start = addDays(start, -7);
  let n = 0;
  while (weeks.has(start) && n < 520) {
    n++;
    start = addDays(start, -7);
  }
  return n;
}
