export const dynamic = "force-dynamic";

interface UsdaNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}
interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaNutrient[];
}

const IDS = { kcal: 1008, protein: 1003, carbs: 1005, fat: 1004, fibre: 1079 } as const;

function nutrient(f: UsdaFood, id: number): number {
  const n = f.foodNutrients?.find((x) => x.nutrientId === id || x.nutrientNumber === String(id));
  if (!n?.value) {
    // Some foods give energy in kJ only
    if (id === IDS.kcal) {
      const kj = f.foodNutrients?.find((x) => x.nutrientName === "Energy" && x.unitName?.toUpperCase() === "KJ");
      if (kj?.value) return kj.value / 4.184;
    }
    return 0;
  }
  return n.value;
}

function titleCase(s: string) {
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Search USDA FoodData Central. Values are per 100 g. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80) {
    return Response.json({ ok: false, error: "Type at least 2 letters to search." }, { status: 400 });
  }

  const key = process.env.USDA_API_KEY?.trim() || "DEMO_KEY";
  // USDA's server is picky: spaces as %20 (not +), literal commas, and explicit headers.
  const url =
    "https://api.nal.usda.gov/fdc/v1/foods/search" +
    `?query=${encodeURIComponent(q)}&pageSize=12&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)&api_key=${encodeURIComponent(key)}`;

  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Saheli/1.0 (women's wellness app)" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (res.status !== 429 && res.status < 500) break;
    } catch {
      res = null;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
  }

  if (res?.status === 429) {
    return Response.json(
      { ok: false, error: "The food database is busy this hour. You can still pick from Saheli's list or add your own food." },
      { status: 429 },
    );
  }
  if (!res || !res.ok) {
    return Response.json(
      { ok: false, error: "The food database isn't answering right now. You can still pick from Saheli's list or add your own food." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { foods?: UsdaFood[] };
  const foods = (data.foods ?? [])
    .map((f) => ({
      id: `usda-${f.fdcId}`,
      name: titleCase(f.description).slice(0, 80),
      portion: "100 g",
      kcal: Math.round(nutrient(f, IDS.kcal)),
      protein: Math.round(nutrient(f, IDS.protein) * 10) / 10,
      carbs: Math.round(nutrient(f, IDS.carbs) * 10) / 10,
      fat: Math.round(nutrient(f, IDS.fat) * 10) / 10,
      fibre: Math.round(nutrient(f, IDS.fibre) * 10) / 10,
    }))
    .filter((f) => f.kcal > 0 || f.protein > 0);

  return Response.json({ ok: true, foods, source: "USDA FoodData Central" });
}
