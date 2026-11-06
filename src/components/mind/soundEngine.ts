"use client";

/**
 * Calm sounds made live with the Web Audio API. No audio files.
 * One shared AudioContext, created on her first tap.
 */

export type SoundId =
  | "rain"
  | "ocean"
  | "river"
  | "birds"
  | "wind"
  | "fire"
  | "bowl"
  | "drone"
  | "chimes"
  | "brown"
  | "pink"
  | "crickets"
  | "om"
  | "bells"
  | "tanpura";

interface Voice {
  out: GainNode;
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers: Partial<Record<"white" | "pink" | "brown", AudioBuffer>> = {};

function context(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    // a soft limiter so a mix of four never clips
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(kind: "white" | "pink" | "brown"): AudioBuffer {
  const c = context();
  const existing = buffers[kind];
  if (existing) return existing;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * 0.5;
      else if (kind === "brown") {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
  }
  buffers[kind] = buf;
  return buf;
}

function loop(kind: "white" | "pink" | "brown"): AudioBufferSourceNode {
  const c = context();
  const s = c.createBufferSource();
  s.buffer = noise(kind);
  s.loop = true;
  s.loopStart = Math.random();
  s.start(0, Math.random() * 3);
  return s;
}

function filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = context().createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gain(v: number): GainNode {
  const g = context().createGain();
  g.gain.value = v;
  return g;
}

/** A slow wobble on an AudioParam. */
function lfo(param: AudioParam, rate: number, depth: number): OscillatorNode {
  const c = context();
  const o = c.createOscillator();
  o.frequency.value = rate;
  const g = gain(depth);
  o.connect(g).connect(param);
  o.start();
  return o;
}

/** Runs `fn` again after a random wait, until stopped. */
function every(minMs: number, maxMs: number, fn: () => void): () => void {
  let t: ReturnType<typeof setTimeout>;
  let live = true;
  const tick = () => {
    if (!live) return;
    fn();
    t = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
  };
  t = setTimeout(tick, 200 + Math.random() * minMs * 0.5);
  return () => {
    live = false;
    clearTimeout(t);
  };
}

/** A struck partial with a long, soft decay. */
function ping(dest: AudioNode, freq: number, level: number, decay: number, type: OscillatorType = "sine", pan = 0, attack = 0.01) {
  const c = context();
  const now = c.currentTime;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  const p = c.createStereoPanner();
  p.pan.value = pan;
  o.connect(g).connect(p).connect(dest);
  o.start(now);
  o.stop(now + decay + 0.1);
}

function build(id: SoundId, out: GainNode): () => void {
  const c = context();
  const stops: (() => void)[] = [];
  const nodes: AudioScheduledSourceNode[] = [];
  const keep = (n: AudioScheduledSourceNode) => (nodes.push(n), n);

  switch (id) {
    case "rain": {
      const body = keep(loop("pink"));
      const hp = filter("highpass", 500);
      const lp = filter("lowpass", 7000);
      body.connect(hp).connect(lp).connect(gain(0.9)).connect(out);
      const hiss = keep(loop("white"));
      const g = gain(0.12);
      hiss.connect(filter("highpass", 3500)).connect(g).connect(out);
      keep(lfo(g.gain, 0.17, 0.05));
      // drops
      stops.push(
        every(40, 160, () => {
          const s = c.createBufferSource();
          s.buffer = noise("white");
          const f = filter("bandpass", 2000 + Math.random() * 4000, 4);
          const e = c.createGain();
          const now = c.currentTime;
          e.gain.setValueAtTime(0.25 * Math.random(), now);
          e.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          const p = c.createStereoPanner();
          p.pan.value = Math.random() * 2 - 1;
          s.connect(f).connect(e).connect(p).connect(out);
          s.start(now, Math.random() * 3, 0.05);
        }),
      );
      break;
    }
    case "ocean": {
      const s = keep(loop("brown"));
      const lp = filter("lowpass", 500);
      const g = gain(0.55);
      s.connect(lp).connect(g).connect(out);
      keep(lfo(g.gain, 0.08, 0.45));
      keep(lfo(lp.frequency, 0.08, 350));
      const foam = keep(loop("pink"));
      const fg = gain(0.08);
      foam.connect(filter("highpass", 1500)).connect(fg).connect(out);
      keep(lfo(fg.gain, 0.08, 0.07));
      break;
    }
    case "river": {
      const s = keep(loop("pink"));
      const bp = filter("bandpass", 900, 0.5);
      const g = gain(1.1);
      s.connect(bp).connect(g).connect(out);
      keep(lfo(bp.frequency, 0.3, 250));
      keep(lfo(g.gain, 0.45, 0.15));
      const s2 = keep(loop("white"));
      const bp2 = filter("bandpass", 2800, 1.2);
      s2.connect(bp2).connect(gain(0.12)).connect(out);
      keep(lfo(bp2.frequency, 0.7, 600));
      break;
    }
    case "wind": {
      const s = keep(loop("white"));
      const bp = filter("bandpass", 500, 1.5);
      const g = gain(0.6);
      s.connect(bp).connect(g).connect(out);
      keep(lfo(bp.frequency, 0.05, 300));
      keep(lfo(g.gain, 0.11, 0.35));
      break;
    }
    case "birds": {
      const bed = keep(loop("pink"));
      bed.connect(filter("highpass", 2000)).connect(gain(0.03)).connect(out);
      stops.push(
        every(900, 3500, () => {
          const base = 2400 + Math.random() * 2200;
          const n = 2 + Math.floor(Math.random() * 4);
          const pan = Math.random() * 1.6 - 0.8;
          for (let i = 0; i < n; i++) {
            const at = c.currentTime + i * (0.12 + Math.random() * 0.08);
            const o = c.createOscillator();
            const mod = c.createOscillator();
            const md = c.createGain();
            mod.frequency.value = 30 + Math.random() * 40;
            md.gain.value = 250 + Math.random() * 300;
            mod.connect(md).connect(o.frequency);
            o.frequency.setValueAtTime(base, at);
            o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.5), at + 0.06);
            o.frequency.exponentialRampToValueAtTime(base * 0.9, at + 0.12);
            const e = c.createGain();
            e.gain.setValueAtTime(0, at);
            e.gain.linearRampToValueAtTime(0.12, at + 0.015);
            e.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
            const p = c.createStereoPanner();
            p.pan.value = pan;
            o.connect(e).connect(p).connect(out);
            o.start(at);
            mod.start(at);
            o.stop(at + 0.16);
            mod.stop(at + 0.16);
          }
        }),
      );
      break;
    }
    case "fire": {
      const s = keep(loop("brown"));
      const g = gain(0.5);
      s.connect(filter("lowpass", 400)).connect(g).connect(out);
      keep(lfo(g.gain, 0.3, 0.12));
      stops.push(
        every(60, 400, () => {
          const b = c.createBufferSource();
          b.buffer = noise("white");
          const e = c.createGain();
          const now = c.currentTime;
          e.gain.setValueAtTime(0.5 * Math.random(), now);
          e.gain.exponentialRampToValueAtTime(0.0001, now + 0.02 + Math.random() * 0.03);
          const p = c.createStereoPanner();
          p.pan.value = Math.random() * 1.2 - 0.6;
          b.connect(filter("highpass", 1500 + Math.random() * 2000)).connect(e).connect(p).connect(out);
          b.start(now, Math.random() * 3, 0.06);
        }),
      );
      break;
    }
    case "brown": {
      keep(loop("brown")).connect(filter("lowpass", 900)).connect(gain(0.8)).connect(out);
      break;
    }
    case "pink": {
      keep(loop("pink")).connect(filter("lowpass", 5000)).connect(gain(0.6)).connect(out);
      break;
    }
    case "crickets": {
      const night = keep(loop("brown"));
      night.connect(filter("lowpass", 300)).connect(gain(0.15)).connect(out);
      stops.push(
        every(700, 1600, () => {
          const at = c.currentTime;
          const f = 4300 + Math.random() * 500;
          const pan = Math.random() * 1.4 - 0.7;
          for (let i = 0; i < 3; i++) {
            const o = c.createOscillator();
            o.frequency.value = f;
            const e = c.createGain();
            const t = at + i * 0.07;
            e.gain.setValueAtTime(0, t);
            // trilled with a fast square wobble
            const trill = c.createOscillator();
            trill.type = "square";
            trill.frequency.value = 45;
            const td = c.createGain();
            td.gain.value = 0.025;
            trill.connect(td).connect(e.gain);
            e.gain.linearRampToValueAtTime(0.03, t + 0.01);
            e.gain.linearRampToValueAtTime(0, t + 0.05);
            const p = c.createStereoPanner();
            p.pan.value = pan;
            o.connect(e).connect(p).connect(out);
            o.start(t);
            trill.start(t);
            o.stop(t + 0.06);
            trill.stop(t + 0.06);
          }
        }),
      );
      break;
    }
    case "om": {
      // A low hum near 136 Hz with soft harmonics and a slow swell, through a warm "oh-m" filter.
      const f0 = 136.1;
      const lp = filter("lowpass", 900, 1);
      const g = gain(0.22);
      lp.connect(g).connect(out);
      keep(lfo(g.gain, 0.09, 0.14));
      keep(lfo(lp.frequency, 0.09, 400));
      [1, 2, 3, 4].forEach((h, i) => {
        for (const det of [-1.5, 1.5]) {
          const o = c.createOscillator();
          o.type = i === 0 ? "sine" : "triangle";
          o.frequency.value = f0 * h + det;
          const hg = gain([0.6, 0.25, 0.12, 0.06][i]);
          o.connect(hg).connect(lp);
          o.start();
          nodes.push(o);
        }
      });
      break;
    }
    case "drone": {
      const lp = filter("lowpass", 600);
      const g = gain(0.18);
      lp.connect(g).connect(out);
      keep(lfo(g.gain, 0.05, 0.08));
      for (const f of [110, 110.6, 165, 220.4]) {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(gain(0.15)).connect(lp);
        o.start();
        nodes.push(o);
      }
      break;
    }
    case "bowl": {
      const strike = () => {
        const f = 220 + Math.random() * 20;
        [1, 2.71, 5.15, 8.1].forEach((r, i) => {
          ping(out, f * r, [0.22, 0.12, 0.06, 0.03][i], 9 - i * 1.5, "sine", 0, 0.004);
          ping(out, f * r * 1.004, [0.12, 0.06, 0.03, 0.015][i], 8 - i * 1.5, "sine", 0, 0.004);
        });
      };
      strike();
      stops.push(every(7000, 9000, strike));
      break;
    }
    case "bells": {
      const strike = () => {
        const f = 520 + Math.random() * 80;
        [1, 2.4, 3.9, 5.4].forEach((r, i) => ping(out, f * r, [0.16, 0.08, 0.05, 0.03][i], 4.5 - i, "sine", Math.random() * 0.6 - 0.3, 0.003));
      };
      stops.push(every(2500, 6000, strike));
      break;
    }
    case "chimes": {
      const notes = [523.3, 587.3, 659.3, 784, 880, 1046.5];
      stops.push(
        every(500, 2200, () => {
          const f = notes[Math.floor(Math.random() * notes.length)];
          ping(out, f, 0.08, 3.5, "sine", Math.random() * 1.6 - 0.8, 0.003);
          ping(out, f * 2.76, 0.02, 1.5, "sine", 0, 0.003);
        }),
      );
      break;
    }
    case "tanpura": {
      // Pa, Sa', Sa', Sa, plucked in turn over a soft buzz.
      const sa = 130.8;
      const seq = [sa * 1.5, sa * 2, sa * 2, sa];
      let i = 0;
      const pluck = () => {
        const f = seq[i % seq.length];
        i++;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(2500, now);
        lp.frequency.exponentialRampToValueAtTime(500, now + 3);
        const e = c.createGain();
        e.gain.setValueAtTime(0, now);
        e.gain.linearRampToValueAtTime(0.09, now + 0.02);
        e.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        o.connect(lp).connect(e).connect(out);
        o.start(now);
        o.stop(now + 4.6);
      };
      pluck();
      stops.push(every(1150, 1300, pluck));
      break;
    }
  }

