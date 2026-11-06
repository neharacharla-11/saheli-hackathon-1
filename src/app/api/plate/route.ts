import { aiConfigured, claude, CLAUDE_MODEL, describeAiError, friendlyError, NOT_SWITCHED_ON, readJson } from "@/lib/server/claude";
import { FOODS, foodById } from "@/lib/foods";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return Response.json({ configured: aiConfigured() });
}

const MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;
type Media = (typeof MEDIA)[number];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["isFood", "items", "note"],
  properties: {
    isFood: { type: "boolean", description: "False if the photo does not show food or drink." },
    note: { type: "string", description: "One short, kind sentence about the meal. No emoji, no exclamation marks." },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["foodId", "name", "portions", "portionLabel", "kcal", "protein", "carbs", "fat", "fibre"],
        properties: {
          foodId: { type: "string", description: "The id from the food list if one matches well, otherwise an empty string." },
          name: { type: "string", description: "What the food is, in plain words." },
          portions: { type: "number", description: "How many of the list's portions are on the plate (for example 2 for two rotis, 0.5 for half a katori)." },
          portionLabel: { type: "string", description: "The portion one unit means, for example '1 roti (40 g)'. Use the list's portion when foodId is set." },
          kcal: { type: "number", description: "Estimated kcal for ONE portion." },
          protein: { type: "number", description: "Grams of protein for ONE portion." },
          carbs: { type: "number", description: "Grams of carbs for ONE portion." },
          fat: { type: "number", description: "Grams of fat for ONE portion." },
          fibre: { type: "number", description: "Grams of fibre for ONE portion." },
        },
      },
    },
  },
} as const;

const FOOD_LIST = FOODS.map((f) => `${f.id} | ${f.name} | ${f.portion}`).join("\n");

interface PlateItem {
  foodId: string;
  name: string;
  portions: number;
  portionLabel: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

const num = (v: unknown, max: number) => (typeof v === "number" && isFinite(v) ? Math.min(max, Math.max(0, v)) : 0);

export async function POST(req: Request) {
  if (!aiConfigured()) return friendlyError(NOT_SWITCHED_ON, 503, { configured: false });

  const body = await readJson<{ image?: string; mediaType?: string; hint?: string }>(req);
  if (!body) return friendlyError("That photo is too big. Please try a smaller one.", 413);
  const image = typeof body.image === "string" ? body.image.replace(/^data:[^,]+,/, "") : "";
  const mediaType = (MEDIA as readonly string[]).includes(body.mediaType ?? "") ? (body.mediaType as Media) : null;
  if (!image || !mediaType || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) {
    return friendlyError("Please choose a photo of your meal (JPEG, PNG or WebP).", 400);
  }
  if (image.length > 4_300_000) return friendlyError("That photo is too big. Please try a smaller one.", 413);
  const hint = typeof body.hint === "string" ? body.hint.trim().slice(0, 200) : "";

  try {
    const res = await claude().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      system:
        "You look at a photo of a meal and list each food and drink you can see with a realistic portion estimate. Indian home food is common: rotis, rice, dal, sabzi, curd, chutney, pickle, salad. Match each item to the food list when one is a good match and copy its id exactly; otherwise leave foodId empty and estimate the nutrition per portion yourself. Count pieces (rotis, idlis, dosas) carefully. Small sides like pickle or chutney count too. Be honest when unsure, using your best estimate.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            {
              type: "text",
              text: `Food list (id | name | portion):\n${FOOD_LIST}\n\n${hint ? `She says: "${hint}"\n\n` : ""}List what's on this plate.`,
            },
          ],
        },
      ],
    });

    if (res.stop_reason === "refusal") return friendlyError("Saheli couldn't read that photo. Please try another one.", 422);
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return friendlyError("Saheli couldn't read that photo. Please try another one.", 502);

    let parsed: { isFood?: boolean; note?: string; items?: PlateItem[] };
    try {
      parsed = JSON.parse(text.text);
    } catch {
      return friendlyError("Saheli couldn't read that photo. Please try another one.", 502);
    }
    if (!parsed.isFood || !Array.isArray(parsed.items) || !parsed.items.length) {
      return friendlyError("Saheli couldn't spot any food in that photo. Try a clearer photo from above.", 422);
    }

    const items = parsed.items.slice(0, 15).map((it) => {
      const match = it.foodId ? foodById(it.foodId) : undefined;
      return {
        foodId: match?.id ?? null,
        name: match?.name ?? String(it.name ?? "Food").slice(0, 80),
        portion: match?.portion ?? String(it.portionLabel ?? "1 portion").slice(0, 60),
        qty: Math.round(num(it.portions, 20) * 2) / 2 || 1,
        per: match
          ? { kcal: match.kcal, protein: match.protein, carbs: match.carbs, fat: match.fat, fibre: match.fibre }
          : {
              kcal: Math.round(num(it.kcal, 2000)),
              protein: num(it.protein, 200),
              carbs: num(it.carbs, 300),
              fat: num(it.fat, 200),
              fibre: num(it.fibre, 60),
            },
      };
    });

    return Response.json({ ok: true, items, note: String(parsed.note ?? "").slice(0, 240) });
  } catch (err) {
    const { message, status } = describeAiError(err);
    return friendlyError(message, status);
  }
}
