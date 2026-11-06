import type { Phase } from "./cycle";
import type { CoachPlan, GroceryItem } from "./types";

export interface PhaseDay {
  focus: string;
  why: string;
  meals: { slot: string; veg: string; nonVeg?: string }[];
}

/** A day of meals for each phase. Vegetarian first; a non-veg swap where it helps. */
export const PHASE_DAYS: Record<Phase, PhaseDay> = {
  period: {
    focus: "Iron, warmth and comfort",
    why: "You lose some iron when you bleed. Warm, iron-rich food with a little vitamin C helps your body absorb it and eases tiredness.",
    meals: [
      { slot: "Early morning", veg: "Warm water with soaked raisins and 2 dates" },
      { slot: "Breakfast", veg: "Ragi porridge with jaggery and a few almonds", nonVeg: "Masala omelette with a ragi roti" },
      { slot: "Lunch", veg: "Palak dal, jowar bhakri, beetroot thoran and lemon on the side", nonVeg: "Mutton keema with a roti and salad" },
      { slot: "Evening", veg: "Ginger tea and a til ladoo" },
      { slot: "Dinner", veg: "Moong dal khichdi with ghee and a bowl of curd", nonVeg: "Chicken soup with khichdi" },
    ],
  },
  follicular: {
    focus: "Fresh, light and protein-rich",
    why: "Energy rises after your period. Fresh vegetables, sprouts and good protein help you build strength while you feel your best.",
    meals: [
      { slot: "Early morning", veg: "Lemon water and 5 soaked almonds" },
      { slot: "Breakfast", veg: "Moong dal chilla with mint chutney", nonVeg: "Egg bhurji on whole wheat toast" },
      { slot: "Lunch", veg: "Quinoa pulao, rajma and a big kachumber salad", nonVeg: "Grilled chicken, brown rice and salad" },
      { slot: "Evening", veg: "Sprouts chaat with pomegranate" },
      { slot: "Dinner", veg: "Paneer tikka with stir-fried vegetables and a roti", nonVeg: "Fish curry with a small katori of rice" },
    ],
  },
  ovulation: {
    focus: "Fibre, colour and antioxidants",
    why: "Around ovulation your body is busy. Plenty of fibre, colourful vegetables and seeds keep you light and steady.",
    meals: [
      { slot: "Early morning", veg: "Jeera water and a handful of berries" },
      { slot: "Breakfast", veg: "Overnight oats with flax, chia and fruit", nonVeg: "Boiled eggs with fruit" },
      { slot: "Lunch", veg: "Chole, millet roti, cucumber raita and salad", nonVeg: "Chicken tikka wrap with salad" },
      { slot: "Evening", veg: "Coconut water and roasted makhana" },
      { slot: "Dinner", veg: "Vegetable daliya with a bowl of dal", nonVeg: "Baked salmon with sauteed greens" },
    ],
  },
  luteal: {
    focus: "Steady energy, magnesium and calm",
    why: "Before your period you may feel hungrier and moodier. Slow carbs, magnesium-rich seeds and a little extra food keep cravings and mood swings softer.",
    meals: [
      { slot: "Early morning", veg: "Warm water and 2 walnuts with 1 date" },
      { slot: "Breakfast", veg: "Vegetable poha with peanuts and lemon", nonVeg: "Egg curry with one roti" },
      { slot: "Lunch", veg: "Brown rice, masoor dal, bhindi sabzi and curd", nonVeg: "Chicken curry, brown rice and salad" },
      { slot: "Evening", veg: "Roasted chana and a cup of haldi doodh" },
      { slot: "Dinner", veg: "Sweet potato and palak sabzi with two jowar rotis", nonVeg: "Fish curry with jowar roti and greens" },
    ],
  },
};

export interface Recipe {
  id: string;
  craving: string;
  title: string;
  minutes: number;
  phase: Phase[];
  ingredients: string[];
  steps: string[];
  why: string;
}

