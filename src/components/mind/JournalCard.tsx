"use client";

import { useState } from "react";
import { BookHeart, Trash2 } from "lucide-react";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import type { JournalEntry } from "@/lib/types";
import { VoiceInput } from "@/components/voice/VoiceInput";

const NONE: JournalEntry[] = [];

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** A private journal on Mind. Type or speak; it stays on this phone. */
export function JournalCard() {
  const entries = useProfileStore((s) => s.journal ?? NONE);
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false);
  const sorted = [...entries].sort((a, b) => (a.at < b.at ? 1 : -1));

  function save() {
    const t = text.trim();
    if (!t) return;
    activeProfileStore().getState().addJournal({ id: newId(), at: new Date().toISOString(), text: t.slice(0, 5000) });
    setText("");
  }

  return (
    <section className="card" aria-labelledby="journal-title">
      <h2 id="journal-title" className="flex items-center gap-2 font-semibold text-ink">
        <BookHeart size={18} className="text-primary-ink" aria-hidden="true" /> Journal
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Write it down or say it out loud. Only you can see this, and it never leaves your phone.</p>
      <label htmlFor="journal-text" className="sr-only">
        What&apos;s on your mind
      </label>
      <textarea
        id="journal-text"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind today?"
        className="mt-3 w-full resize-y rounded-2xl border border-line bg-surface p-3 text-[16px] text-ink"
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <VoiceInput value={text} onText={setText} label="Speak" />
        <button type="button" className="btn btn-primary" onClick={save} disabled={!text.trim()}>
          Save entry
        </button>
      </div>
      {sorted.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {(showAll ? sorted : sorted.slice(0, 3)).map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-soft">{when(e.at)}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-ink">{e.text}</p>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                aria-label="Delete this entry"
                onClick={() => activeProfileStore().getState().removeJournal(e.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {sorted.length > 3 && (
        <button type="button" className="btn btn-ghost btn-sm mt-1" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${sorted.length} entries`}
        </button>
      )}
    </section>
  );
}
