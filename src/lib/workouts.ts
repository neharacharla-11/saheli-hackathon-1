import type { Phase } from "./cycle";
import type { LifeStage } from "./types";

export type Place = "home" | "gym";
export type Minutes = 15 | 30 | 45;

export interface Exercise {
  name: string;
  dose: string; // "12 reps", "40 seconds", "2 minutes"
  how: string; // one or two clear sentences
}

export interface Workout {
  key: string;
  title: string;
  line: string;
  level: string;
  warmup: Exercise[];
  main: Exercise[];
  rounds: number;
  rest: string;
  cooldown: Exercise[];
  note?: string;
}

type Mode = Phase | "pregnancy" | "postpartum" | "menopause" | "first-period";

interface Template {
  title: Record<Place, string>;
  line: string;
  level: string;
  warmup: Exercise[];
  main: Record<Place, Exercise[]>;
  cooldown: Exercise[];
  note?: string;
}

const E = (name: string, dose: string, how: string): Exercise => ({ name, dose, how });

const GENTLE_WARMUP = [
  E("Neck and shoulder rolls", "1 minute", "Roll your shoulders back slowly 10 times, then tip your ear towards each shoulder."),
  E("Cat-cow", "1 minute", "On hands and knees, round your back as you breathe out, then let your belly drop as you breathe in."),
  E("Marching on the spot", "1 minute", "Lift your knees one at a time and swing your arms gently."),
];
const ACTIVE_WARMUP = [
  E("Brisk march with arm circles", "1 minute", "March on the spot and circle your arms forwards, then backwards."),
  E("Bodyweight squats, slow", "10 reps", "Feet hip-width apart, sit back like into a chair, stand tall again."),
  E("Hip openers", "1 minute", "Stand on one leg holding a wall, draw big circles with the other knee. Swap sides."),
];
const CALM_COOLDOWN = [
  E("Child's pose", "1 minute", "Kneel, sit back on your heels and rest your forehead down, arms long in front."),
  E("Lying knee hug", "1 minute", "On your back, hug both knees to your chest and rock gently side to side."),
  E("Slow belly breathing", "1 minute", "One hand on your belly. Breathe in for 4, out for 6."),
];
const STRETCH_COOLDOWN = [
  E("Standing hamstring stretch", "30 seconds each side", "Heel forward on the floor, toes up, hinge from the hips until you feel the back of the leg."),
  E("Quad stretch", "30 seconds each side", "Hold a wall, bend one knee and hold your ankle behind you."),
  E("Chest opener", "30 seconds", "Clasp your hands behind your back and gently lift them away from you."),
];

