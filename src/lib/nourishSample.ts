import { addDays, parseISODate } from "./dates";
import { foodById, scale } from "./foods";
import { groceryFromText, planTexts, priyaDietPlan } from "./phaseFood";
import type { ChatMessage, CoachPlan, FoodEntry, MealSlot, PlanRequest, Profile, ProfileData } from "./types";

/**
 * Made-up Nourish, Move and Companion data for the sample women:
 * their numbers, meals logged today and yesterday, 30 days of steps,
 * a Bestie chat and coach plans. Nothing here is real.
 */

type Numbers = Pick<Profile, "heightCm" | "weightKg" | "activity" | "goal" | "diet">;

const NUMBERS: Record<string, Numbers> = {
  priya: { heightCm: 162, weightKg: 58, activity: "light", goal: "maintain", diet: "vegetarian" },
  nisha: { heightCm: 158, weightKg: 64, activity: "light", goal: "feel-better", diet: "eggetarian" },
  rekha: { heightCm: 160, weightKg: 82, activity: "light", goal: "lose", diet: "vegetarian" },
  anaya: { heightCm: 148, diet: "vegetarian" },
  meera: { heightCm: 160, weightKg: 66, activity: "light", goal: "feel-better", diet: "vegetarian" },
  pooja: { heightCm: 157, weightKg: 63, activity: "light", goal: "feel-better", diet: "non-vegetarian" },
  farida: { heightCm: 163, weightKg: 74, activity: "low", goal: "feel-better", diet: "non-vegetarian" },
  sara: { heightCm: 168, weightKg: 61, activity: "moderate", goal: "maintain", diet: "non-vegetarian" },
  ananya: { heightCm: 160, activity: "light", goal: "feel-better", diet: "vegetarian" },
  kavya: { heightCm: 158, weightKg: 60, activity: "light", goal: "feel-better", diet: "vegetarian" },
  sunita: { heightCm: 155, weightKg: 66, activity: "light", goal: "strength", diet: "vegetarian" },
  lata: { heightCm: 152, weightKg: 62, activity: "light", goal: "feel-better", diet: "vegetarian" },
};

// [meal, foodId, qty]
type Log = [MealSlot, string, number][];

const TODAY_FOOD: Record<string, Log> = {
  priya: [["breakfast", "moong-chilla", 2], ["breakfast", "chai-nosugar", 1], ["lunch", "palak-sabzi", 1], ["lunch", "bhakri-jowar", 1], ["lunch", "masoor-dal", 1], ["lunch", "curd", 1]],
  nisha: [["breakfast", "omelette", 1], ["breakfast", "bread-whole", 2], ["lunch", "dal-tadka", 1], ["lunch", "roti", 2], ["lunch", "mixed-veg", 1]],
  rekha: [["breakfast", "besan-chilla", 2], ["breakfast", "green-tea", 1], ["lunch", "phulka", 2], ["lunch", "rajma", 1], ["lunch", "kachumber", 1]],
  anaya: [["breakfast", "poha", 1], ["breakfast", "milk", 1], ["lunch", "roti", 2], ["lunch", "dal-tadka", 1]],
  meera: [["breakfast", "masala-oats", 1], ["breakfast", "almonds", 1], ["lunch", "jowar-roti", 2], ["lunch", "chole", 1], ["lunch", "green-salad", 1]],
  pooja: [["breakfast", "egg-boiled", 2], ["breakfast", "upma", 1], ["lunch", "rice-white", 1], ["lunch", "fish-curry", 1]],
  farida: [["breakfast", "daliya", 1], ["breakfast", "chai-nosugar", 1], ["lunch", "rice-brown", 1], ["lunch", "chicken-curry", 1], ["lunch", "cabbage-sabzi", 1]],
  sara: [["breakfast", "overnight-oats", 1], ["lunch", "quinoa", 1], ["lunch", "chicken-breast", 1], ["lunch", "broccoli", 1]],
  ananya: [["breakfast", "ragi-porridge", 1], ["breakfast", "banana", 1], ["lunch", "roti", 2], ["lunch", "palak-paneer", 1], ["lunch", "curd", 1]],
  kavya: [["breakfast", "methi-thepla", 2], ["breakfast", "haldi-doodh", 1], ["lunch", "khichdi", 1], ["lunch", "lauki", 1], ["snack", "til-ladoo", 1]],
  sunita: [["breakfast", "ragi-idli", 3], ["breakfast", "sambar", 1], ["lunch", "bhakri-bajra", 1], ["lunch", "sarson-saag", 1], ["lunch", "buttermilk", 1]],
  lata: [["breakfast", "oats-porridge", 1], ["lunch", "roti", 2], ["lunch", "moong-dal", 1], ["lunch", "beans-poriyal", 1]],
};