  return () => {
    stops.forEach((s) => s());
    nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    });
  };
}

const voices = new Map<string, Voice>();

/** Start a sound at a volume from 0 to 1. Fades in. */
export function startSound(id: SoundId, volume: number) {
  if (voices.has(id)) return;
  const c = context();
  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.linearRampToValueAtTime(volume, c.currentTime + 1.2);
  out.connect(master as GainNode);
  const stop = build(id, out);
  voices.set(id, { out, stop });
}

export function setVolume(id: string, volume: number) {
  const v = voices.get(id);
  if (v && ctx) v.out.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
}

/** Fade out and stop. */
export function stopSound(id: string) {
  const v = voices.get(id);
  if (!v || !ctx) return;
  voices.delete(id);
  const now = ctx.currentTime;
  v.out.gain.cancelScheduledValues(now);
  v.out.gain.setValueAtTime(v.out.gain.value, now);
  v.out.gain.linearRampToValueAtTime(0, now + 0.6);
  setTimeout(() => {
    v.stop();
    v.out.disconnect();
  }, 700);
}

/** Play her own uploaded file through the same mixer. */
export function startFile(id: string, url: string, volume: number) {
  if (voices.has(id)) return;
  const c = context();
  const el = new Audio(url);
  el.loop = true;
  el.crossOrigin = "anonymous";
  const src = c.createMediaElementSource(el);
  const out = c.createGain();
  out.gain.value = volume;
  src.connect(out).connect(master as GainNode);
  void el.play();
  voices.set(id, {
    out,
    stop: () => {
      el.pause();
      src.disconnect();
    },
  });
}

export function stopAll() {
  for (const id of [...voices.keys()]) {
    const v = voices.get(id);
    voices.delete(id);
    v?.stop();
    v?.out.disconnect();
  }
  if (ctx && ctx.state === "running") void ctx.suspend();
}
