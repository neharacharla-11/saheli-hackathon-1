"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { usePref } from "@/lib/prefs";
import { useAppStore } from "@/lib/store";

export const VOICE_LANGS = [
  { id: "en-IN", label: "English" },
  { id: "hi-IN", label: "हिंदी" },
  { id: "mr-IN", label: "मराठी" },
] as const;

export type VoiceLang = (typeof VOICE_LANGS)[number]["id"];

/** Her voice language: remembered, and until she picks one it follows the app language. */
export function useVoiceLang(): [VoiceLang, (l: VoiceLang) => void] {
  const appLang = useAppStore((s) => s.language);
  const fallback: VoiceLang = appLang?.startsWith("hi") ? "hi-IN" : appLang?.startsWith("mr") ? "mr-IN" : "en-IN";
  return usePref<VoiceLang>("voiceLang", fallback);
}

interface Rec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

function ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function voiceError(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") return "The microphone is blocked. Allow it in your browser settings, then tap the mic again.";
  if (code === "language-not-supported") return "This browser can't listen in that language yet. Try English, or type instead.";
  if (code === "audio-capture") return "We couldn't find a microphone on this device.";
  if (code === "network") return "Voice typing needs an internet connection.";
  return "We couldn't hear that. Please try again.";
}

/**
 * Mic button plus language picker. Text appears live through onText(base + spoken)
 * so she can check it before sending. Renders nothing if the browser can't listen.
 */
export function VoiceInput({
  value,
  onText,
  label = "Speak",
  compact = false,
}: {
  value: string;
  onText: (text: string) => void;
  label?: string;
  compact?: boolean;
}) {
  const [lang, setLang] = useVoiceLang();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<Rec | null>(null);
  const baseRef = useRef("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!ctor());
    return () => recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C) return;
    setError("");
    const rec = new C();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    baseRef.current = value ? `${value.replace(/\s+$/, "")} ` : "";
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onText((baseRef.current + finalText + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") setError(voiceError(e.error));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError(voiceError("unknown"));
    }
  }, [lang, onText, value]);

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex shrink-0 items-center rounded-full bg-surface-2">
        <button
          type="button"
          onClick={() => (listening ? recRef.current?.stop() : start())}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : `${label} instead of typing`}
          className={`inline-flex h-11 items-center gap-2 rounded-full font-semibold transition-colors ${compact ? "w-11 justify-center" : "px-4"} ${
            listening ? "bg-primary text-on-primary" : "text-primary-ink hover:bg-line"
          }`}
        >
          {listening ? <Square size={16} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          {!compact && <span className="text-sm">{listening ? "Stop" : label}</span>}
        </button>
        <select
          className="h-11 rounded-full bg-transparent pl-1 pr-2 text-xs font-semibold text-ink"
          value={lang}
          onChange={(e) => setLang(e.target.value as VoiceLang)}
          aria-label="Voice language"
          disabled={listening}
        >
          {VOICE_LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      {(listening || error) && (
        <p className={`text-xs ${error ? "text-[#9B1B30]" : "text-ink-soft"}`} role="status">
          {error || "Listening. Your words appear in the box so you can check them."}
        </p>
      )}
    </div>
  );
}
