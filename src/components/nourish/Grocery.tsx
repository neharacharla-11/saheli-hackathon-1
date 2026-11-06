"use client";

import { useEffect, useState } from "react";
import { Check, Plus, ShoppingBasket, Sparkles, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { groceryFromText, groceryShareText, PHASE_DAYS, planTexts } from "@/lib/phaseFood";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import { setGrocery, useMyDay } from "@/lib/myDay";
import type { GroceryItem } from "@/lib/types";
import { CardTitle } from "./bits";

const NONE: GroceryItem[] = [];

export function Grocery() {
  const { phase, profile } = useMyDay();
  const items = useProfileStore((s) => s.grocery ?? NONE);
  const plan = useProfileStore((s) => (s.dietRequest?.status === "ready" ? s.dietRequest.plan : undefined));
  const filledFor = useProfileStore((s) => s.groceryPlanAt);
  const [text, setText] = useState("");

  // When a new plan from her coach arrives, fill the list from it.
  useEffect(() => {
    if (plan && plan.writtenAt !== filledFor) {
      const st = activeProfileStore();
      st.setState({ grocery: groceryFromText(planTexts(plan), st.getState().grocery ?? []), groceryPlanAt: plan.writtenAt } as never);
    }
  }, [plan, filledFor]);

  const todo = items.filter((i) => !i.done).length;
  const groups = [...new Set(items.map((i) => i.group ?? "My items"))];

  function fillFromPhase() {
    const day = PHASE_DAYS[phase ?? "follicular"];
    const veg = !profile?.diet || ["vegetarian", "vegan", "jain", "eggetarian"].includes(profile.diet);
    const texts = day.meals.map((m) => (veg || !m.nonVeg ? m.veg : m.nonVeg));
    const next = groceryFromText(texts, items).map((g) => (g.fromPlan && !plan ? { ...g, id: g.id.replace("plan-", "phase-") } : g));
    setGrocery(next);
  }

  function add() {
    const name = text.trim().slice(0, 60);
    if (!name) return;
    setGrocery([...items, { id: newId(), name, group: "My items", done: false }]);
    setText("");
  }

  const share = `https://wa.me/?text=${encodeURIComponent(groceryShareText(items, profile?.name))}`;

  return (
    <section className="card" aria-labelledby="grocery-title">
      <CardTitle
        icon={ShoppingBasket}
        title={<span id="grocery-title">Grocery list</span>}
        right={items.length > 0 ? <span className="text-sm font-semibold text-ink-soft tabular">{todo} to buy</span> : undefined}
      />
      {plan ? (
        <p className="-mt-2 mb-4 text-sm text-ink-soft">Filled from your coach&apos;s plan. Add anything else you need.</p>
      ) : (
        <p className="-mt-2 mb-4 text-sm text-ink-soft">Fills itself from your coach&apos;s plan when it&apos;s ready. Until then, fill it from this phase&apos;s meals.</p>
      )}

      {items.length === 0 ? (
        <button className="btn btn-secondary" onClick={fillFromPhase}>
          <Sparkles size={16} aria-hidden="true" />
          Fill from this phase&apos;s meals
        </button>
      ) : (
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g} className="break-inside-avoid">
              <p className="label mb-1">{g}</p>
              <ul className="flex flex-col divide-y divide-line">
                {items
                  .filter((i) => (i.group ?? "My items") === g)
                  .map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2">
                      <button
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          i.done ? "border-primary bg-primary text-on-primary" : "border-line bg-surface"
                        }`}
                        onClick={() => setGrocery(items.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)))}
                        aria-pressed={i.done}
                        aria-label={`${i.done ? "Untick" : "Tick"} ${i.name}`}
                      >
                        {i.done && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                      </button>
                      <span className={`min-w-0 flex-1 text-[15px] ${i.done ? "text-ink-soft line-through" : "text-ink"}`}>{i.name}</span>
                      <button
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                        onClick={() => setGrocery(items.filter((x) => x.id !== i.id))}
                        aria-label={`Remove ${i.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="input h-11 flex-1 rounded-full" placeholder="Add an item, e.g. coriander" value={text} onChange={(e) => setText(e.target.value)} aria-label="Add a grocery item" />
        <button className="btn btn-secondary h-11 px-4" type="submit" aria-label="Add item">
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={share} target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ background: "#25D366" }}>
            <WhatsAppIcon size={18} />
            Share on WhatsApp
          </a>
          {items.some((i) => i.done) && (
            <button className="btn btn-ghost" onClick={() => setGrocery(items.filter((i) => !i.done))}>
              Clear ticked items
            </button>
          )}
        </div>
      )}
    </section>
  );
}
