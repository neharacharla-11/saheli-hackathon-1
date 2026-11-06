"use client";

import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, Send, Trash2 } from "lucide-react";
import { CardHead, Pill } from "@/components/pregnancy/ui";
import { formatShort } from "@/lib/dates";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import { STATUS_LABEL, TOPIC_LABEL, type Suggestion, type SuggestionStatus, type SuggestionTopic } from "@/lib/settingsTypes";

const TOPICS = Object.keys(TOPIC_LABEL) as SuggestionTopic[];
const STATUS_TONE: Record<SuggestionStatus, "muted" | "warn" | "ok"> = { received: "muted", working: "warn", added: "ok" };
const PLACEHOLDER: Record<SuggestionTopic, string> = {
  song: "e.g. The Gayatri mantra for my breathing breaks, or a lullaby my mother sang",
  recipe: "e.g. A high-protein poha for my luteal days",
  workout: "e.g. A 10-minute chair workout for my back",
  feature: "e.g. Remind me to drink water only on work days",
  other: "Anything you'd love to see in Saheli",
};

function setSuggestions(fn: (list: Suggestion[]) => Suggestion[]) {
  const store = activeProfileStore();
  store.setState({ suggestions: fn(store.getState().suggestions ?? []) });
}

async function postIdea(s: Pick<Suggestion, "topic" | "text" | "name">) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string; secret?: string; error?: string; configured?: boolean };
    return { ...data, ok: res.ok && !!data.ok };
  } catch {
    return { ok: false, error: "Couldn't reach Saheli just now. We've kept your idea on this phone." };
  } finally {
    clearTimeout(t);
  }
}

export function RecommendView() {
  const list = useProfileStore((s) => s.suggestions) ?? [];
  const firstName = useProfileStore((s) => s.profile?.name?.split(" ")[0]) ?? "";
  const [topic, setTopic] = useState<SuggestionTopic>("feature");
  const [text, setText] = useState("");
  const [withName, setWithName] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "off" | "error"; text: string } | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  // Is the server store switched on? Then refresh statuses.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/recommend");
        const d = (await r.json()) as { configured?: boolean };
        if (cancelled) return;
        setConfigured(!!d.configured);
        if (!d.configured) return;
        const sent = (activeProfileStore().getState().suggestions ?? []).filter((s) => s.token && s.secret);
        for (const s of sent) {
          const res = await fetch(`/api/recommend?token=${encodeURIComponent(s.token!)}&secret=${encodeURIComponent(s.secret!)}`);
          if (!res.ok) continue;
          const data = (await res.json()) as { suggestion?: { status?: SuggestionStatus } };
          const status = data.suggestion?.status;
          if (status && status !== s.status && !cancelled) setSuggestions((l) => l.map((x) => (x.id === s.id ? { ...x, status } : x)));
        }
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function send() {
    const clean = text.trim();
    if (clean.length < 3) return;
    setBusy(true);
    setNote(null);
    const name = withName && firstName ? firstName : undefined;
    const r = await postIdea({ topic, text: clean, name });
    const item: Suggestion = {
      id: newId(),
      token: r.ok ? r.token : undefined,
      secret: r.ok ? r.secret : undefined,
      topic,
      text: clean,
      name,
      sentAt: new Date().toISOString(),
      status: "received",
      sent: r.ok,
    };
    setSuggestions((l) => [item, ...l]);
    setText("");
    setBusy(false);
    if (r.ok) setNote({ tone: "ok", text: "Thank you. Neha reads every idea. You'll see its status here." });
    else if (r.configured === false) {
      setConfigured(false);
      setNote({ tone: "off", text: "Sending ideas isn't switched on yet. Your idea is saved on this phone and you can send it later." });
    } else setNote({ tone: "error", text: r.error ?? "Couldn't send just now. Your idea is saved on this phone." });
  }

  async function retry(s: Suggestion) {
    const r = await postIdea({ topic: s.topic, text: s.text, name: s.name });
    if (r.ok) setSuggestions((l) => l.map((x) => (x.id === s.id ? { ...x, token: r.token, secret: r.secret, sent: true } : x)));
    else setNote({ tone: r.configured === false ? "off" : "error", text: r.error ?? "Couldn't send just now." });
  }

  async function remove(s: Suggestion) {
    if (s.token && s.secret) {
      fetch("/api/recommend", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: s.token, secret: s.secret }) }).catch(() => {});
    }
    setSuggestions((l) => l.filter((x) => x.id !== s.id));
  }

  return (
    <div className="space-y-5">
      <section className="card">
        <CardHead icon={Lightbulb} title="Your idea" />
        <p className="mb-2 text-sm font-semibold text-ink">What is it?</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>
              {TOPIC_LABEL[t]}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Tell us about it</span>
          <textarea
            className="input min-h-[128px] py-3"
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER[topic]}
          />
        </label>
        {firstName && (
          <label className="mt-3 flex items-center gap-2.5 text-[15px] text-ink">
            <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={withName} onChange={(e) => setWithName(e.target.checked)} />
            Include my first name ({firstName})
          </label>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={send} disabled={busy || text.trim().length < 3}>
            <Send size={16} aria-hidden /> {busy ? "Sending" : "Send"}
          </button>
          <p className="text-sm text-ink-soft">{withName && firstName ? "Only your idea and first name are sent." : "Only your idea is sent."} Never your health data.</p>
        </div>
        {note && (
          <p
            aria-live="polite"
            className={`mt-4 rounded-2xl p-3.5 text-[15px] ${
              note.tone === "ok" ? "bg-accent/20 text-ink" : note.tone === "off" ? "bg-surface-2 text-ink" : "bg-[#FDE2E2] text-[#5c1020]"
            }`}
          >
            {note.text}
          </p>
        )}
        {configured === false && !note && (
          <p className="mt-4 rounded-2xl bg-surface-2 p-3.5 text-[15px] text-ink">
            Sending ideas isn&apos;t switched on yet. You can still write them here and send them later.
          </p>
        )}
      </section>

      <section className="card">
        <CardHead title="Your recommendations" right={list.length ? `${list.length} ${list.length === 1 ? "idea" : "ideas"}` : undefined} />
        {list.length === 0 ? (
          <p className="text-[15px] text-ink-soft">Nothing yet. Your ideas and their status show up here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent-ink">{TOPIC_LABEL[s.topic]}</span>
                  <span className="text-xs text-ink-soft">· {formatShort(s.sentAt.slice(0, 10))}</span>
                  <span className="ml-auto flex items-center gap-1">
                    {s.sent ? <Pill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Pill> : <Pill tone="muted">Saved on this phone</Pill>}
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                      aria-label="Remove this idea"
                      onClick={() => remove(s)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
                <p className="mt-1 text-[15px] text-ink">{s.text}</p>
                {!s.sent && configured && (
                  <button type="button" className="btn btn-ghost btn-sm -ml-2 mt-1 text-primary-ink" onClick={() => retry(s)}>
                    <RefreshCw size={14} aria-hidden /> Send now
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
