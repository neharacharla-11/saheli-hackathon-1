"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Mic, Plus, ShieldCheck, Square, Trash2, Upload, X } from "lucide-react";
import { Notice } from "@/components/nourish/bits";
import { addLovedVoice, chooseVoice, chosenLovedVoice, removeLovedVoice, setAutoRead, useAutoRead, useLovedVoices, useVoiceChoice } from "./lovedVoices";

const MIN_S = 30;
const MAX_S = 60;
const MAX_BYTES = 4 * 1024 * 1024;

/** The "Voice" pill at the top of Bestie, and its panel. */
export function VoicePicker({ cloning }: { cloning: boolean | null }) {
  const voices = useLovedVoices();
  const choice = useVoiceChoice();
  const autoRead = useAutoRead();
  const chosen = chosenLovedVoice(voices, choice);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const off = cloning === false;

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}'s voice? It will be removed from this phone and from the voice service.`)) return;
    setMsg("");
    try {
      const res = await fetch("/api/voice/clone", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voiceId: id }) });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      removeLovedVoice(id);
      setMsg(d.ok ? `${name}'s voice is deleted.` : `${name}'s voice is removed from this phone. ${d.error ?? ""}`.trim());
    } catch {
      removeLovedVoice(id);
      setMsg(`${name}'s voice is removed from this phone. We couldn't reach the voice service to delete the copy there, so please try adding and deleting it again later.`);
    }
  }

  const label = chosen && !off ? `${chosen.name}'s voice` : "Saheli voice";

  return (
    <div className="border-b border-line px-5 py-3 sm:px-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 text-sm font-semibold text-ink hover:brightness-95"
      >
        <span className="text-ink-soft">Voice:</span> {label}
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {off && <Notice icon={ShieldCheck}>Voice cloning isn&apos;t switched on yet. Bestie reads replies in your phone&apos;s voice for now.</Notice>}

          <div role="radiogroup" aria-label="Bestie's voice" className="flex flex-col gap-2">
            <VoiceRow name="Saheli voice" line="Your phone's own voice. Nothing leaves your phone." on={!chosen || off} onPick={() => chooseVoice("device")} />
            {voices.map((v) => (
              <VoiceRow
                key={v.id}
                name={`${v.name}'s voice`}
                line={`${v.relation ? `${v.relation} · ` : ""}added with their permission`}
                on={!off && chosen?.id === v.id}
                disabled={off}
                onPick={() => chooseVoice(v.id)}
                onDelete={() => remove(v.id, v.name)}
              />
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink">
            <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={autoRead} onChange={(e) => setAutoRead(e.target.checked)} />
            Read new replies aloud by themselves
          </label>

          {msg && (
            <p className="text-sm text-ink-soft" role="status">
              {msg}
            </p>
          )}

          {adding ? (
            <AddVoice
              onDone={(name) => {
                setAdding(false);
                setMsg(`${name}'s voice is ready. Tap Listen under a reply to hear it.`);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setAdding(true)} disabled={off || cloning === null}>
              <Plus size={16} aria-hidden /> Add a voice
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VoiceRow({ name, line, on, disabled, onPick, onDelete }: { name: string; line: string; on: boolean; disabled?: boolean; onPick: () => void; onDelete?: () => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${on ? "border-2 border-primary bg-surface-2" : "border-line"} ${disabled ? "opacity-60" : ""}`}>
      <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={onPick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-on-primary" : "border-line"}`} aria-hidden>
          {on && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{name}</span>
          <span className="block text-xs text-ink-soft">{line}</span>
        </span>
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-surface-2 hover:text-ink">
          <Trash2 size={14} aria-hidden /> Delete
        </button>
      )}
    </div>
  );
}

/** How long an audio file plays, in seconds (null if the browser can't tell). */
function audioSeconds(blob: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio();
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? a.duration : null);
    a.onerror = () => done(null);
    a.src = url;
    setTimeout(() => done(null), 4000);
  });
}

function pickMime(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  if (typeof MediaRecorder === "undefined") return "";
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

function AddVoice({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [consent, setConsent] = useState(false);
  const [clip, setClip] = useState<{ blob: Blob; fileName: string; seconds: number | null; url: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const who = name.trim() || "this person";

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function keepClip(blob: Blob, fileName: string, seconds: number | null) {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip({ blob, fileName, seconds, url: URL.createObjectURL(blob) });
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording doesn't work in this browser. Please upload a clip instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      const started = Date.now();
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        const seconds = Math.round((Date.now() - started) / 1000);
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunks, { type: type.split(";")[0] });
        if (seconds < MIN_S) {
          setError(`That was ${seconds} seconds. Please record at least ${MIN_S} seconds of them talking.`);
          return;
        }
        keepClip(blob, `clip.${type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"}`, seconds);
      };
      recRef.current = rec;
      rec.start(1000);
      setRecording(true);
      setSecs(0);
      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - started) / 1000);
        setSecs(s);
        if (s >= MAX_S && rec.state === "recording") rec.stop();
      }, 250);
    } catch {
      setError("Please allow the microphone to record, or upload a clip instead.");
    }
  }

  async function pickFile(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("audio/")) return setError("Please choose an audio file, like MP3, M4A or WAV.");
    if (f.size > MAX_BYTES) return setError("That file is too big. Please use a clip under 4 MB (about a minute of MP3 or M4A).");
    const seconds = await audioSeconds(f);
    if (seconds !== null && seconds < MIN_S - 2) return setError(`That clip is ${Math.round(seconds)} seconds. Please use ${MIN_S} to ${MAX_S} seconds of them speaking.`);
    if (seconds !== null && seconds > MAX_S + 15) return setError(`That clip is ${Math.round(seconds)} seconds. Please trim it to about ${MAX_S} seconds.`);
    keepClip(f, f.name, seconds);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function upload() {
    setError("");
    if (!name.trim()) return setError("Please add their name.");
    if (!consent) return setError(`Please confirm you have ${who}'s permission to use their voice.`);
    if (!clip) return setError("Please record or upload a clip first.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("relation", relation.trim());
      form.append("consent", "true");
      form.append("clip", clip.blob, clip.fileName);
      const res = await fetch("/api/voice/clone", { method: "POST", body: form });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; voiceId?: string; error?: string };
      if (!d.ok || !d.voiceId) {
        setError(d.error ?? "That didn't work. Please try again.");
        return;
      }
      const now = new Date().toISOString();
      addLovedVoice({ id: d.voiceId, name: name.trim(), relation: relation.trim() || undefined, consentAt: now, addedAt: now });
      URL.revokeObjectURL(clip.url);
      onDone(name.trim());
    } catch {
      setError("Couldn't reach the voice service. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">Add a loved one&apos;s voice</p>
          <p className="text-sm text-ink-soft">Record or upload 30 to 60 seconds of them talking naturally, in a quiet room, with no music.</p>
        </div>
        <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface" onClick={onCancel} aria-label="Close">
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Their name
          <input className="input h-11" placeholder="e.g. Mom" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Relation
          <input className="input h-11" placeholder="e.g. Mother" value={relation} maxLength={40} onChange={(e) => setRelation(e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recording ? (
          <button type="button" className="btn bg-danger text-white" onClick={() => recRef.current?.stop()}>
            <Square size={16} aria-hidden /> Stop · {secs}s
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={startRecording} disabled={busy}>
            <Mic size={16} aria-hidden /> Record them now
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={recording || busy}>
          <Upload size={16} aria-hidden /> Upload a clip
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="sr-only" tabIndex={-1} onChange={(e) => pickFile(e.target.files?.[0])} />
        {recording && (
          <span className="text-sm text-ink-soft" aria-live="polite">
            {secs < MIN_S ? `Keep going, at least ${MIN_S - secs} more seconds` : "Good. Stop any time, or it stops at 60 seconds."}
          </span>
        )}
      </div>

      {clip && !recording && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <audio src={clip.url} controls className="h-10 max-w-full" />
          <span className="text-sm text-ink-soft">{clip.seconds ? `${Math.round(clip.seconds)} seconds` : clip.fileName}</span>
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px] text-ink">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>I have {who}&apos;s permission to use their voice</span>
      </label>
      <p className="mt-2 flex items-start gap-2 text-sm text-ink-soft">
        <ShieldCheck size={15} className="mt-[3px] shrink-0 text-accent-ink" aria-hidden />
        <span>
          Their voice is only used to read Bestie&apos;s replies to you, and it&apos;s never shared. To make it, the clip goes to ElevenLabs, our voice service, and Bestie&apos;s replies are sent there to be spoken. You can delete it any time.
        </span>
      </p>

      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={upload} disabled={!consent || !clip || !name.trim() || busy || recording}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {busy ? "Making the voice..." : "Use this voice"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

