"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Pencil, SendHorizontal, Sparkles, Square, Trash2, Volume2, X } from "lucide-react";
import { PHASE_LABEL } from "@/lib/cycle";
import { daysBetween, formatShort } from "@/lib/dates";
import { addTotals } from "@/lib/foods";
import { helpFor } from "@/lib/helplines";
import { reportContextLines } from "@/lib/labTests";
import { setChat, useFoodToday, useMyDay } from "@/lib/myDay";
import { pregnancyWeek } from "@/lib/pregnancy";
import { activeProfileStore, newId, STAGE_LABEL, useProfileStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { Notice } from "@/components/nourish/bits";
import { useDictation, useReadAloud } from "./useVoice";
import { chosenLovedVoice, useAutoRead, useLovedVoices, useVoiceChoice } from "./lovedVoices";
import { VoicePicker } from "./VoicePicker";
import { useVoiceLang, VOICE_LANGS, type VoiceLang } from "@/components/voice/VoiceInput";

const NO_CHAT: ChatMessage[] = [];

function suggestionsFor(phase: string | null, stage?: string): string[] {
  if (stage === "pregnancy") return ["What should I eat this week?", "Is it normal to feel this tired?", "How do I count kicks?", "I can't sleep well"];
  if (stage === "postpartum") return ["I feel low and teary", "What should I eat while breastfeeding?", "How do I get more rest?", "Is my bleeding normal?"];
  if (stage === "menopause") return ["How do I cope with hot flashes?", "Foods for strong bones", "I can't sleep at night", "Is this perimenopause?"];
  if (stage === "first-period") return ["What is a period?", "What should I keep in my bag?", "My tummy hurts", "Who should I tell?"];
  if (phase === "luteal") return ["Why do I crave sweets right now?", "Why do I feel so tired today?", "A quick dinner for tonight", "Help me calm down"];
  if (phase === "period") return ["What helps with cramps?", "Should I work out on my period?", "Iron-rich snacks", "I feel low today"];
  return ["What should I eat today?", "A 15-minute workout for me", "How is my cycle affecting me?", "Help me sleep better"];
}

export function CompanionChat() {
  const { profile, today, day, phase, nextPeriod, log } = useMyDay();
  const chat = useProfileStore((s) => s.chat ?? NO_CHAT);
  const reports = useProfileStore((s) => s.reports);
  const food = useFoodToday();
  const companion = profile?.companionName?.trim() || "Bestie";
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<ChatMessage | null>(null);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [lang, setLang] = useVoiceLang();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(companion);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lovedVoices = useLovedVoices();
  const voiceChoice = useVoiceChoice();
  const autoRead = useAutoRead();
  const lovedVoice = chosenLovedVoice(lovedVoices, voiceChoice);
  const { speak, speakingId, loadingId, supported: canSpeak, cloning, error: voiceError, clearError } = useReadAloud(lovedVoice?.id);

  const onDictation = useCallback((text: string) => setInput(text), []);
  const dictation = useDictation(onDictation);

  useEffect(() => {
    let live = true;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => live && setConfigured(!!d.configured))
      .catch(() => live && setConfigured(false));
    return () => {
      live = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.length, streaming?.text]);

  function context() {
    if (!profile) return {};
    const help = helpFor(profile.country);
    const t = addTotals(food);
    return {
      name: profile.name,
      companionName: companion,
      age: profile.age,
      country: help.name,
      stage: STAGE_LABEL[profile.stage],
      cycleDay: day ?? undefined,
      phase: phase ? PHASE_LABEL[phase] : undefined,
      nextPeriod: nextPeriod ? formatShort(nextPeriod) : undefined,
      pregnancyWeek: profile.stage === "pregnancy" && profile.dueDate ? pregnancyWeek(profile.dueDate, today).week : undefined,
      babyAge: profile.stage === "postpartum" && profile.babyBirthDate ? `${Math.floor(daysBetween(profile.babyBirthDate, today) / 7)} weeks` : undefined,
      mood: log?.mood,
      energy: log?.energy,
      stress: log?.stress,
      symptoms: log?.symptoms ?? [],
      reports: reports?.length ? reportContextLines(reports).slice(0, 12) : [],
      diet: profile.diet,
      foodToday: food.length && !profile.safety?.eatingConcerns && profile.stage !== "first-period" ? `${food.map((f) => f.name).slice(0, 8).join(", ")} (about ${Math.round(t.kcal)} kcal)` : undefined,
      helplines: [help.emergency, ...help.others].map((h) => `${h.label} ${h.display ?? h.number}`).join("; "),
    };
  }

  async function send(textIn?: string) {
    const text = (textIn ?? input).trim();
    if (!text || streaming) return;
    if (dictation.listening) dictation.stop();
    setError("");
    setInput("");
    const mine: ChatMessage = { id: newId(), role: "user", text: text.slice(0, 4000), at: new Date().toISOString() };
    const history = [...(activeProfileStore().getState().chat ?? []), mine];
    setChat(history);

    const reply: ChatMessage = { id: newId(), role: "assistant", text: "", at: new Date().toISOString() };
    setStreaming(reply);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let got = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-24).map((m) => ({ role: m.role, text: m.text })), context: context() }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; configured?: boolean };
        if (data.configured === false) setConfigured(false);
        setError(data.error ?? "I couldn't answer just now. Please try again.");
        setStreaming(null);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += decoder.decode(value, { stream: true });
        setStreaming({ ...reply, text: got });
      }
      got += decoder.decode();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("I lost the connection. Please try again.");
    }
    if (got.trim()) {
      setChat([...(activeProfileStore().getState().chat ?? []), { ...reply, text: got.trim() }]);
      // Read the new reply aloud in her chosen voice, if she asked for that.
      if (autoRead) speak(reply.id, got.trim(), lang);
    }
    setStreaming(null);
  }

  function rename() {
    const n = newName.trim().slice(0, 24);
    if (n) activeProfileStore().getState().updateProfile({ companionName: n });
    setRenaming(false);
  }

  const messages = streaming ? [...chat, streaming] : chat;
  const suggestions = suggestionsFor(phase, profile?.stage);

  return (
    <div className="mx-auto w-full max-w-[768px]">
      <section className="card flex flex-col p-0 sm:p-0" aria-label={`Chat with ${companion}`}>
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-line px-5 py-4 sm:px-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary font-display text-[1.7rem] text-on-primary" aria-hidden="true">
            {companion.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  rename();
                }}
              >
                <input className="input h-10 max-w-[220px]" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="Your companion's name" autoFocus maxLength={24} />
                <button className="grid h-10 w-10 place-items-center rounded-full bg-primary text-on-primary" type="submit" aria-label="Save name">
                  <Check size={18} aria-hidden="true" />
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" type="button" onClick={() => setRenaming(false)} aria-label="Cancel">
                  <X size={18} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <h1 className="flex items-center gap-2 font-display text-[1.7rem] leading-tight text-ink">
                {companion}
                <button
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                  onClick={() => {
                    setNewName(companion);
                    setRenaming(true);
                  }}
                  aria-label={`Rename ${companion}`}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </h1>
            )}
            <p className="text-sm text-ink-soft">
              {phase && day ? `Knows you're on day ${day}, ${PHASE_LABEL[phase].toLowerCase()}. ` : ""}Here for you, any time. Your chats stay on this phone.
            </p>
          </div>
          {chat.length > 0 && (
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              onClick={() => confirm("Clear this chat from your phone?") && setChat([])}
              aria-label="Clear chat"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <VoicePicker cloning={cloning} />

        {/* Messages */}
        <div ref={listRef} className="flex h-[calc(100dvh-545px)] min-h-[220px] sm:h-auto sm:max-h-[62dvh] sm:min-h-[320px] flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          {configured === false && (
            <Notice icon={Sparkles}>
              {companion} isn&apos;t switched on yet. Once Saheli&apos;s AI is set up, you can talk here any time. Everything else in Saheli works already.
            </Notice>
          )}
          {messages.length === 0 && configured !== false && (
            <div className="my-auto py-6 text-center">
              <p className="font-display text-[1.4rem] text-ink">Hi {profile?.name}, I&apos;m {companion}.</p>
              <p className="mx-auto mt-1 max-w-[440px] text-ink-soft">Ask me anything about your body, food, mood or sleep. I explain, I don&apos;t diagnose, and I&apos;ll always tell you when to see a doctor.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} className="chip h-auto min-h-9 whitespace-normal py-1.5 text-left" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed ${
                  m.role === "user" ? "rounded-2xl rounded-br-md bg-primary text-on-primary" : "rounded-2xl rounded-bl-md bg-surface-2 text-ink"
                }`}
              >
                {m.text || <TypingDots />}
              </div>
              {m.role === "assistant" && m.text && m !== streaming && canSpeak && (
                <button
                  className="mt-1 inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-ink-soft hover:bg-surface-2 hover:text-ink"
                  onClick={() => speak(m.id, m.text, lang)}
                  aria-pressed={speakingId === m.id || loadingId === m.id}
                  aria-label={lovedVoice && cloning ? `Listen in ${lovedVoice.name}'s voice` : "Listen"}
                >
                  {loadingId === m.id ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : speakingId === m.id ? (
                    <Square size={12} aria-hidden="true" />
                  ) : (
                    <Volume2 size={14} aria-hidden="true" />
                  )}
                  {loadingId === m.id ? "Getting the voice" : speakingId === m.id ? "Stop" : "Listen"}
                </button>
              )}
            </div>
          ))}
          {error && <Notice tone="error">{error}</Notice>}
          {voiceError && (
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Notice>{voiceError}</Notice>
              </div>
              <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2" onClick={clearError} aria-label="Dismiss">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-line px-3 py-3 sm:px-5">
          {(dictation.error || dictation.listening) && (
            <p className="mb-2 px-1 text-xs text-ink-soft" role="status">
              {dictation.error || "Listening... tap the square when you're done."}
            </p>
          )}
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {dictation.supported && (
              <div className="flex shrink-0 items-center rounded-full bg-surface-2">
                <button
                  type="button"
                  className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${dictation.listening ? "bg-primary text-on-primary" : "text-primary-ink hover:bg-line"}`}
                  onClick={() => (dictation.listening ? dictation.stop() : dictation.start(lang))}
                  aria-label={dictation.listening ? "Stop listening" : "Speak instead of typing"}
                  aria-pressed={dictation.listening}
                >
                  {dictation.listening ? <Square size={16} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
                </button>
                <select
                  className="h-11 w-[74px] rounded-full bg-transparent pr-1 text-xs font-semibold text-ink sm:w-auto sm:pr-3"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as VoiceLang)}
                  aria-label="Voice language"
                >
                  {VOICE_LANGS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <input
              className="input h-11 min-w-0 flex-1 rounded-full"
              placeholder={`Message ${companion}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={`Message ${companion}`}
              maxLength={4000}
              enterKeyHint="send"
            />
            <button
              type="submit"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary shadow-[var(--shadow-soft)] transition hover:brightness-105 disabled:opacity-50"
              disabled={!input.trim() || !!streaming || configured === false}
              aria-label="Send"
            >
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 px-1 text-[11px] text-ink-soft">{companion} explains, it doesn&apos;t diagnose. For anything worrying, talk to your doctor or tap Get help.</p>
        </div>
      </section>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1.5" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