const TEMPLATES: Record<Mode, Template> = {
  period: {
    title: { home: "Gentle yoga and a slow walk", gym: "Easy cardio and stretching" },
    line: "Soft movement eases cramps and lifts your mood. Go as slowly as you like and stop if anything hurts.",
    level: "Gentle",
    warmup: GENTLE_WARMUP,
    main: {
      home: [
        E("Supported bridge", "8 slow reps", "On your back, knees bent, lift your hips a little and lower slowly."),
        E("Butterfly stretch", "1 minute", "Sit tall, soles of the feet together, let your knees fall open."),
        E("Cat-cow flow", "1 minute", "Move slowly with your breath on hands and knees."),
        E("Reclined twist", "45 seconds each side", "On your back, drop both knees to one side and look the other way."),
        E("Easy walk indoors or outside", "3 minutes", "Walk at a pace where you can still chat."),
        E("Legs up the wall", "2 minutes", "Lie close to a wall with your legs resting up on it."),
      ],
      gym: [
        E("Recumbent bike, easy", "4 minutes", "Low resistance, steady pace, shoulders relaxed."),
        E("Treadmill walk", "4 minutes", "Flat or a slight incline at a chatty pace."),
        E("Supported bridge on a mat", "8 slow reps", "Lift and lower your hips slowly."),
        E("Seated cable row, light", "10 reps", "Sit tall, pull the handle to your belly, squeeze your shoulder blades."),
        E("Foam roller for the back", "1 minute", "Lie on the roller across your upper back and breathe."),
        E("Pigeon stretch", "45 seconds each side", "One shin in front of you, the other leg long behind."),
      ],
    },
    cooldown: CALM_COOLDOWN,
  },
  follicular: {
    title: { home: "Full-body strength at home", gym: "Strength builder" },
    line: "Your energy is rising, so this is a great week to build strength and try something a little harder.",
    level: "Beginner to intermediate",
    warmup: ACTIVE_WARMUP,
    main: {
      home: [
        E("Squats", "12 reps", "Feet hip-width apart, chest up, sit back and down, push through your heels to stand."),
        E("Push-ups (knees or wall)", "10 reps", "Hands under your shoulders, lower your chest with a straight back, push away."),
        E("Reverse lunges", "8 each leg", "Step one foot back, lower both knees to 90 degrees, step back to standing."),
        E("Glute bridge", "15 reps", "On your back, knees bent, squeeze your bottom and lift your hips."),
        E("Bent-over row with water bottles", "12 reps", "Hinge forward with a flat back, pull the bottles to your ribs."),
        E("Plank", "30 seconds", "Forearms down, body in one long line, breathe steadily."),
      ],
      gym: [
        E("Goblet squat", "10 reps", "Hold a dumbbell at your chest, squat down with your chest tall."),
        E("Lat pulldown", "10 reps", "Pull the bar to your upper chest, elbows down and back."),
        E("Romanian deadlift", "10 reps", "Dumbbells in front of your thighs, hinge at the hips with a soft knee, stand tall."),
        E("Dumbbell chest press", "10 reps", "On a bench, press the dumbbells up over your chest and lower slowly."),
        E("Walking lunges", "8 each leg", "Long steps, back knee towards the floor, stay tall."),
        E("Dead bug", "8 each side", "On your back, lower the opposite arm and leg slowly, keep your back pressed down."),
      ],
    },
    cooldown: STRETCH_COOLDOWN,
  },
  ovulation: {
    title: { home: "Power intervals at home", gym: "Strength and intervals" },
    line: "You're usually at your strongest now. Short bursts and heavier lifts feel good. Warm up well to protect your joints.",
    level: "Intermediate",
    warmup: ACTIVE_WARMUP,
    main: {
      home: [
        E("Squat to calf raise", "12 reps", "Squat down, stand up and rise onto your toes at the top."),
        E("Mountain climbers", "30 seconds", "In a high plank, drive your knees towards your chest one at a time."),
        E("Step-ups on a sturdy step", "10 each leg", "Step up fully, then step down with control."),
        E("Push-ups", "10 reps", "Knees or toes, chest towards the floor with a straight back."),
        E("Skater steps", "30 seconds", "Step wide to one side and swing the other leg behind, then switch."),
        E("Side plank", "20 seconds each side", "On one forearm, lift your hips into a straight line."),
      ],
      gym: [
        E("Barbell or dumbbell squat", "8 reps", "Choose a weight that feels hard by the last two reps."),
        E("Rowing machine sprint", "1 minute", "Push with your legs first, then pull with your arms."),
        E("Hip thrust", "10 reps", "Upper back on a bench, weight on your hips, squeeze and lift."),
        E("Dumbbell shoulder press", "10 reps", "Press up over your head without arching your back."),
        E("Bike intervals", "2 minutes", "20 seconds fast, 40 seconds easy, twice."),
        E("Cable woodchop", "10 each side", "Rotate from your hips and chest, arms long."),
      ],
    },
    cooldown: STRETCH_COOLDOWN,
  },
  luteal: {
    title: { home: "Steady strength and Pilates", gym: "Steady strength" },
    line: "Energy dips a little before your period. Moderate strength and slow core work keep you strong without wearing you out.",
    level: "Beginner",
    warmup: GENTLE_WARMUP,
    main: {
      home: [
        E("Slow squats", "10 reps", "Take 3 seconds to go down and 1 second to stand."),
        E("Glute bridge with a pause", "12 reps", "Lift your hips and hold for 2 seconds at the top."),
        E("Bird dog", "8 each side", "On hands and knees, reach one arm forward and the opposite leg back."),
        E("Incline push-ups on a table", "10 reps", "Hands on the table edge, lower your chest and push away."),
        E("Side-lying leg lifts", "12 each side", "Lie on your side, lift the top leg slowly and lower."),
        E("Brisk walk", "5 minutes", "Outdoors if you can. Daylight helps your mood."),
      ],
      gym: [
        E("Leg press, moderate", "12 reps", "Feet hip-width on the plate, lower slowly and press away."),
        E("Seated row", "12 reps", "Sit tall, pull to your belly, squeeze your shoulder blades."),
        E("Incline treadmill walk", "5 minutes", "A gentle hill at a pace where you can still talk."),
        E("Dumbbell step-ups, light", "8 each leg", "Low box, step up with control."),
        E("Pallof press", "10 each side", "Hold the cable at your chest, press it straight out and resist the twist."),
        E("Swiss ball dead bug", "8 each side", "Hold a ball between your hands and knees, lower the opposite arm and leg."),
      ],
    },
    cooldown: CALM_COOLDOWN,
  },
  pregnancy: {
    title: { home: "Gentle pregnancy strength", gym: "Gentle pregnancy strength" },
    line: "Safe, steady movement for pregnancy. Check with your doctor before starting, keep a pace where you can talk, and stop if anything feels wrong.",
    level: "Gentle",
    warmup: [
      E("Marching on the spot", "2 minutes", "Swing your arms gently and breathe easily."),
      E("Shoulder rolls", "1 minute", "Roll your shoulders back slowly."),
    ],
    main: {
      home: [
        E("Wall squats", "10 reps", "Back against a wall, slide down a little and come back up."),
        E("Pelvic tilts on hands and knees", "10 reps", "Gently tuck your tailbone under, then release."),
        E("Side-lying leg lifts", "10 each side", "Lie on your side with a pillow, lift the top leg slowly."),
        E("Wall push-ups", "10 reps", "Hands on the wall, bend your elbows and push away."),
        E("Seated arm raises with light bottles", "10 reps", "Sit tall and lift the bottles out to the sides to shoulder height."),
        E("Easy walk", "5 minutes", "Comfortable pace, flat ground."),
      ],
      gym: [
        E("Stationary bike, easy", "5 minutes", "Upright bike, low resistance."),
        E("Seated row, light", "10 reps", "Sit tall and pull to your belly."),
        E("Wall squats", "10 reps", "Back against a wall, slide down a little and up."),
        E("Side-lying leg lifts", "10 each side", "On a mat with a pillow."),
        E("Wall push-ups", "10 reps", "Hands on the wall, push away gently."),
        E("Pelvic tilts", "10 reps", "On hands and knees, tuck and release."),
      ],
    },
    cooldown: [
      E("Side-lying rest", "2 minutes", "Lie on your left side with a pillow between your knees."),
      E("Slow breathing", "1 minute", "Breathe in for 4, out for 6."),
    ],
    note: "Avoid lying flat on your back after the first trimester, contact sports and anything with a risk of falling. Stop and call your doctor if you have bleeding, dizziness, chest pain or fluid leaking.",
  },
  postpartum: {
    title: { home: "Gentle recovery after birth", gym: "Gentle recovery after birth" },
    line: "Start with breathing and your pelvic floor. Most women wait for their 6-week check before anything harder. Go slowly and be kind to yourself.",
    level: "Recovery",
    warmup: [E("Belly breathing", "2 minutes", "Lie or sit comfortably. Breathe into your belly and ribs, out slowly.")],
    main: {
      home: [
        E("Pelvic floor squeezes", "10 slow reps", "Squeeze as if stopping a wee, hold for 5 seconds, then fully relax."),
        E("Heel slides", "8 each leg", "On your back, slowly slide one heel away and back while you breathe out."),
        E("Glute bridge, small", "8 reps", "Lift your hips a little, breathe out as you lift."),
        E("Wall push-ups", "8 reps", "Hands on the wall, bend and push away."),
        E("Walk with the pram", "5 minutes", "An easy walk outside if you feel up to it."),
        E("Seated side bends", "5 each side", "Sit tall and reach one arm over your head."),
      ],
      gym: [
        E("Pelvic floor squeezes", "10 slow reps", "Squeeze, hold 5 seconds, relax fully."),
        E("Heel slides", "8 each leg", "On a mat, slide one heel away and back."),
        E("Glute bridge, small", "8 reps", "Lift your hips a little."),
        E("Seated row, very light", "10 reps", "Sit tall and pull gently."),
        E("Treadmill walk, flat", "5 minutes", "Easy pace."),
        E("Wall push-ups", "8 reps", "Hands on the wall."),
      ],
    },
    cooldown: [E("Lying rest", "2 minutes", "Lie comfortably and let your whole body soften.")],
    note: "Call your doctor if you have heavy bleeding, pain in your belly or a bulge or heaviness down below. Wait for your doctor's okay after a caesarean.",
  },
  menopause: {
    title: { home: "Strength for strong bones", gym: "Strength for bones and heart" },
    line: "Lifting and gentle impact protect your bones, heart and mood after 45. Balance work helps you stay steady.",
    level: "Beginner",
    warmup: ACTIVE_WARMUP,
    main: {
      home: [
        E("Sit-to-stand from a chair", "12 reps", "Sit at the front of a chair, stand up without your hands, sit down slowly."),
        E("Wall or table push-ups", "10 reps", "Lower your chest and push away."),
        E("Heel drops", "15 reps", "Rise onto your toes and let your heels drop firmly to the floor. Good for bones."),
        E("Bent-over row with bottles or a bag", "12 reps", "Hinge forward with a flat back, pull to your ribs."),
        E("Single-leg balance", "30 seconds each side", "Hold a wall at first, then try letting go."),
        E("Glute bridge", "12 reps", "Squeeze and lift your hips."),
      ],
      gym: [
        E("Leg press", "10 reps", "A weight that feels hard by the last two reps."),
        E("Lat pulldown", "10 reps", "Pull the bar to your upper chest."),
        E("Dumbbell deadlift", "10 reps", "Hinge at the hips, flat back, stand tall."),
        E("Step-ups", "8 each leg", "Low box, step up with control."),
        E("Farmer's walk", "40 seconds", "Hold two dumbbells and walk tall."),
        E("Single-leg balance", "30 seconds each side", "Hold the rack if you need to."),
      ],
    },
    cooldown: STRETCH_COOLDOWN,
  },
  "first-period": {
    title: { home: "Feel-good stretches and play", gym: "Feel-good stretches and play" },
    line: "Moving your body can ease cramps and help you feel happier. Pick what feels fun today.",
    level: "Easy",
    warmup: [E("Marching and arm swings", "2 minutes", "March on the spot and swing your arms.")],
    main: {
      home: [
        E("Skipping or jumping jacks", "1 minute", "Go at your own pace. Skip if you have a rope."),
        E("Cat-cow", "1 minute", "On hands and knees, round your back, then let your belly drop."),
        E("Star jumps", "10 reps", "Jump your feet out and your arms up, then back in."),
        E("Butterfly stretch", "1 minute", "Sit with the soles of your feet together."),
        E("Animal walks", "1 minute", "Bear crawl or crab walk across the room."),
        E("Child's pose", "1 minute", "Sit back on your heels and rest."),
      ],
      gym: [
        E("Skipping or jumping jacks", "1 minute", "Go at your own pace."),
        E("Cat-cow", "1 minute", "Round your back, then let your belly drop."),
        E("Star jumps", "10 reps", "Feet out and arms up, then back in."),
        E("Butterfly stretch", "1 minute", "Soles of your feet together."),
        E("Animal walks", "1 minute", "Bear crawl or crab walk."),
        E("Child's pose", "1 minute", "Sit back and rest."),
      ],
    },
    cooldown: [E("Slow breathing", "1 minute", "Breathe in for 4, out for 6.")],
  },
};