export const RECIPES: Recipe[] = [
  {
    id: "banana-oat-cookies",
    craving: "Craving cookies?",
    title: "3-ingredient banana oat cookies",
    minutes: 20,
    phase: ["luteal", "period"],
    ingredients: ["2 ripe bananas", "1 cup rolled oats", "2 tbsp dark chocolate chips or chopped dates"],
    steps: ["Mash the bananas in a bowl.", "Stir in the oats and chocolate or dates.", "Spoon onto a lined tray and bake at 180 °C for 12-15 minutes."],
    why: "Oats and bananas give slow, steady sugar and magnesium, so the craving settles without a crash.",
  },
  {
    id: "choco-dates",
    craving: "Craving chocolate?",
    title: "Dark chocolate dates with almonds",
    minutes: 5,
    phase: ["luteal", "period"],
    ingredients: ["4 dates", "4 almonds", "2 squares dark chocolate (70%)"],
    steps: ["Slit the dates and remove the seeds.", "Tuck an almond into each one.", "Melt the chocolate and drizzle over. Chill for 5 minutes."],
    why: "Dark chocolate and dates bring iron and magnesium. Almonds add protein so you feel full.",
  },
  {
    id: "masala-makhana",
    craving: "Craving chips?",
    title: "Crunchy masala makhana",
    minutes: 10,
    phase: ["follicular", "ovulation", "luteal"],
    ingredients: ["2 cups makhana", "1 tsp ghee", "Chaat masala, turmeric and a pinch of salt"],
    steps: ["Warm the ghee in a pan on low heat.", "Add makhana and roast for 6-8 minutes until crisp.", "Toss with the spices and cool."],
    why: "All the crunch of chips with fewer calories, plus a little protein.",
  },
  {
    id: "ragi-sheera",
    craving: "Craving something sweet and warm?",
    title: "Ragi and jaggery sheera",
    minutes: 15,
    phase: ["period", "luteal"],
    ingredients: ["3 tbsp ragi flour", "1 tsp ghee", "1 tbsp jaggery", "1 cup milk", "A pinch of cardamom"],
    steps: ["Roast the ragi flour in ghee until it smells nutty.", "Pour in warm milk slowly, stirring well.", "Add jaggery and cardamom, cook until thick."],
    why: "Ragi is rich in calcium and iron. A warm sweet bowl comforts cramps.",
  },
  {
    id: "mango-lassi-bowl",
    craving: "Craving ice cream?",
    title: "Frozen mango yogurt bowl",
    minutes: 5,
    phase: ["follicular", "ovulation"],
    ingredients: ["1 cup frozen mango", "1/2 cup thick curd or Greek yogurt", "A few pistachios"],
    steps: ["Blend the frozen mango with the curd until thick.", "Spoon into a bowl and top with pistachios."],
    why: "Creamy and cold like ice cream, with protein and calcium from the curd.",
  },
  {
    id: "chana-chaat",
    craving: "Craving something salty?",
    title: "Tangy chana chaat",
    minutes: 10,
    phase: ["follicular", "ovulation", "luteal", "period"],
    ingredients: ["1 cup boiled chana", "Chopped onion, tomato and cucumber", "Lemon, chaat masala and coriander"],
    steps: ["Toss everything in a bowl.", "Squeeze lemon on top and eat fresh."],
    why: "Salty and tangy, with protein and fibre that keep you full for hours.",
  },
];

/** Two recipes for the phase, for the "Craving something? Make this instead" cards. */
export function recipesFor(phase: Phase): Recipe[] {
  return RECIPES.filter((r) => r.phase.includes(phase)).slice(0, 2);
}

/* ---------------- Grocery list from a plan ---------------- */

const GROCERY_WORDS: [RegExp, string, string][] = [
  [/spinach|palak/i, "Spinach (palak)", "Vegetables"],
  [/methi/i, "Methi leaves", "Vegetables"],
  [/beet/i, "Beetroot", "Vegetables"],
  [/bhindi|okra/i, "Bhindi", "Vegetables"],
  [/broccoli/i, "Broccoli", "Vegetables"],
  [/sweet potato/i, "Sweet potato", "Vegetables"],
  [/mushroom/i, "Mushrooms", "Vegetables"],
  [/cucumber|kachumber|salad/i, "Cucumber and tomatoes", "Vegetables"],
  [/lemon|nimbu/i, "Lemons", "Vegetables"],
  [/ginger/i, "Ginger", "Vegetables"],
  [/vegetable|sabzi|greens/i, "Seasonal vegetables", "Vegetables"],
  [/banana/i, "Bananas", "Fruit"],
  [/orange|amla/i, "Oranges or amla", "Fruit"],
  [/pomegranate/i, "Pomegranate", "Fruit"],
  [/guava/i, "Guava", "Fruit"],
  [/berries/i, "Berries", "Fruit"],
  [/fruit/i, "Seasonal fruit", "Fruit"],
  [/dates/i, "Dates", "Dry fruit and seeds"],
  [/raisin/i, "Raisins", "Dry fruit and seeds"],
  [/almond/i, "Almonds", "Dry fruit and seeds"],
  [/walnut/i, "Walnuts", "Dry fruit and seeds"],
  [/seed|flax|chia|til|sesame|pumpkin/i, "Mixed seeds (flax, pumpkin, sesame)", "Dry fruit and seeds"],
  [/makhana/i, "Makhana", "Dry fruit and seeds"],
  [/peanut/i, "Peanuts", "Dry fruit and seeds"],
  [/ragi/i, "Ragi flour", "Grains"],
  [/jowar/i, "Jowar flour", "Grains"],
  [/bajra/i, "Bajra flour", "Grains"],
  [/oats/i, "Rolled oats", "Grains"],
  [/poha/i, "Poha", "Grains"],
  [/quinoa/i, "Quinoa", "Grains"],
  [/brown rice/i, "Brown rice", "Grains"],
  [/daliya|dalia/i, "Daliya (broken wheat)", "Grains"],
  [/roti|atta|chapati/i, "Whole wheat atta", "Grains"],
  [/moong/i, "Moong dal", "Dal and legumes"],
  [/masoor/i, "Masoor dal", "Dal and legumes"],
  [/rajma/i, "Rajma", "Dal and legumes"],
  [/chole|chana|chickpea/i, "Chana (chickpeas)", "Dal and legumes"],
  [/sprout/i, "Moong for sprouting", "Dal and legumes"],
  [/soya/i, "Soya chunks", "Dal and legumes"],
  [/tofu/i, "Tofu", "Dal and legumes"],
  [/paneer/i, "Paneer", "Dairy and eggs"],
  [/curd|dahi|yogurt|raita|chaas|buttermilk/i, "Curd", "Dairy and eggs"],
  [/milk|doodh/i, "Milk", "Dairy and eggs"],
  [/egg/i, "Eggs", "Dairy and eggs"],
  [/ghee/i, "Ghee", "Dairy and eggs"],
  [/chicken/i, "Chicken", "Meat and fish"],
  [/fish|salmon|mackerel|rawas/i, "Fish", "Meat and fish"],
  [/mutton|keema/i, "Mutton", "Meat and fish"],
  [/jaggery|gur/i, "Jaggery", "Pantry"],
  [/haldi|turmeric/i, "Turmeric", "Pantry"],
  [/dark chocolate/i, "Dark chocolate (70%)", "Pantry"],
];

