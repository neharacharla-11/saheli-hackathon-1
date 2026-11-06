/* Plain-language pregnancy content. General guidance only, never a diagnosis. */

export interface WeekInfo {
  week: number;
  size: string; // "a large cucumber"
  length: string; // "about 40 cm"
  weight: string; // "about 1.3 kg"
  baby: string;
  you: string;
  scale: number; // 0-1, for the little size dot
}

type Row = [number, string, string, string, string, string];

// [week, size, length, weight, baby, you]
const ROWS: Row[] = [
  [4, "a poppy seed", "about 1 mm", "", "A tiny ball of cells is settling into the lining of your womb.", "Your period is late. A home test may now show positive."],
  [5, "a sesame seed", "about 2 mm", "", "The heart and brain are starting to form.", "Tiredness, sore breasts and needing to wee more often are common."],
  [6, "a lentil", "about 4 mm", "", "A tiny heart has begun to beat.", "Morning sickness can start now, at any time of day."],
  [7, "a blueberry", "about 1 cm", "", "Little buds that will become arms and legs appear.", "Small, frequent meals help with nausea."],
  [8, "a rajma bean", "about 1.6 cm", "about 1 g", "Fingers and toes are beginning to form.", "Your first check-up and dating scan are usually around now."],
  [9, "a grape", "about 2.3 cm", "about 2 g", "Baby has started making tiny movements you can't feel yet.", "Feeling emotional is normal. Hormones are working hard."],
  [10, "a kumquat", "about 3 cm", "about 4 g", "All the main organs are in place and growing.", "Your waist may start to feel snug."],
  [11, "a fig", "about 4 cm", "about 7 g", "Baby can open and close tiny fists.", "Nausea often starts to ease soon."],
  [12, "a lime", "about 5.5 cm", "about 14 g", "Reflexes are developing. Baby may suck a thumb.", "The NT scan is usually between weeks 11 and 14."],
  [13, "a lemon", "about 7 cm", "about 23 g", "Fingerprints are forming.", "The end of the first trimester. Many women feel more like themselves."],
  [14, "a peach", "about 8.5 cm", "about 43 g", "Baby can make faces: squinting, frowning.", "Energy often comes back in the second trimester."],
  [15, "an apple", "about 10 cm", "about 70 g", "Baby can sense light through closed eyelids.", "A stuffy nose and bleeding gums are common."],
  [16, "an avocado", "about 11.5 cm", "about 100 g", "Tiny muscles are getting stronger.", "Some women feel the first flutters now."],
  [17, "an onion", "about 13 cm", "about 140 g", "Baby is starting to store a little fat.", "Your bump is starting to show."],
  [18, "a sweet potato", "about 14 cm", "about 190 g", "Baby can hear sounds, including your voice.", "Sleeping on your side gets more comfortable."],
  [19, "a mango", "about 15 cm", "about 240 g", "A protective coating covers baby's skin.", "Mild aches in your hips and back are common."],
  [20, "a banana", "about 25 cm head to heel", "about 300 g", "Halfway. Baby swallows and practises breathing movements.", "The anomaly scan is usually now."],
  [21, "a carrot", "about 27 cm", "about 360 g", "Baby's movements are getting stronger.", "You may feel kicks and rolls more clearly."],
  [22, "a papaya", "about 28 cm", "about 430 g", "Eyebrows and eyelids are formed.", "Stretch marks may appear. They fade with time."],
  [23, "a large mango", "about 29 cm", "about 500 g", "Baby has regular times of sleeping and waking.", "Swollen ankles at the end of the day are common."],
  [24, "an ear of corn", "about 30 cm", "about 600 g", "The lungs are developing fast.", "The sugar test is usually between weeks 24 and 28."],
  [25, "a cauliflower", "about 34 cm", "about 660 g", "Baby responds to your touch and voice.", "Heartburn is common. Smaller meals help."],
  [26, "a lettuce", "about 35 cm", "about 760 g", "Baby's eyes begin to open.", "Sleep may get harder. A pillow between your knees helps."],
  [27, "a cabbage", "about 36 cm", "about 875 g", "Baby has hiccups you may feel as little jumps.", "The last week of the second trimester."],
  [28, "an aubergine", "about 37 cm", "about 1 kg", "Baby can blink and is putting on fat.", "Start counting kicks every day. Know your baby's pattern."],
  [29, "a butternut squash", "about 38 cm", "about 1.15 kg", "Muscles and lungs keep maturing.", "Breathlessness is common as baby grows upwards."],
  [30, "a large cucumber", "about 40 cm", "about 1.3 kg", "Baby's brain is growing quickly and eyes can follow light.", "You may feel tired again and need the loo more often."],
  [31, "a coconut", "about 41 cm", "about 1.5 kg", "Baby can turn the head from side to side.", "Practice tightenings (Braxton Hicks) may come and go."],
  [32, "a bunch of bananas", "about 42 cm", "about 1.7 kg", "Toenails and fingernails have grown.", "The growth scan is usually around now."],
  [33, "a pineapple", "about 44 cm", "about 1.9 kg", "Bones are hardening, but the skull stays soft for birth.", "Pack your hospital bag over the next few weeks."],
  [34, "a melon", "about 45 cm", "about 2.1 kg", "Baby's lungs are nearly ready.", "Rest when you can. Short walks still help."],
  [35, "a honeydew melon", "about 46 cm", "about 2.4 kg", "Baby is gaining about 200 g a week.", "Baby may move lower, making breathing easier."],
  [36, "a large papaya", "about 47 cm", "about 2.6 kg", "Most babies settle head down by now.", "Weekly check-ups often start now."],
  [37, "a winter melon", "about 48 cm", "about 2.9 kg", "Baby is now early term.", "Your body is getting ready. Know the signs of labour."],
  [38, "a small pumpkin", "about 49 cm", "about 3.1 kg", "Baby is practising sucking and gripping.", "Keep your phone charged and your bag by the door."],
  [39, "a small watermelon", "about 50 cm", "about 3.3 kg", "Baby is fully ready to meet you.", "Rest, eat well and let people help you."],
  [40, "a watermelon", "about 51 cm", "about 3.4 kg", "Your due date. Only a few babies arrive on the day itself.", "Talk to your doctor about what happens if baby is late."],
];

