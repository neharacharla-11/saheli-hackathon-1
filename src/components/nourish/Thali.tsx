"use client";

import { useMemo, useState } from "react";
import { Check, Database, Loader2, Minus, Plus, Search, X } from "lucide-react";
import { addTotals, FOOD_CATEGORIES, FOODS, fitsDiet, scale, searchFoods, type FoodCategory, type Totals } from "@/lib/foods";
import { addCustomFood, addFoodEntries, mealForNow, MEALS, useMyDay } from "@/lib/myDay";
import { todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";
import type { CustomFood, MealSlot } from "@/lib/types";
import { fmt, fmt1, Notice } from "./bits";
import { SnapPlate, type SnapItem } from "./SnapPlate";

export interface FoodLike extends Totals {
  id: string;
  name: string;
  portion: string;
  category?: FoodCategory | "own" | "usda";
  source: "list" | "own" | "usda" | "photo";
}

interface PlateItem {
  food: FoodLike;
  qty: number;
}

const CAT_COLOUR: Record<string, string> = {
  rotis: "#E8C28A",
  breakfast: "#F1D08F",
  dal: "#EDB24C",
  sabzi: "#8DBE8B",
  meat: "#D9896A",
  snacks: "#E7A0B5",
  drinks: "#9EC3DE",
  own: "#C9B3E6",
  usda: "#B8C9A4",
};

const NO_CUSTOM: CustomFood[] = [];

export function Thali() {
  const { profile, coachReason } = useMyDay();
  const showNumbers = coachReason !== "eating";
  const customFoods = useProfileStore((s) => s.customFoods ?? NO_CUSTOM);
  const [meal, setMeal] = useState<MealSlot>(() => mealForNow());
  const [plate, setPlate] = useState<PlateItem[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<FoodCategory | "all" | "own">("all");
  const [showAll, setShowAll] = useState(false);
  const [usda, setUsda] = useState<{ q: string; foods: FoodLike[]; error?: string; loading: boolean } | null>(null);
  const [ownOpen, setOwnOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const mealLabel = MEALS.find((m) => m.id === meal)!.label.toLowerCase();

  const own: FoodLike[] = useMemo(
    () => customFoods.map((f) => ({ ...f, category: "own" as const, source: "own" as const })),
    [customFoods],
  );

  const list: FoodLike[] = useMemo(() => {
    const base = FOODS.filter((f) => fitsDiet(f, profile?.diet)).map((f) => ({ ...f, source: "list" as const }));
    const pool = cat === "own" ? own : cat === "all" ? [...own, ...base] : base.filter((f) => f.category === cat);
    return query.trim() ? (searchFoods(query, pool as never) as unknown as FoodLike[]) : pool;
  }, [profile?.diet, cat, query, own]);

  const visible = showAll || query ? list : list.slice(0, 30);
  const totals = addTotals(plate.map((p) => scale(p.food, p.qty)));

  function qtyOf(id: string) {
    return plate.find((p) => p.food.id === id)?.qty ?? 0;
  }

  function change(food: FoodLike, delta: number) {
    setDone(null);
    setPlate((cur) => {
      const found = cur.find((p) => p.food.id === food.id);
      if (!found) return delta > 0 ? [...cur, { food, qty: delta }] : cur;
      const qty = Math.round((found.qty + delta) * 2) / 2;
      return qty <= 0 ? cur.filter((p) => p.food.id !== food.id) : cur.map((p) => (p.food.id === food.id ? { ...p, qty } : p));
    });
  }

  function addToMeal() {
    if (!plate.length) return;
    addFoodEntries(
      todayISO(),
      plate.map((p) => ({
        foodId: p.food.source === "list" ? p.food.id : undefined,
        name: p.food.name,
        portion: p.food.portion,
        qty: p.qty,
        ...scale(p.food, p.qty),
        meal,
        source: p.food.source,
      })),
    );
    setPlate([]);
    setDone(`Added to ${mealLabel}.`);
  }

  function addSnapped(items: SnapItem[]) {
    setDone(null);
    setPlate((cur) => {
      const next = [...cur];
      for (const it of items) {
        const id = it.foodId ?? `photo-${it.name.toLowerCase().replace(/[^a-z]+/g, "-")}`;
        const food: FoodLike = { id, name: it.name, portion: it.portion, ...it.per, source: it.foodId ? "list" : "photo" };
        const i = next.findIndex((p) => p.food.id === id);
        if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + it.qty };
        else next.push({ food, qty: it.qty });
      }
      return next;
    });
  }

  async function searchUsda() {
    const q = query.trim();
    if (q.length < 2) return;
    setUsda({ q, foods: [], loading: true });
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { ok: boolean; foods?: Omit<FoodLike, "source">[]; error?: string };
      if (!data.ok) setUsda({ q, foods: [], loading: false, error: data.error });
      else
        setUsda({
          q,
          loading: false,
          foods: (data.foods ?? []).map((f) => ({ ...f, category: "usda" as const, source: "usda" as const })),
          error: data.foods?.length ? undefined : "Nothing found there. Try a simpler word, or add your own food.",
        });
    } catch {
      setUsda({ q, foods: [], loading: false, error: "Couldn't reach the food database. Please check your connection." });
    }
  }

  return (
    <section aria-labelledby="thali-title">
      <h2 id="thali-title" className="mb-1 font-display text-[1.6rem] text-ink">
        Build your thali
      </h2>
      <p className="mb-4 text-ink-soft">Pick a meal, tap + on what you ate, and Saheli adds it up.</p>

      <div className="grid gap-5 md:grid-cols-[45fr_55fr]">
        {/* Plate */}
        <div className="md:sticky md:top-6 md:self-start">
          <div className="card">
            <div role="tablist" aria-label="Meal" className="mb-5 grid grid-cols-4 gap-1 rounded-full bg-surface-2 p-1">
              {MEALS.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={meal === m.id}
                  onClick={() => setMeal(m.id)}
                  className={`h-9 rounded-full text-[13px] font-semibold transition-colors sm:text-sm ${
                    meal === m.id ? "bg-ink text-surface" : "text-ink hover:bg-surface"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <PlateDrawing items={plate} />

            {showNumbers && (
              <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                <Total label="kcal" value={fmt(totals.kcal)} big />
                <Total label="Protein" value={`${fmt1(totals.protein)} g`} />
                <Total label="Carbs" value={`${fmt1(totals.carbs)} g`} />
                <Total label="Fibre" value={`${fmt1(totals.fibre)} g`} />
              </div>
            )}

            {plate.length > 0 && (
              <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
                {plate.map((p) => (
                  <li key={p.food.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{p.food.name}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {p.qty} x {p.food.portion}
                        {showNumbers && ` · ${fmt(p.food.kcal * p.qty)} kcal`}
                      </span>
                    </span>
                    <QtyButtons qty={p.qty} onMinus={() => change(p.food, p.qty <= 1 ? -p.qty : -1)} onPlus={() => change(p.food, 1)} name={p.food.name} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn btn-primary flex-1" onClick={addToMeal} disabled={!plate.length}>
                <Check size={18} aria-hidden="true" />
                Add to {mealLabel}
              </button>
              {plate.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setPlate([])}>
                  Clear
                </button>
              )}
            </div>
            {done && (
              <p className="mt-3 text-sm font-semibold text-accent-ink" role="status">
                {done} You&apos;ll see it under Today&apos;s meals.
              </p>
            )}
          </div>
        </div>

        {/* Food list */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="card min-w-0">
            <label className="relative block">
              <span className="sr-only">Search foods</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
              <input
                className="input rounded-full pl-11"
                placeholder="Search roti, dal, paneer, apple..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setUsda(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && list.length === 0 && searchUsda()}
                type="search"
                enterKeyHint="search"
              />
            </label>

            <div className="fade-x -mx-1 mt-3 flex gap-2 px-1 pb-1 pr-10" role="group" aria-label="Filter foods">
              <FilterChip on={cat === "all"} onClick={() => setCat("all")}>
                All
              </FilterChip>
              {FOOD_CATEGORIES.map((c) => (
                <FilterChip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.label}
                </FilterChip>
              ))}
              {own.length > 0 && (
                <FilterChip on={cat === "own"} onClick={() => setCat("own")}>
                  My foods
                </FilterChip>
              )}
            </div>

            <ul className="mt-3 flex flex-col divide-y divide-line">
              {visible.map((f) => (
                <FoodRow key={f.id} food={f} qty={qtyOf(f.id)} showNumbers={showNumbers} onChange={(d) => change(f, d)} />
              ))}
            </ul>

            {list.length === 0 && (
              <p className="py-4 text-sm text-ink-soft">
                Nothing in Saheli&apos;s list for &ldquo;{query}&rdquo;. Try the USDA database below or add your own.
              </p>
            )}
            {!showAll && !query && list.length > visible.length && (
              <button className="btn btn-secondary btn-sm mt-3 w-full" onClick={() => setShowAll(true)}>
                Show all {list.length} foods
              </button>
            )}

            {query.trim().length >= 2 && (
              <div className="mt-4 border-t border-line pt-4">
                {!usda || usda.q !== query.trim() ? (
                  <button className="btn btn-secondary btn-sm" onClick={searchUsda}>
                    <Database size={16} aria-hidden="true" />
                    Also search the USDA food database
                  </button>
                ) : usda.loading ? (
                  <p className="flex items-center gap-2 text-sm text-ink-soft">
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Looking in the USDA database...
                  </p>
                ) : (
                  <>
                    <p className="label mb-1">From USDA FoodData Central · per 100 g</p>
                    {usda.error && <p className="text-sm text-ink-soft">{usda.error}</p>}
                    <ul className="flex flex-col divide-y divide-line">
                      {usda.foods.map((f) => (
                        <FoodRow key={f.id} food={f} qty={qtyOf(f.id)} showNumbers={showNumbers} onChange={(d) => change(f, d)} />
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              {ownOpen ? (
                <OwnFoodForm
                  initialName={list.length === 0 ? query : ""}
                  onCancel={() => setOwnOpen(false)}
                  onSave={(f) => {
                    const saved = addCustomFood(f);
                    change({ ...saved, category: "own", source: "own" }, 1);
                    setOwnOpen(false);
                  }}
                />
              ) : (
                <button className="btn btn-ghost btn-sm -ml-2 text-primary-ink" onClick={() => setOwnOpen(true)}>
                  <Plus size={16} aria-hidden="true" />
                  Add your own food
                </button>
              )}
            </div>
          </div>

          <SnapPlate onConfirm={addSnapped} showNumbers={showNumbers} />
        </div>
      </div>
    </section>
  );
}

function Total({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-1 py-2.5">
      <p className={`font-display leading-none text-ink tabular ${big ? "text-[1.4rem]" : "text-[1.1rem]"}`}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="chip chip-sm shrink-0"
      aria-pressed={on}
      onClick={(e) => {
        onClick();
        e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }}
    >
      {children}
    </button>
  );
}

function QtyButtons({ qty, onMinus, onPlus, name }: { qty: number; onMinus: () => void; onPlus: () => void; name: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2" onClick={onMinus} aria-label={`One less ${name}`}>
        <Minus size={15} aria-hidden="true" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular" aria-live="polite">
        {qty}
      </span>
      <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary hover:brightness-105" onClick={onPlus} aria-label={`One more ${name}`}>
        <Plus size={15} aria-hidden="true" />
      </button>
    </span>
  );
}

function FoodRow({ food, qty, showNumbers, onChange }: { food: FoodLike; qty: number; showNumbers: boolean; onChange: (delta: number) => void }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CAT_COLOUR[food.category ?? "own"] ?? CAT_COLOUR.own }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{food.name}</span>
        <span className="block truncate text-[13px] text-ink-soft tabular">
          {food.portion}
          {showNumbers && ` · ${fmt(food.kcal)} kcal · ${fmt1(food.protein)} g protein`}
        </span>
      </span>
      {qty > 0 ? (
        <QtyButtons qty={qty} name={food.name} onMinus={() => onChange(qty <= 1 ? -qty : -1)} onPlus={() => onChange(1)} />
      ) : (
        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink transition-colors hover:bg-primary hover:text-on-primary"
          onClick={() => onChange(1)}
          aria-label={`Add ${food.name} to your plate`}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

/** The round plate with the foods on it. */
function PlateDrawing({ items }: { items: PlateItem[] }) {
  const shown = items.slice(0, 7);
  const extra = items.length - shown.length;
  const n = shown.length;
  return (
    <div className="mx-auto aspect-square w-full max-w-[300px]">
      <div
        className="relative h-full w-full rounded-full border border-line"
        style={{
          background: "radial-gradient(circle at 50% 45%, var(--surface) 0 58%, color-mix(in srgb, var(--surface-2) 70%, var(--surface)) 58.5% 100%)",
          boxShadow: "var(--shadow-soft), inset 0 0 0 10px color-mix(in srgb, var(--surface-2) 55%, transparent)",
        }}
        role="img"
        aria-label={n ? `Your plate: ${items.map((i) => `${i.qty} ${i.food.name}`).join(", ")}` : "Your plate is empty"}
      >
        <div className="absolute inset-[16%] rounded-full border border-dashed border-line" aria-hidden="true" />
        {n === 0 && (
          <p className="absolute inset-0 grid place-items-center px-14 text-center text-sm text-ink-soft">Tap + on a food to put it on your plate</p>
        )}
        {shown.map((it, i) => {
          const angle = n === 1 ? 0 : (i / n) * Math.PI * 2 - Math.PI / 2;
          const r = n === 1 ? 0 : n <= 3 ? 22 : 26;
          const x = 50 + Math.cos(angle) * r;
          const y = 50 + Math.sin(angle) * r;
          const size = n === 1 ? 44 : n <= 3 ? 34 : n <= 5 ? 29 : 25;
          const colour = CAT_COLOUR[it.food.category ?? "own"] ?? CAT_COLOUR.own;
          return (
            <div
              key={it.food.id}
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full p-1 text-center transition-all duration-500"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}%`,
                height: `${size}%`,
                background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colour} 55%, white), ${colour})`,
                boxShadow: "0 2px 6px rgb(58 30 42 / 0.12)",
              }}
              aria-hidden="true"
            >
              <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-[#3A1E2A] sm:text-[11px]">
                {it.qty > 1 ? `${it.qty} ` : ""}
                {short(it.food.name)}
              </span>
            </div>
          );
        })}
        {extra > 0 && (
          <span className="absolute bottom-[9%] left-1/2 -translate-x-1/2 rounded-full bg-surface px-2 text-xs font-semibold text-ink-soft">+{extra} more</span>
        )}
      </div>
    </div>
  );
}

function short(name: string) {
  return name.replace(/\s*\(.*\)/, "").split(/[,/]/)[0];
}

function OwnFoodForm({ initialName, onSave, onCancel }: { initialName: string; onSave: (f: Omit<CustomFood, "id">) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: initialName, portion: "1 portion", kcal: "", protein: "", carbs: "", fat: "", fibre: "" });
  const [err, setErr] = useState("");
  const num = (s: string) => Math.max(0, Number(s.replace(",", ".")) || 0);
  const fields: [keyof typeof f, string][] = [
    ["kcal", "kcal"],
    ["protein", "Protein g"],
    ["carbs", "Carbs g"],
    ["fat", "Fat g"],
    ["fibre", "Fibre g"],
  ];
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) return setErr("Please give your food a name.");
        if (!f.kcal) return setErr("Please add the kcal for one portion. The pack label or a quick search will have it.");
        onSave({
          name: f.name.trim().slice(0, 60),
          portion: f.portion.trim().slice(0, 40) || "1 portion",
          kcal: Math.round(num(f.kcal)),
          protein: num(f.protein),
          carbs: num(f.carbs),
          fat: num(f.fat),
          fibre: num(f.fibre),
        });
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">Add your own food</p>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={onCancel} aria-label="Close">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Name, e.g. Amma's thepla" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Food name" />
        <input className="input" placeholder="Portion, e.g. 1 piece" value={f.portion} onChange={(e) => setF({ ...f, portion: e.target.value })} aria-label="Portion" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {fields.map(([k, label]) => (
          <label key={k} className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
            {label}
            <input className="input h-11 px-3" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
      </div>
      {err && <Notice tone="error">{err}</Notice>}
      <button className="btn btn-primary self-start" type="submit">
        Save and put on my plate
      </button>
    </form>
  );
}
