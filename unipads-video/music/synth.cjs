// Generates an original, royalty-free corporate/uplifting cue synced to the edit.
// 160 BPM, beat = 0.375s. Cuts land every 2 beats; the end-card impact lands at 3.75s.
// Usage: node music/synth.cjs [durationSeconds] > writes music/bgm.wav
const fs = require("fs");
const path = require("path");

const SR = 44100;
const DUR = parseFloat(process.argv[2] || "4.9");
const BPM = 160;
const BEAT = 60 / BPM;
const IMPACT = parseFloat(process.argv[3] || "3.75");
const N = Math.floor(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// Deterministic noise
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(t0, len, fn, gl = 1, gr = 1) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR, i);
    L[k] += v * gl;
    R[k] += v * gr;
  }
}

// Sidechain envelope (pumps pads under each kick)
function duck(t) {
  if (t >= IMPACT - 0.02 && t < IMPACT + 0.05) return 0.2;
  const ph = (t % BEAT) / BEAT;
  return 0.35 + 0.65 * Math.min(1, ph / 0.55);
}

// --- Kick on every beat (skip the beat just before impact for a lift)
function kick(t0, amp = 1) {
  let phase = 0;
  add(t0, 0.35, (t) => {
    const f = 45 + 110 * Math.exp(-t * 28);
    phase += (2 * Math.PI * f) / SR;
    return Math.sin(phase) * Math.exp(-t * 9) * amp * 0.9 + (t < 0.004 ? rnd() * 0.3 : 0);
  });
}
// --- Clap
function clap(t0, amp = 1) {
  let lp = 0;
  add(t0, 0.25, (t) => {
    const n = rnd();
    lp += 0.45 * (n - lp);
    const hp = n - lp;
    const bursts = t < 0.03 ? 0.6 + 0.4 * Math.sin(t * 900) : 1;
    return hp * Math.exp(-t * 22) * bursts * 0.35 * amp;
  }, 0.9, 1.0);
}
// --- Hat
function hat(t0, amp = 1, pan = 0) {
  let lp = 0;
  add(t0, 0.06, (t) => {
    const n = rnd();
    lp += 0.7 * (n - lp);
    return (n - lp) * Math.exp(-t * 70) * 0.18 * amp;
  }, 1 - pan, 1 + pan);
}
// --- Supersaw pad chord
function pad(t0, len, notes, amp = 1) {
  const voices = [];
  notes.forEach((m) => [-0.12, 0, 0.12].forEach((d) => voices.push({ f: midi(m + d), p: rnd() })));
  let lpL = 0, lpR = 0;
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k >= N) break;
    const t = i / SR;
    let a = 0, b = 0;
    voices.forEach((v, j) => {
      const ph = (v.p + v.f * t) % 1;
      const saw = 2 * ph - 1;
      if (j % 2) a += saw; else b += saw;
    });
    const cutoff = 0.05 + 0.08 * Math.min(1, t / len);
    lpL += cutoff * (a - lpL);
    lpR += cutoff * (b - lpR);
    const env = Math.min(1, t / 0.05) * Math.min(1, (len - t) / 0.08);
    const g = (0.05 * amp * env * duck(k / SR)) / Math.sqrt(voices.length);
    L[k] += lpL * g * 2.2;
    R[k] += lpR * g * 2.2;
  }
}
// --- Pluck (Karplus-ish via decaying square+sine)
function pluck(t0, m, amp = 1, pan = 0) {
  const f = midi(m);
  add(t0, 0.3, (t) => {
    const s = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sign(Math.sin(2 * Math.PI * f * t));
    return s * Math.exp(-t * 14) * 0.09 * amp;
  }, 1 - pan, 1 + pan);
}
// --- Bass
function bass(t0, len, m) {
  const f = midi(m);
  add(t0, len, (t, i) => {
    const k = Math.floor(t0 * SR) + i;
    const s = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t);
    const env = Math.min(1, t / 0.01) * Math.min(1, (len - t) / 0.03);
    return s * 0.22 * env * duck(k / SR);
  });
}
// --- Noise riser / reverse swell
function riser(t0, len, amp = 1) {
  let lp = 0;
  add(t0, len, (t) => {
    const x = t / len;
    lp += (0.02 + 0.5 * x * x) * (rnd() - lp);
    return lp * x * x * 0.45 * amp;
  }, 1, 1);
}
// --- Impact: sub boom + crash
function impact(t0) {
  let phase = 0;
  add(t0, 1.2, (t) => {
    const f = 38 + 70 * Math.exp(-t * 12);
    phase += (2 * Math.PI * f) / SR;
    return Math.sin(phase) * Math.exp(-t * 3.2) * 0.95;
  });
  let lp = 0;
  add(t0, 1.3, (t) => {
    const n = rnd();
    lp += 0.3 * (n - lp);
    return (n - lp) * Math.exp(-t * 3.5) * 0.28;
  }, 1, 0.9);
}