const YESTERDAY_FOOD: Log = [
  ["breakfast", "poha", 1],
  ["lunch", "roti", 2],
  ["lunch", "dal-tadka", 1],
  ["lunch", "bhindi", 1],
  ["snack", "roasted-chana", 1],
  ["dinner", "khichdi", 1],
  ["dinner", "curd", 1],
];

function entries(log: Log, date: string, key: string): FoodEntry[] {
  return log.flatMap(([meal, id, qty], i) => {
    const f = foodById(id);
    if (!f) return [];
    const hour = meal === "breakfast" ? 8 : meal === "lunch" ? 13 : meal === "snack" ? 17 : 20;
    return [
      {
        id: `${key}-${date}-${i}`,
        foodId: f.id,
        name: f.name,
        portion: f.portion,
        qty,
        ...scale(f, qty),
        meal,
        at: `${date}T${String(hour).padStart(2, "0")}:15:00`,
        source: "list" as const,
      },
    ];
  });
}

/** A steady, believable pseudo-random walk (same every time for a woman). */
function seeded(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const STEP_BASE: Record<string, number> = {
  priya: 6900, nisha: 5200, rekha: 6200, meera: 7400, pooja: 5600, farida: 6400, sara: 8800,
  ananya: 4800, kavya: 3900, sunita: 6100, lata: 5400,
};

function steps(key: string, today: string): Record<string, number> {
  const base = STEP_BASE[key];
  if (!base) return {};
  const rnd = seeded(key);
  const out: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const wobble = (rnd() - 0.5) * base * 0.55;
    const weekend = [0, 6].includes(parseISODate(d).getDay()) ? 900 : 0;
    // Today is still in progress.
    const v = Math.max(1200, Math.round((base + wobble + weekend) / 10) * 10);
    out[d] = i === 0 ? Math.round(v * 0.55) : v;
  }
  return out;
}

