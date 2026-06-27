/**
 * Generates Hopiku SFX as 16-bit mono WAV files (no external deps).
 * Run: node scripts/generate-sfx.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "assets", "audio");
const SAMPLE_RATE = 44100;

function clamp(v, lo = -1, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function env(t, attack, decay, sustain, release, duration) {
  if (t < attack) return t / attack;
  if (t < attack + decay) {
    const p = (t - attack) / decay;
    return 1 - (1 - sustain) * p;
  }
  if (t < duration - release) return sustain;
  if (t < duration) {
    const p = (duration - t) / release;
    return sustain * p;
  }
  return 0;
}

function expEnv(t, duration, attack = 0.004, decayPower = 3.5) {
  if (t >= duration) return 0;
  if (t < attack) return t / attack;
  const p = (t - attack) / (duration - attack);
  return Math.pow(1 - p, decayPower);
}

function bellEnv(t, duration) {
  if (t >= duration) return 0;
  const attack = 0.003;
  if (t < attack) return t / attack;
  return Math.exp(-5.5 * (t - attack));
}

function osc(type, phase) {
  const x = phase % (Math.PI * 2);
  switch (type) {
    case "sine":
      return Math.sin(x);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(x));
    case "saw":
      return 2 * (x / (Math.PI * 2) - Math.floor(x / (Math.PI * 2) + 0.5));
    case "square":
      return Math.sin(x) >= 0 ? 1 : -1;
    default:
      return Math.sin(x);
  }
}

function noise() {
  return Math.random() * 2 - 1;
}

function lowpass(prev, input, cutoffHz) {
  const rc = 1 / (Math.PI * 2 * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  return prev + alpha * (input - prev);
}

function mix(tracks, durationSec) {
  const len = Math.ceil(durationSec * SAMPLE_RATE);
  const out = new Float32Array(len);
  for (const track of tracks) {
    for (let i = 0; i < len; i += 1) {
      out[i] += track[i] ?? 0;
    }
  }
  return out;
}

function renderTone({ freq, duration, type = "sine", volume = 0.5, attack = 0.004, decayPower = 3 }) {
  const len = Math.ceil(duration * SAMPLE_RATE);
  const buf = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i += 1) {
    const t = i / SAMPLE_RATE;
    const e = expEnv(t, duration, attack, decayPower);
    buf[i] = osc(type, phase) * e * volume;
    phase += (Math.PI * 2 * freq) / SAMPLE_RATE;
  }
  return buf;
}

function renderSweep({ from, to, duration, type = "sine", volume = 0.5, decayPower = 2.8 }) {
  const len = Math.ceil(duration * SAMPLE_RATE);
  const buf = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i += 1) {
    const t = i / SAMPLE_RATE;
    const p = t / duration;
    const freq = from * Math.pow(to / from, p);
    const e = expEnv(t, duration, 0.006, decayPower);
    buf[i] = osc(type, phase) * e * volume;
    phase += (Math.PI * 2 * freq) / SAMPLE_RATE;
  }
  return buf;
}

function renderNoiseBurst({ duration, volume = 0.3, cutoff = 900 }) {
  const len = Math.ceil(duration * SAMPLE_RATE);
  const buf = new Float32Array(len);
  let lp = 0;
  for (let i = 0; i < len; i += 1) {
    const t = i / SAMPLE_RATE;
    const e = expEnv(t, duration, 0.001, 4);
    lp = lowpass(lp, noise(), cutoff);
    buf[i] = lp * e * volume;
  }
  return buf;
}

function renderBell(freq, startSec, duration, volume = 0.35) {
  const offset = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.ceil((startSec + duration) * SAMPLE_RATE);
  const buf = new Float32Array(len);
  let phase = 0;
  for (let i = offset; i < len; i += 1) {
    const t = (i - offset) / SAMPLE_RATE;
    const e = bellEnv(t, duration);
    const partial =
      Math.sin(phase) * 0.72 +
      Math.sin(phase * 2.01) * 0.18 +
      Math.sin(phase * 3.02) * 0.1;
    buf[i] = partial * e * volume;
    phase += (Math.PI * 2 * freq) / SAMPLE_RATE;
  }
  return buf;
}

function normalize(samples, peak = 0.92) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max < 0.0001) return samples;
  const gain = peak / max;
  return samples.map((s) => s * gain);
}

function toWav(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i += 1) {
    buffer.writeInt16LE(clamp(Math.round(samples[i] * 32767), -32768, 32767), 44 + i * 2);
  }
  return buffer;
}

const SFX = {
  tap: () =>
    normalize(
      mix(
        [
          renderTone({ freq: 920, duration: 0.045, type: "sine", volume: 0.22, decayPower: 6 }),
          renderTone({ freq: 520, duration: 0.03, type: "triangle", volume: 0.08, decayPower: 8 }),
        ],
        0.05,
      ),
    ),

  jump: () =>
    normalize(
      mix(
        [
          renderSweep({ from: 200, to: 720, duration: 0.11, type: "sine", volume: 0.42 }),
          renderNoiseBurst({ duration: 0.09, volume: 0.14, cutoff: 1400 }),
          renderTone({ freq: 340, duration: 0.07, type: "triangle", volume: 0.1, decayPower: 5 }),
        ],
        0.13,
      ),
    ),

  land: () =>
    normalize(
      mix(
        [
          renderTone({ freq: 88, duration: 0.13, type: "sine", volume: 0.55, attack: 0.001, decayPower: 4.2 }),
          renderTone({ freq: 176, duration: 0.09, type: "triangle", volume: 0.18, attack: 0.001, decayPower: 5 }),
          renderNoiseBurst({ duration: 0.04, volume: 0.08, cutoff: 600 }),
        ],
        0.14,
      ),
    ),

  perfect: () => {
    const len = Math.ceil(0.38 * SAMPLE_RATE);
    const buf = new Float32Array(len);
    const bells = [
      { freq: 1047, at: 0, vol: 0.38 },
      { freq: 1319, at: 0.055, vol: 0.36 },
      { freq: 1568, at: 0.11, vol: 0.34 },
      { freq: 2093, at: 0.17, vol: 0.22 },
    ];
    for (const b of bells) {
      const part = renderBell(b.freq, b.at, 0.28, b.vol);
      for (let i = 0; i < part.length; i += 1) buf[i] += part[i] ?? 0;
    }
    return normalize(buf);
  },

  death: () =>
    normalize(
      mix(
        [
          renderSweep({ from: 360, to: 70, duration: 0.42, type: "saw", volume: 0.28 }),
          renderSweep({ from: 240, to: 55, duration: 0.45, type: "triangle", volume: 0.2 }),
          renderNoiseBurst({ duration: 0.15, volume: 0.06, cutoff: 400 }),
        ],
        0.46,
      ),
    ),

  impact: () =>
    normalize(
      mix(
        [
          renderTone({ freq: 52, duration: 0.22, type: "sine", volume: 0.62, attack: 0.001, decayPower: 3.2 }),
          renderTone({ freq: 104, duration: 0.16, type: "triangle", volume: 0.25, attack: 0.001, decayPower: 4 }),
          renderNoiseBurst({ duration: 0.14, volume: 0.2, cutoff: 320 }),
        ],
        0.24,
      ),
    ),
};

await mkdir(OUT_DIR, { recursive: true });

for (const [name, build] of Object.entries(SFX)) {
  const samples = build();
  const wav = toWav(samples);
  const path = join(OUT_DIR, `${name}.wav`);
  await writeFile(path, wav);
  const kb = (wav.length / 1024).toFixed(1);
  console.log(`  ${name}.wav  (${kb} KB, ${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

console.log(`\nWrote ${Object.keys(SFX).length} files to public/assets/audio/`);
