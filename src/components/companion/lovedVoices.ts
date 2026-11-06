"use client";

import { activeProfileStore, useProfileStore } from "@/lib/store";

/** A loved one's voice. Only the ElevenLabs voice_id is kept, on her phone. */
export interface LovedVoice {
  id: string; // ElevenLabs voice_id
  name: string; // "Mom"
  relation?: string; // "Mother"
  consentAt: string; // when she confirmed she has their permission
  addedAt: string;
}

/** Kept in her profile store alongside her other data (and in her backups). */
interface VoiceData {
  lovedVoices?: LovedVoice[];
  /** "device" for the phone's own voice, or a loved voice's id. */
  voiceChoice?: string;
  /** Read new Bestie replies aloud by themselves. */
  autoRead?: boolean;
}

const NONE: LovedVoice[] = [];

export function useLovedVoices(): LovedVoice[] {
  return useProfileStore((s) => (s as unknown as VoiceData).lovedVoices ?? NONE);
}

export function useVoiceChoice(): string {
  return useProfileStore((s) => (s as unknown as VoiceData).voiceChoice ?? "device");
}

export function useAutoRead(): boolean {
  return useProfileStore((s) => !!(s as unknown as VoiceData).autoRead);
}

function setVoiceData(fn: (d: VoiceData) => VoiceData) {
  const store = activeProfileStore();
  store.setState(fn(store.getState() as unknown as VoiceData) as never);
}

export function addLovedVoice(v: LovedVoice) {
  setVoiceData((d) => ({ lovedVoices: [...(d.lovedVoices ?? []).filter((x) => x.id !== v.id), v], voiceChoice: v.id }));
}

export function removeLovedVoice(id: string) {
  setVoiceData((d) => ({
    lovedVoices: (d.lovedVoices ?? []).filter((x) => x.id !== id),
    voiceChoice: d.voiceChoice === id ? "device" : d.voiceChoice,
  }));
}

export function chooseVoice(id: string) {
  setVoiceData(() => ({ voiceChoice: id }));
}

export function setAutoRead(on: boolean) {
  setVoiceData(() => ({ autoRead: on }));
}

/** The chosen loved voice, if it still exists. */
export function chosenLovedVoice(voices: LovedVoice[], choice: string): LovedVoice | undefined {
  return choice === "device" ? undefined : voices.find((v) => v.id === choice);
}