// Progression: Fmaj7 – G – Am – C (uplifting), one chord per 2 beats
const chords = [
  { pad: [65, 69, 72, 76], bass: 41, arp: [77, 81, 84, 81] },
  { pad: [67, 71, 74, 79], bass: 43, arp: [79, 83, 86, 83] },
  { pad: [69, 72, 76, 81], bass: 45, arp: [81, 84, 88, 84] },
  { pad: [67, 72, 76, 79], bass: 48, arp: [79, 84, 88, 91] },
  { pad: [65, 69, 72, 77], bass: 41, arp: [77, 81, 84, 89] },
];

// Opening: short reverse swell into the first downbeat
riser(0, 0.18, 0.6);

const beats = Math.floor(IMPACT / BEAT);
for (let b = 0; b < beats; b++) {
  const t = b * BEAT;
  kick(t, b === beats - 1 ? 0.0 : 1);
  if (b % 2 === 1) clap(t, 1);
  hat(t + BEAT / 2, 1, 0.3);
  hat(t + BEAT / 4, 0.45, -0.3);
  hat(t + (3 * BEAT) / 4, 0.45, -0.3);
}
for (let c = 0; c < Math.ceil(IMPACT / (2 * BEAT)); c++) {
  const t = c * 2 * BEAT;
  const ch = chords[c % chords.length];
  const len = Math.min(2 * BEAT, IMPACT - t);
  pad(t, len, ch.pad, 1);
  for (let s = 0; s < 8; s++) {
    const tt = t + s * (BEAT / 4) * 2 / 2;
    if (tt >= IMPACT - 0.01) break;
    pluck(tt, ch.arp[s % 4], s % 2 ? 0.7 : 1, s % 2 ? 0.35 : -0.35);
  }
  bass(t, BEAT * 0.9, ch.bass);
  if (t + BEAT < IMPACT) bass(t + BEAT, BEAT * 0.9, ch.bass);
}
// Snare-roll-ish build + riser into the end card
riser(IMPACT - 1.5 * BEAT * 2, 1.5 * BEAT * 2, 1);
for (let i = 0; i < 6; i++) clap(IMPACT - BEAT + (i * BEAT) / 6, 0.4 + i * 0.1);

// Resolving end card: impact + big sustained chord that fades out
impact(IMPACT);
pad(IMPACT, DUR - IMPACT, [53, 60, 65, 69, 72, 77], 1.8);
bass(IMPACT, DUR - IMPACT - 0.05, 29 + 12);
[77, 81, 84, 89].forEach((m, i) => pluck(IMPACT + i * 0.09, m, 0.8, i % 2 ? 0.4 : -0.4));

// Master: soft clip + final fade
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.95 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, (DUR - t) / 0.6) * Math.min(1, t / 0.005);
  const l = Math.tanh(L[i] * g * 1.3) * fade;
  const r = Math.tanh(R[i] * g * 1.3) * fade;
  buf.writeInt16LE(Math.round(l * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32000), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, "bgm.wav"), buf);
console.log("wrote bgm.wav", DUR, "s");