export const WEEKS: WeekInfo[] = ROWS.map(([week, size, length, weight, baby, you]) => ({
  week,
  size,
  length,
  weight,
  baby,
  you,
  scale: Math.min(1, 0.12 + (week - 4) / 40),
}));

export function weekInfo(week: number): WeekInfo {
  const w = Math.max(4, Math.min(40, week));
  return WEEKS.find((x) => x.week === w) ?? WEEKS[WEEKS.length - 1];
}

/* ---------------- Trimester guide ---------------- */

export type GuideTopic = "expect" | "feelings" | "tests" | "walks" | "workouts";

export const GUIDE_TOPICS: { id: GuideTopic; label: string }[] = [
  { id: "expect", label: "What to expect" },
  { id: "feelings", label: "Feelings" },
  { id: "tests", label: "Tests" },
  { id: "walks", label: "Walks and yoga" },
  { id: "workouts", label: "Workouts" },
];

export interface GuideSection {
  intro: string;
  points: string[];
  avoid?: string[];
}

export const TRIMESTER_GUIDE: Record<1 | 2 | 3, Record<GuideTopic, GuideSection>> = {
  1: {
    expect: {
      intro: "Weeks 1 to 13. A lot is happening inside, even if nothing shows yet.",
      points: [
        "Tiredness, nausea and sore breasts are very common.",
        "Needing to wee more often, and a stronger sense of smell.",
        "Start folic acid every day if you haven't already.",
        "Some light spotting can happen. Heavy bleeding or pain needs a call to your doctor.",
      ],
    },
    feelings: {
      intro: "Joy, worry and tiredness can all show up in the same day.",
      points: [
        "Mood swings are normal. Hormones are changing fast.",
        "It's okay to wait to tell people until you feel ready.",
        "If worry takes over your days, tell your doctor. Help works.",
      ],
    },
    tests: {
      intro: "Your first visits set up the rest of your care.",
      points: [
        "Blood tests: blood group, haemoglobin, thyroid, sugar and infections.",
        "Urine test and blood pressure at every visit.",
        "Dating scan (around 8 weeks) and NT scan (11 to 14 weeks).",
      ],
    },
    walks: {
      intro: "Gentle movement can ease nausea and tiredness.",
      points: [
        "Walk 15 to 30 minutes most days, at a pace where you can still talk.",
        "Gentle stretching, cat-cow and butterfly pose.",
        "Slow breathing (pranayama without breath-holding).",
      ],
    },
    workouts: {
      intro: "If you were active before, you can usually carry on, a little gentler.",
      points: ["Walking, swimming, a stationary bike.", "Light strength work with good form.", "Pelvic floor squeezes every day."],
      avoid: ["Hot yoga or getting very overheated.", "Contact sports and anything with a risk of falling.", "Holding your breath while lifting."],
    },
  },
  2: {
    expect: {
      intro: "Weeks 14 to 27. Often the most comfortable stretch.",
      points: [
        "Energy usually comes back and nausea eases.",
        "Your bump shows and you'll feel the first movements.",
        "Backache, heartburn and leg cramps can start.",
        "A good time to plan, shop and rest a little more.",
      ],
    },
    feelings: {
      intro: "Feeling baby move can make it all feel real.",
      points: [
        "Body changes can bring mixed feelings. That's okay.",
        "Share how you feel with your partner or someone close.",
        "Low mood that lasts more than 2 weeks is worth telling your doctor about.",
      ],
    },
    tests: {
      intro: "Checks to see baby is growing well.",
      points: [
        "Anomaly scan (18 to 22 weeks).",
        "Sugar test (glucose tolerance), usually 24 to 28 weeks.",
        "Haemoglobin check. Iron tablets if you're low.",
      ],
    },
    walks: {
      intro: "Walking and prenatal yoga are wonderful now.",
      points: [
        "30 minutes of walking most days.",
        "Prenatal yoga: side stretches, supported squats, cat-cow.",
        "From about 16 weeks, avoid lying flat on your back for long.",
      ],
    },
    workouts: {
      intro: "Keep moving, adapt as your bump grows.",
      points: ["Swimming and water aerobics.", "Light weights, seated or standing.", "Pelvic floor and gentle core work (no crunches)."],
      avoid: ["Crunches and sit-ups.", "Lying flat on your back for long.", "Heavy lifting, jumping and contact sports.", "Scuba diving and high altitudes."],
    },
  },
  3: {
    expect: {
      intro: "Weeks 28 to 40. Baby grows fast and your body gets ready.",
      points: [
        "Breathlessness, heartburn and needing the loo often.",
        "Practice tightenings (Braxton Hicks) that come and go.",
        "Swollen ankles are common. Sudden swelling of face or hands is not: call your doctor.",
        "Count kicks every day and know your baby's pattern.",
      ],
    },
    feelings: {
      intro: "Excitement and nerves about the birth are both normal.",
      points: [
        "Write your birth plan. It helps you feel prepared.",
        "Poor sleep can lower your mood. Rest in the day if you can.",
        "Tell someone if you feel very anxious or hopeless.",
      ],
    },
    tests: {
      intro: "Visits get more frequent.",
      points: ["Growth scan around 32 weeks.", "Blood pressure and urine at every visit.", "Baby's position checked around 36 weeks.", "Group B strep test in some countries."],
    },
    walks: {
      intro: "Shorter, slower walks still help a lot.",
      points: [
        "Two 15-minute walks are easier than one long one.",
        "Birthing ball: gentle circles and bounces.",
        "Supported squats and hip opening to help baby settle.",
      ],
    },
    workouts: {
      intro: "Comfort first. Listen to your body.",
      points: ["Walking, swimming, birthing ball.", "Pelvic floor squeezes and gentle stretches.", "Breathing practice for labour."],
      avoid: ["Lying flat on your back.", "Heavy lifting and high-impact moves.", "Anything that causes pain, bleeding or dizziness: stop and call your doctor."],
    },
  },
};

