"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------- Read aloud ---------------- */

/** Reads text aloud with a loved one's voice (ElevenLabs, if set up) or the phone's own voice. */
export function useReadAloud() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/tts")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => live && setCustom(!!d.configured))
      .catch(() => {});
    return () => {
      live = false;
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingId(null);
  }, []);

  const speakDevice = useCallback((id: string, text: string, lang: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.98;
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.lang === lang && /female|woman|veena|lekha|heera|samantha|google/i.test(v.name)) ??
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
    setSpeakingId(id);
    synth.speak(u);
  }, []);

  const speak = useCallback(
    async (id: string, text: string, lang = "en-IN") => {
      if (speakingId === id) return stop();
      stop();
      if (custom) {
        setSpeakingId(id);
        try {
          const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
          if (res.ok && res.headers.get("content-type")?.includes("audio")) {
            const url = URL.createObjectURL(await res.blob());
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              setSpeakingId((cur) => (cur === id ? null : cur));
            };
            await audio.play();
            return;
          }
        } catch {
          // fall back to the phone's voice
        }
      }
      speakDevice(id, text, lang);
    },
    [custom, speakDevice, speakingId, stop],
  );

  const supported = typeof window !== "undefined" && ("speechSynthesis" in window || custom);
  return { speak, stop, speakingId, supported };
}

/* ---------------- Voice input ---------------- */

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const VOICE_LANGS = [
  { id: "en-IN", label: "English" },
  { id: "hi-IN", label: "हिन्दी" },
  { id: "mr-IN", label: "मराठी" },
];

/** Speak instead of typing, with the browser's SpeechRecognition. */
export function useDictation(onText: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!getCtor());
    return () => recRef.current?.stop();
  }, []);

  const start = useCallback(
    (lang: string) => {
      const Ctor = getCtor();
      if (!Ctor) {
        setError("Voice typing doesn't work in this browser. Try Chrome or Safari.");
        return;
      }
      setError("");
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        onText((finalText + interim).trim(), false);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") setError("Please allow the microphone to talk to me.");
        else if (e.error !== "aborted" && e.error !== "no-speech") setError("I couldn't hear that. Please try again.");
      };
      rec.onend = () => {
        setListening(false);
        if (finalText.trim()) onText(finalText.trim(), true);
      };
      recRef.current = rec;
      setListening(true);
      rec.start();
    },
    [onText],
  );

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { start, stop, listening, error, supported };
}
