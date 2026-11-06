"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookHeart, BriefcaseMedical, ClipboardList, Heart, HeartHandshake, Trash2 } from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import { BAG_FOR_BABY, BAG_FOR_YOU } from "@/lib/pregnancyContent";
import { useProfileStore } from "@/lib/store";
import { newId, updateBook, updatePregnancy, useBabyBook } from "./data";
import { CardHead, Field, ProgressBar, TickButton } from "./ui";

/* ---------------- Baby book ---------------- */

type BookTab = "names" | "wishes" | "letters";

export function BabyBookCard() {
  const book = useBabyBook();
  const [tab, setTab] = useState<BookTab>("names");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const tabs: { id: BookTab; label: string; count: number }[] = [
    { id: "names", label: "Names", count: book.names.length },
    { id: "wishes", label: "Wishes", count: book.wishes.length },
    { id: "letters", label: "Letters", count: book.letters.length },
  ];

  function add() {
    const today = todayISO();
    if (tab === "names") {
      if (!a.trim()) return;
      updateBook((x) => ({ ...x, names: [...x.names, { id: newId(), name: a.trim(), note: b.trim() || undefined }] }));
    } else if (tab === "wishes") {
      if (!a.trim() || !b.trim()) return;
      updateBook((x) => ({ ...x, wishes: [...x.wishes, { id: newId(), from: a.trim(), text: b.trim(), date: today }] }));
    } else {
      if (!b.trim()) return;
      updateBook((x) => ({ ...x, letters: [...x.letters, { id: newId(), title: a.trim() || "A letter for you", body: b.trim(), date: today }] }));
    }
    setA("");
    setB("");
  }

  const remove = (id: string) =>
    updateBook((x) => ({
      names: x.names.filter((n) => n.id !== id),
      wishes: x.wishes.filter((n) => n.id !== id),
      letters: x.letters.filter((n) => n.id !== id),
    }));

  const del = (id: string, what: string) => (
    <button
      type="button"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
      aria-label={`Remove ${what}`}
      onClick={() => remove(id)}
    >
      <Trash2 size={15} />
    </button>
  );

  return (
    <section className="card">
      <CardHead icon={BookHeart} title="Baby book" right="Kept only on this phone" />
      <div className="flex gap-2" role="tablist" aria-label="Baby book">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-selected={tab === t.id}
            className="chip"
            onClick={() => {
              setTab(t.id);
              setA("");
              setB("");
            }}
          >
            {t.label}
            {t.count > 0 && <span className="tabular opacity-80">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4" role="tabpanel">
        {tab === "names" &&
          (book.names.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {book.names.map((n) => (
                <li key={n.id} className="flex items-center gap-2 rounded-2xl border border-line p-3">
                  <button
                    type="button"
                    aria-pressed={!!n.fav}
                    aria-label={n.fav ? `Unmark ${n.name} as favourite` : `Mark ${n.name} as favourite`}
                    onClick={() => updateBook((x) => ({ ...x, names: x.names.map((m) => (m.id === n.id ? { ...m, fav: !m.fav } : m)) }))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface-2"
                  >
                    <Heart size={17} className={n.fav ? "fill-primary text-primary" : "text-ink-soft"} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[1.25rem] leading-tight text-ink">{n.name}</p>
                    {n.note && <p className="truncate text-sm text-ink-soft">{n.note}</p>}
                  </div>
                  {del(n.id, n.name)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-ink-soft">Keep the names you love here, and why.</p>
          ))}

        {tab === "wishes" &&
          (book.wishes.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {book.wishes.map((w) => (
                <li key={w.id} className="flex gap-2 rounded-2xl bg-surface-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[1.1rem] leading-snug text-ink">&ldquo;{w.text}&rdquo;</p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      {w.from} · {formatShort(w.date)}
                    </p>
                  </div>
                  {del(w.id, `wish from ${w.from}`)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-ink-soft">Write down the wishes family and friends share for baby.</p>
          ))}

        {tab === "letters" &&
          (book.letters.length ? (
            <ul className="space-y-3">
              {book.letters.map((l) => (
                <li key={l.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-[1.25rem] leading-tight text-ink">{l.title}</p>
                      <p className="text-sm text-ink-soft">{formatShort(l.date)}</p>
                    </div>
                    {del(l.id, l.title)}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] text-ink">{l.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-ink-soft">Write a letter to your baby. One day they can read it.</p>
          ))}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2">
        {tab === "names" && (
          <>
            <Field label="Name">
              <input className="input" value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. Myra" />
            </Field>
            <Field label="Why you love it (optional)">
              <input className="input" value={b} onChange={(e) => setB(e.target.value)} placeholder="Meaning, who suggested it" />
            </Field>
          </>
        )}
        {tab === "wishes" && (
          <>
            <Field label="From">
              <input className="input" value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. Nani" />
            </Field>
            <Field label="Their wish" className="sm:col-span-2">
              <textarea className="input min-h-[88px] py-3" value={b} onChange={(e) => setB(e.target.value)} />
            </Field>
          </>
        )}
        {tab === "letters" && (
          <>
            <Field label="Title (optional)" className="sm:col-span-2">
              <input className="input" value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. The day I first heard your heartbeat" />
            </Field>
            <Field label="Your letter" className="sm:col-span-2">
              <textarea className="input min-h-[120px] py-3" value={b} onChange={(e) => setB(e.target.value)} placeholder="Dear little one," />
            </Field>
          </>
        )}
        <div className="sm:col-span-2">
          <button type="button" className="btn btn-primary" onClick={add}>
            {tab === "names" ? "Add name" : tab === "wishes" ? "Save wish" : "Save letter"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Hospital bag ---------------- */

export function HospitalBag() {
  const packed = useProfileStore((s) => s.pregnancy?.bag) ?? [];
  const total = BAG_FOR_YOU.length + BAG_FOR_BABY.length;
  const done = [...BAG_FOR_YOU, ...BAG_FOR_BABY].filter((i) => packed.includes(i.id)).length;
  const toggle = (id: string) =>
    updatePregnancy({ bag: packed.includes(id) ? packed.filter((x) => x !== id) : [...packed, id] });

  const list = (title: string, items: { id: string; label: string }[]) => (
    <div>
      <p className="label mb-1">{title}</p>
      <ul className="divide-y divide-line">
        {items.map((i) => {
          const on = packed.includes(i.id);
          return (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <TickButton on={on} onClick={() => toggle(i.id)} label={`${i.label}${on ? ", packed" : ""}`} />
              <span className={`text-[15px] ${on ? "text-ink-soft" : "text-ink"}`}>{i.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <section className="card">
      <CardHead icon={BriefcaseMedical} title="Hospital bag" right={<span className="tabular">{done} of {total} packed</span>} />
      <ProgressBar value={done / total} />
      <p className="mt-3 text-sm text-ink-soft">Pack it by week 35 and keep it by the door.</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {list("For you", BAG_FOR_YOU)}
        {list("For baby", BAG_FOR_BABY)}
      </div>
    </section>
  );
}

/* ---------------- Link cards ---------------- */

export function LinkCards() {
  const plan = useProfileStore((s) => s.birthPlan);
  const circle = useProfileStore((s) => s.circle);
  const filled = plan ? Object.values(plan).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length : 0;
  const first = circle[0]?.name;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/app/birth-plan" className="card group flex items-start gap-4 hover:bg-surface-2/50">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-primary-ink">
          <ClipboardList size={20} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.35rem] leading-tight text-ink">My birth plan</span>
          <span className="mt-1 block text-[15px] text-ink-soft">
            {filled ? `${filled} choices made. Print it for your bag and your doctor.` : "Your wishes for labour, a caesarean and after birth, ready to print."}
          </span>
        </span>
        <ArrowRight size={18} className="mt-1 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
      <Link href="/app/circle" className="card group flex items-start gap-4 hover:bg-surface-2/50">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-primary-ink">
          <HeartHandshake size={20} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.35rem] leading-tight text-ink">Share with your people</span>
          <span className="mt-1 block text-[15px] text-ink-soft">
            {first
              ? `Let ${first} know how they can help you this week. Never your logs or moods.`
              : "Let the people who love you know how to help you, week by week. Never your logs or moods."}
          </span>
        </span>
        <ArrowRight size={18} className="mt-1 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}