/* ---------------- Warning signs ---------------- */

export const WARNING_SIGNS: string[] = [
  "Bleeding from your vagina, or fluid leaking",
  "Baby moving less than usual, or a change in the pattern",
  "Severe headache, blurred vision or flashing lights",
  "Sudden swelling of your face, hands or feet",
  "Severe tummy pain, or pain that doesn't go away",
  "Fever of 38 °C or more, or shivering",
  "Regular tightenings or contractions before 37 weeks",
  "Burning when you wee, or very itchy hands and feet",
  "Thoughts of harming yourself or your baby",
];

/* ---------------- Eating well ---------------- */

export const EATING_WELL = {
  eat: [
    "Protein at every meal: dal, paneer, eggs, curd, fish, chicken, tofu.",
    "Iron with vitamin C: palak, rajma, chana with lemon or amla.",
    "Calcium: milk, curd, ragi, sesame (til).",
    "Fibre and water against constipation: fruit, whole grains, 8 to 10 glasses a day.",
    "Folic acid, iron and calcium tablets as your doctor advises.",
  ],
  avoid: [
    "Raw or undercooked eggs, meat and fish.",
    "Unpasteurised milk and soft cheeses made from it.",
    "High-mercury fish (shark, swordfish, king mackerel).",
    "Alcohol and smoking. No amount is known to be safe.",
    "More than 200 mg caffeine a day (about 2 cups of tea or 1 coffee).",
  ],
  extra: "You don't need to eat for two, just a little more from the second trimester. Your coach will set your plan personally.",
};