const CHATS: Record<string, [string, string][]> = {
  priya: [
    ["user", "Why am I craving sweets so much at night this week?"],
    ["assistant", "You're on day 19, in your luteal phase. Progesterone rises now and your body burns a little more energy, so cravings are very normal. A warm haldi doodh with 2 dates, or a banana with a few almonds after dinner, usually settles it. And with your low iron, dates are a kind choice."],
    ["user", "And my periods hurt so much on day 1 and 2. Is that normal?"],
    ["assistant", "Some cramping is common, but pain that stops you from going about your day, or that painkillers don't help, isn't something to just put up with. Your pain diary shows strong pain on days 1 and 2 for your last 3 periods. Please show it to your gynaecologist, it will really help them. A hot water bag and gentle movement can ease it meanwhile."],
  ],
  nisha: [
    ["user", "I have 10 minutes before the kids wake up. What can I do?"],
    ["assistant", "Ten minutes is plenty. Try 3 rounds of 10 squats, 8 wall push-ups and a 30-second plank, then 1 minute of slow breathing. You'll feel the difference by the time the tiffins are packed."],
  ],
  rekha: [
    ["user", "I've lost only 1 kg this month. Am I doing something wrong?"],
    ["assistant", "Not at all. A kilo a month is steady and healthy, and your waist went down 2 cm too, which matters more. Water and hormones before your period can hide progress on the scale. Keep your protein at each meal and your walks, and look at the trend over 2-3 months."],
  ],
  anaya: [
    ["user", "What should I keep in my school bag?"],
    ["assistant", "A small pouch with 2 pads, a spare pair of underwear, a few wipes and a little paper bag to wrap a used pad. A dark jacket to tie around your waist helps too. And remember, your teacher or school nurse can always help you."],
  ],
  meera: [
    ["user", "Does PCOS mean I can't eat rice?"],
    ["assistant", "You can still enjoy rice. With PCOS it helps to keep the portion to about one katori, pair it with dal or paneer and lots of sabzi, and choose brown rice or millets some days. Protein and fibre with your carbs keep your sugar and insulin steadier."],
  ],
  pooja: [
    ["user", "Can I have my thyroid tablet with my morning tea?"],
    ["assistant", "It works best on an empty stomach with plain water, about 30-60 minutes before tea, coffee or breakfast. Keep calcium or iron tablets at least 4 hours away. If your doctor told you differently, follow their advice."],
  ],
  farida: [
    ["user", "My sugar was 168 after lunch. Should I worry?"],
    ["assistant", "It's a little higher than the usual target after meals, but one reading isn't a reason to panic. A 15-minute walk after lunch and a smaller portion of rice with more sabzi can bring it down. If you keep seeing readings above 180 or below 70, please call your doctor."],
  ],
  sara: [
    ["user", "My ovulation test is positive today. What does that mean?"],
    ["assistant", "A positive test means your LH surge has started, so you'll likely ovulate in the next 12-36 hours. Today and the next 2 days are your most fertile. Your temperature should rise a little after ovulation, which confirms it."],
  ],
  ananya: [
    ["user", "My feet are a bit swollen in the evening. Is that okay?"],
    ["assistant", "Mild swelling in the feet by evening is common at 30 weeks. Putting your feet up and lying on your left side helps. But if your face or hands swell suddenly, or you get a bad headache or blurry vision, call your doctor straight away, as that can be a sign of high blood pressure."],
  ],
  kavya: [
    ["user", "I feel so tired and teary all the time."],
    ["assistant", "That sounds really hard, and you're not alone. Many new mothers feel this way, and it's not your fault. Please tell Rohan or Amma how you're feeling today, and talk to your doctor if it lasts more than 2 weeks. If you ever have thoughts of harming yourself, call Tele MANAS on 14416 right away."],
  ],
  sunita: [
    ["user", "The hot flashes wake me up every night."],
    ["assistant", "That's exhausting. A cool, dark room, cotton nightwear and a glass of cold water by your bed can help, and keeping tea, coffee and spicy food earlier in the day too. Your scores are getting better. If sleep stays this broken, talk to your doctor about treatment options."],
  ],
  lata: [
    ["user", "What should I eat for my bones?"],
    ["assistant", "Ragi, curd, paneer, til, almonds and leafy greens give you calcium. Morning sun for 15 minutes helps your vitamin D, which your report showed was low. Add a short strength routine and daily walks, and your bones will thank you."],
  ],
};

function chatFor(key: string, today: string): ChatMessage[] {
  return (CHATS[key] ?? []).map(([role, text], i) => ({
    id: `${key}-chat-${i}`,
    role: role as ChatMessage["role"],
    text,
    at: `${addDays(today, -1)}T21:${String(10 + i * 3).padStart(2, "0")}:00`,
  }));
}

function plan(intro: string, meals: [string, string][], writtenAt: string, titles?: string[]): CoachPlan {
  return { intro, writtenAt, meals: meals.map(([slot, items], i) => ({ slot, items, title: titles?.[i] })) };
}

function dietFor(key: string, today: string, name: string): PlanRequest | null {
  const at = `${addDays(today, -2)}T10:00:00.000Z`;
  const base = { kind: "diet" as const, sentAt: `${addDays(today, -6)}T09:00:00.000Z`, status: "ready" as const, seen: false };
  if (key === "priya") {
    return { ...base, details: { name, goals: ["More energy", "Better periods", "Eat healthier"], mealsPerDay: 5, cuisine: "Maharashtrian home food", shareNumbers: true }, plan: priyaDietPlan(at) };
  }
  if (key === "kavya") {
    return {
      ...base,
      details: { name, goals: ["Breastfeeding", "More energy"], mealsPerDay: 6, cuisine: "Gujarati home food", shareNumbers: true },
      plan: plan(
        "Kavya, feeding your baby uses a lot of energy, so this plan has 6 small meals, plenty of water and foods many mothers find comforting. Eat to your hunger, never skip meals, and keep a water bottle where you feed.",
        [
          ["Early morning", "Warm water, 5 soaked almonds and 2 dates. A glass of milk with a pinch of haldi."],
          ["Breakfast", "2 methi theplas with curd, or ragi porridge with jaggery and nuts."],
          ["Mid-morning", "A bowl of papaya or a banana, and a glass of buttermilk."],
          ["Lunch", "2 rotis, moong dal or palak dal, lauki or bhindi sabzi, rice if you like, and a bowl of curd."],
          ["Evening", "Roasted makhana or a til ladoo, with ginger tea or haldi doodh."],
          ["Dinner", "Moong dal khichdi with ghee, a vegetable, and kadhi or curd."],
        ],
        at,
      ),
    };
  }
  if (key === "farida") {
    return {
      ...base,
      details: { name, goals: ["Eat healthier", "Lose fat"], mealsPerDay: 5, cuisine: "Hyderabadi and British", shareNumbers: true },
      plan: plan(
        "Farida, this plan keeps your sugar steady: low-GI carbs in small portions, protein at every meal, and a short walk after lunch and dinner. Take your medicine as your doctor advised and keep your sugar log going.",
        [
          ["Early morning", "Warm water with methi seeds soaked overnight, and 4 almonds."],
          ["Breakfast", "Vegetable daliya or 2 besan chillas, with tea without sugar."],
          ["Lunch", "1 katori brown rice or 2 multigrain rotis, chicken or fish curry, a big bowl of sabzi and salad. Then a 15-minute walk."],
          ["Evening", "Roasted chana or a guava, with green tea."],
          ["Dinner", "Grilled fish or paneer with sauteed vegetables and 1 roti. A 15-minute walk after."],
        ],
        at,
      ),
    };
  }
  return null;
}