const LAYOUT: Record<Minutes, { count: number; rounds: number; rest: string; warm: number; cool: number }> = {
  15: { count: 3, rounds: 2, rest: "Rest 30 seconds between moves", warm: 2, cool: 2 },
  30: { count: 4, rounds: 3, rest: "Rest 30-45 seconds between moves, 1 minute between rounds", warm: 3, cool: 3 },
  45: { count: 6, rounds: 3, rest: "Rest 45 seconds between moves, 90 seconds between rounds", warm: 3, cool: 3 },
};

export function workoutMode(stage: LifeStage | undefined, phase: Phase | null): Mode {
  if (stage === "pregnancy") return "pregnancy";
  if (stage === "postpartum") return "postpartum";
  if (stage === "menopause") return "menopause";
  if (stage === "first-period") return "first-period";
  return phase ?? "follicular";
}

export function buildWorkout(mode: Mode, place: Place, minutes: Minutes): Workout {
  const t = TEMPLATES[mode];
  const l = LAYOUT[minutes];
  const gentle = mode === "pregnancy" || mode === "postpartum" || mode === "period";
  return {
    key: `${mode}-${place}-${minutes}`,
    title: t.title[place],
    line: t.line,
    level: t.level,
    warmup: t.warmup.slice(0, l.warm),
    main: t.main[place].slice(0, l.count),
    rounds: gentle ? Math.min(l.rounds, 2) : l.rounds,
    rest: l.rest,
    cooldown: t.cooldown.slice(0, l.cool),
    note: t.note,
  };
}

export const MODE_LABEL: Record<Mode, string> = {
  period: "Period",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  pregnancy: "Pregnancy",
  postpartum: "After birth",
  menopause: "Midlife",
  "first-period": "Growing up",
};