/* ---------------- Symptoms ---------------- */

export interface PregSymptom {
  id: string;
  label: string;
  tip: string;
  urgent?: boolean;
}

export const PREG_SYMPTOMS: PregSymptom[] = [
  { id: "nausea", label: "Nausea", tip: "Small meals every 2 hours, dry toast or crackers, ginger or lemon water." },
  { id: "heartburn", label: "Heartburn", tip: "Smaller meals, stay upright after eating, avoid spicy food late at night." },
  { id: "backache", label: "Back ache", tip: "A warm (not hot) pack, cat-cow stretches, and a pillow between your knees." },
  { id: "swollen-feet", label: "Swollen feet", tip: "Feet up when you sit, short walks, and plenty of water." },
  { id: "tired", label: "Tired", tip: "Rest when you can, and ask for help. Check your iron at your next visit." },
  { id: "poor-sleep", label: "Poor sleep", tip: "Sleep on your side with pillows, and a calm wind-down without screens." },
  { id: "leg-cramps", label: "Leg cramps", tip: "Stretch your calves before bed and drink enough water." },
  { id: "constipation", label: "Constipation", tip: "More fibre, fruit and water. Iron tablets can make it worse: ask your doctor." },
  { id: "tightenings", label: "Tightenings", tip: "Practice tightenings come and go. If they get regular, use the contraction timer." },
  { id: "headache", label: "Headache", tip: "Rest and water. A severe headache with blurred vision needs a call to your doctor today.", urgent: true },
  { id: "face-swelling", label: "Swollen face or hands", tip: "Sudden swelling of face or hands can be a sign of high blood pressure. Call your doctor today.", urgent: true },
];

/* ---------------- Hospital bag ---------------- */

export const BAG_FOR_YOU: { id: string; label: string }[] = [
  { id: "y-notes", label: "Pregnancy notes and ID" },
  { id: "y-plan", label: "Birth plan (printed)" },
  { id: "y-gown", label: "Loose nightdress or kurta" },
  { id: "y-bras", label: "2 nursing bras" },
  { id: "y-pads", label: "Maternity pads" },
  { id: "y-underwear", label: "Comfy underwear" },
  { id: "y-socks", label: "Warm socks and slippers" },
  { id: "y-toiletries", label: "Toothbrush and toiletries" },
  { id: "y-towel", label: "Towel" },
  { id: "y-charger", label: "Phone charger" },
  { id: "y-snacks", label: "Snacks and a water bottle" },
  { id: "y-lipbalm", label: "Lip balm and hair ties" },
  { id: "y-going-home", label: "Going-home clothes" },
];

export const BAG_FOR_BABY: { id: string; label: string }[] = [
  { id: "b-vests", label: "4 vests" },
  { id: "b-sleepsuits", label: "4 sleepsuits" },
  { id: "b-hat", label: "Soft hat" },
  { id: "b-socks", label: "Socks or booties" },
  { id: "b-nappies", label: "Newborn nappies" },
  { id: "b-wipes", label: "Cotton wool or water wipes" },
  { id: "b-swaddle", label: "Muslin cloths and a swaddle" },
  { id: "b-blanket", label: "Warm blanket" },
  { id: "b-going-home", label: "Going-home outfit" },
  { id: "b-carseat", label: "Car seat, if you're driving" },
];

/* ---------------- Mood support ---------------- */

/** Extra perinatal mental health lines, added to her country's helplines. */
export const PERINATAL_LINES: Record<string, { label: string; number: string; display?: string }[]> = {
  IN: [{ label: "Tele MANAS (mental health)", number: "14416" }],
  US: [
    { label: "Maternal Mental Health Hotline", number: "18338526262", display: "1-833-852-6262" },
    { label: "Suicide and Crisis Lifeline", number: "988" },
  ],
  GB: [
    { label: "Samaritans", number: "116123", display: "116 123" },
    { label: "NHS 111 (option 2, mental health)", number: "111" },
  ],
  AU: [
    { label: "PANDA helpline", number: "1300726306", display: "1300 726 306" },
    { label: "Lifeline", number: "131114", display: "13 11 14" },
  ],
};