function workoutFor(key: string, today: string, name: string): PlanRequest | null {
  if (key === "priya") {
    return {
      kind: "workout",
      sentAt: `${addDays(today, -1)}T19:30:00.000Z`,
      status: "waiting",
      details: { name, goals: ["Get stronger", "Better periods", "More energy"], daysPerWeek: 4, place: "Home", routine: "Office 9 to 6, free after 7 pm", shareNumbers: true },
    };
  }
  if (key === "sunita") {
    return {
      kind: "workout",
      sentAt: `${addDays(today, -10)}T08:00:00.000Z`,
      status: "ready",
      details: { name, goals: ["Bone health", "Get stronger", "Better sleep"], daysPerWeek: 3, place: "Home", shareNumbers: true },
      plan: plan(
        "Sunita, strength work 3 days a week protects your bones and helps your sleep. Start with a weight that feels easy and add a little every 2 weeks. Walk on the other days.",
        [
          ["Monday", "Sit-to-stand 3 x 12, wall push-ups 3 x 10, heel drops 3 x 15, bent-over rows with water bottles 3 x 12, single-leg balance 30 seconds each side."],
          ["Wednesday", "Brisk walk 20 minutes, step-ups on the bottom stair 3 x 8 each leg, glute bridges 3 x 12, gentle stretches 5 minutes."],
          ["Friday", "Same as Monday with a slightly heavier bag or bottles. End with 5 minutes of slow breathing for better sleep."],
        ],
        `${addDays(today, -7)}T10:00:00.000Z`,
        ["Strength for bones", "Walk and legs", "Strength again"],
      ),
    };
  }
  return null;
}

/** Add Nourish, Move and Companion data to a sample woman. */
export function withNourishSample(key: string, data: ProfileData, today: string): ProfileData {
  const p = data.profile;
  if (!p) return data;
  const nums = NUMBERS[key] ?? {};
  const profile: Profile = { ...p };
  for (const [k, v] of Object.entries(nums) as [keyof Numbers, never][]) {
    if (profile[k] === undefined) profile[k] = v;
  }
  // No weight for girls or in pregnancy (which has its own weight log).
  if (profile.stage === "first-period" || profile.stage === "pregnancy") delete profile.weightKg;

  const yesterday = addDays(today, -1);
  const food = {
    ...(data.food ?? {}),
    [yesterday]: entries(YESTERDAY_FOOD, yesterday, key),
    [today]: entries(TODAY_FOOD[key] ?? [], today, key),
  };

  const dietRequest = data.dietRequest ?? dietFor(key, today, p.name);
  const workoutRequest = data.workoutRequest ?? workoutFor(key, today, p.name);
  const grocery = dietRequest?.plan ? groceryFromText(planTexts(dietRequest.plan)) : data.grocery;

  return {
    ...data,
    profile,
    food,
    chat: data.chat?.length ? data.chat : chatFor(key, today),
    dietRequest,
    workoutRequest,
    grocery,
    groceryPlanAt: dietRequest?.plan?.writtenAt,
    health: key === "anaya" ? data.health : { source: "Apple Health", ...(data.health ?? {}), steps: { ...steps(key, today), ...(data.health?.steps ?? {}) } },
  };
}
