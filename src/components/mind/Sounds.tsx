"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bird,
  CloudRain,
  Flame,
  Headphones,
  Leaf,
  Moon,
  Music,
  Pause,
  Play,
  Sparkles,
  Upload,
  Waves,
  Wind,
  Droplets,
  CircleDot,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { CardHead } from "@/components/pregnancy/ui";
import { setVolume, startFile, startSound, stopAll, stopSound, type SoundId } from "./soundEngine";

type Category = "nature" | "meditation" | "relax" | "devotional" | "mine";

interface SoundDef {
  id: SoundId;
  name: string;
  line: string;
  icon: LucideIcon;
  cat: Exclude<Category, "mine">;
}

const SOUNDS: SoundDef[] = [
  { id: "rain", name: "Rain", line: "Steady rain on leaves", icon: CloudRain, cat: "nature" },
  { id: "ocean", name: "Ocean", line: "Slow waves on the shore", icon: Waves, cat: "nature" },
  { id: "river", name: "River", line: "A stream over stones", icon: Droplets, cat: "nature" },
  { id: "birds", name: "Birds", line: "Morning in the garden", icon: Bird, cat: "nature" },
  { id: "wind", name: "Wind", line: "A soft breeze", icon: Wind, cat: "nature" },
  { id: "fire", name: "Fire", line: "A crackling fire", icon: Flame, cat: "nature" },
  { id: "bowl", name: "Singing bowl", line: "A long, ringing tone", icon: CircleDot, cat: "meditation" },
  { id: "drone", name: "Calm drone", line: "A deep, warm hum", icon: Radio, cat: "meditation" },
  { id: "chimes", name: "Wind chimes", line: "Gentle, random notes", icon: Sparkles, cat: "meditation" },
  { id: "brown", name: "Brown noise", line: "Deep and soft, for focus", icon: Headphones, cat: "relax" },
  { id: "pink", name: "Pink noise", line: "Even and soothing, for sleep", icon: Moon, cat: "relax" },
  { id: "crickets", name: "Night crickets", line: "A warm summer night", icon: Leaf, cat: "relax" },
  { id: "om", name: "Om", line: "A low, steady Om", icon: Music, cat: "devotional" },
  { id: "bells", name: "Temple bells", line: "Distant bells", icon: Bell, cat: "devotional" },
  { id: "tanpura", name: "Tanpura", line: "Sa and Pa, softly plucked", icon: Music, cat: "devotional" },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "nature", label: "Nature" },
  { id: "meditation", label: "Meditation" },
  { id: "relax", label: "Relax" },
  { id: "devotional", label: "Devotional" },
  { id: "mine", label: "My sounds" },
];

const MAX = 4;

interface MyFile {
  id: string;
  name: string;
  url: string;
}

// Kept for this visit only. Her files never leave the phone.
const myFiles: MyFile[] = [];

export function SoundsCard() {
  const [cat, setCat] = useState<Category>("nature");
  const [playing, setPlaying] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<MyFile[]>(() => [...myFiles]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => stopAll(), []);

  const count = Object.keys(playing).length;

  function toggle(id: string, play: () => void) {
    if (playing[id] !== undefined) {
      stopSound(id);
      setPlaying((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      setNote("");
      return;
    }
    if (count >= MAX) {
      setNote("You can mix up to 4 sounds. Pause one to add another.");
      return;
    }
    setNote("");
    play();
    setPlaying((p) => ({ ...p, [id]: 0.6 }));
  }

  function changeVolume(id: string, v: number) {
    setVolume(id, v);
    setPlaying((p) => ({ ...p, [id]: v }));
  }

  function addFile(f: File) {
    const item = { id: `file-${Date.now()}`, name: f.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(f) };
    myFiles.push(item);
    setFiles([...myFiles]);
  }

  const tile = (id: string, name: string, line: string, Icon: LucideIcon, play: () => void) => {
    const on = playing[id] !== undefined;
    return (
      <li key={id} className={`rounded-2xl border p-4 transition-colors ${on ? "border-primary/50 bg-surface-2" : "border-line bg-surface"}`}>
        <button type="button" onClick={() => toggle(id, play)} aria-pressed={on} className="flex w-full items-center gap-3 text-left">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${on ? "bg-primary text-on-primary" : "bg-surface-2 text-primary-ink"}`}>
            <Icon size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{name}</span>
            <span className="block truncate text-xs text-ink-soft">{line}</span>
          </span>
          {on ? <Pause size={16} className="shrink-0 text-primary-ink" aria-hidden /> : <Play size={16} className="shrink-0 text-ink-soft" aria-hidden />}
        </button>
        {on && (
          <label className="mt-3 flex items-center gap-2">
            <span className="sr-only">{name} volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={playing[id]}
              onChange={(e) => changeVolume(id, Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </label>
        )}
      </li>
    );
  };

  return (
    <section className="card">
      <CardHead
        icon={Headphones}
        title="Calm sounds"
        right={
          count > 0 ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                stopAll();
                setPlaying({});
                setNote("");
              }}
            >
              Stop all ({count} of {MAX})
            </button>
          ) : (
            "Mix up to 4"
          )
        }
      />
      <div className="fade-x -mx-1 flex gap-2 px-1 pb-1" role="tablist" aria-label="Sound type">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} data-selected={cat === c.id} className="chip shrink-0" onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      {note && <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-ink">{note}</p>}

      {cat === "mine" ? (
        <div className="mt-4">
          {files.length > 0 && (
            <ul className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((f) => tile(f.id, f.name, "Your sound", Music, () => startFile(f.id, f.url, 0.6)))}
            </ul>
          )}
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="text-[15px] text-ink">
              {files.length ? "Add another" : "Add a chant, a song or a voice note you love."} It plays only on this phone and is gone when you close Saheli.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addFile(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => fileRef.current?.click()}>
              <Upload size={15} aria-hidden /> Choose a sound file
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOUNDS.filter((s) => s.cat === cat).map((s) => tile(s.id, s.name, s.line, s.icon, () => startSound(s.id, 0.6)))}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-soft">Playing now: {count ? `${count} of ${MAX}` : "nothing"}. Sounds keep playing while you move around this page.</p>
    </section>
  );
}