/** Make grocery rows from plan text (and keep what she added herself). */
export function groceryFromText(texts: string[], existing: GroceryItem[] = []): GroceryItem[] {
  const all = texts.join(" \n ");
  const names = new Map<string, string>();
  for (const [re, name, group] of GROCERY_WORDS) {
    if (re.test(all) && !names.has(name)) names.set(name, group);
  }
  // "Seasonal vegetables" only if nothing more specific matched
  const specificVeg = [...names.entries()].filter(([n, g]) => g === "Vegetables" && n !== "Seasonal vegetables").length;
  if (specificVeg >= 3) names.delete("Seasonal vegetables");
  const specificFruit = [...names.entries()].filter(([n, g]) => g === "Fruit" && n !== "Seasonal fruit").length;
  if (specificFruit >= 2) names.delete("Seasonal fruit");

  const kept = existing.filter((g) => !g.fromPlan);
  const prevDone = new Map(existing.map((g) => [g.name, g.done]));
  const fromPlan: GroceryItem[] = [...names.entries()].map(([name, group]) => ({
    id: `plan-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    name,
    group,
    done: prevDone.get(name) ?? false,
    fromPlan: true,
  }));
  const keptNames = new Set(kept.map((k) => k.name.toLowerCase()));
  return [...fromPlan.filter((f) => !keptNames.has(f.name.toLowerCase())), ...kept];
}

export function planTexts(plan: CoachPlan | undefined): string[] {
  return plan ? plan.meals.map((m) => `${m.title ?? ""} ${m.items}`) : [];
}

export function groceryShareText(items: GroceryItem[], name?: string): string {
  const todo = items.filter((i) => !i.done);
  const lines = todo.map((i) => `- ${i.name}`);
  return `${name ? `${name}'s` : "My"} grocery list from Saheli:\n${lines.join("\n")}`;
}

/* ---------------- Sample coach plan (made up) ---------------- */

export function priyaDietPlan(writtenAt: string): CoachPlan {
  return {
    intro:
      "Priya, your last two reports show low iron and low vitamin D, so this plan puts iron-rich food with vitamin C at most meals, keeps tea and coffee away from meals, and adds morning sun and vitamin D foods. Eat to your hunger, and add 100 kcal or so before your period.",
    writtenAt,
    meals: [
      { slot: "Early morning", items: "Warm water with 5 soaked almonds, 2 walnuts and 2 dates. 15 minutes of morning sun on your arms." },
      { slot: "Breakfast", items: "Ragi dosa or moong dal chilla with mint chutney, plus an orange or a few slices of amla. Have tea at least 1 hour later." },
      { slot: "Lunch", items: "Palak dal or rajma, 2 jowar rotis, beetroot or bhindi sabzi, a bowl of curd and lemon squeezed over the dal." },
      { slot: "Evening", items: "Roasted chana with a guava, or sprouts chaat with pomegranate. A glass of milk if you're hungry." },
      { slot: "Dinner", items: "Paneer or egg bhurji with sauteed spinach and mushrooms, 1 roti, and a small katori of moong dal. Mushrooms left in the sun for 30 minutes have more vitamin D." },
    ],
  };
}
