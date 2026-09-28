// Procedural 15s stomp-style track at 120 BPM. Writes assets/music.wav.
import fs from 'node:fs';

const SR = 44100;
const LEN = 15;
const N = SR * LEN;
const L = new Float32Array(N);
const R = new Float32Array(N);
const VERB = new Float32Array(N);

let seed = 1337;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function biquad(type, f, q) {
  const w = (2 * Math.PI * f) / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - a) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
function run(f, x) {
  const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
  f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
  return y;
}
function retune(f, type, freq, q) {
  const n = biquad(type, freq, q);
  f.b0 = n.b0; f.b1 = n.b1; f.b2 = n.b2; f.a1 = n.a1; f.a2 = n.a2;
}

function put(i, v, pan = 0, send = 0) {
  if (i < 0 || i >= N) return;
  L[i] += v * Math.min(1, 1 - pan);
  R[i] += v * Math.min(1, 1 + pan);
  VERB[i] += v * send;
}

// Sidechain envelope: kicks/impacts pump the bass and pad.
const DUCK = new Float32Array(N).fill(1);
function pump(t, depth = 0.6, rel = 0.22) {
  const s = Math.round(t * SR);
  for (let i = 0; i < rel * SR; i++) {
    const k = s + i; if (k >= N) break;
    const v = 1 - depth * Math.pow(1 - i / (rel * SR), 2);
    DUCK[k] = Math.min(DUCK[k], v);
  }
}

function kick(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const hp = biquad('hp', 2500, 0.7);
  for (let i = 0; i < 0.5 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (48 + 120 * Math.exp(-x * 38))) / SR;
    let v = Math.sin(ph) * Math.exp(-x * 6.5);
    v += run(hp, noise()) * Math.exp(-x * 350) * 0.35;
    put(s + i, Math.tanh(v * 1.8) * 0.8 * g, 0, 0.05);
  }
  pump(t);
}

function stomp(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0, ph2 = 0;
  const lp = biquad('lp', 700, 0.8), bp = biquad('bp', 180, 1.2);
  for (let i = 0; i < 0.6 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (42 + 75 * Math.exp(-x * 28))) / SR;
    ph2 += (2 * Math.PI * 112) / SR;
    let v = Math.sin(ph) * Math.exp(-x * 8) * 0.9;
    v += Math.sin(ph2) * Math.exp(-x * 22) * 0.25;
    v += run(lp, noise()) * Math.exp(-x * 30) * 0.9;
    v += run(bp, noise()) * Math.exp(-x * 14) * 1.2;
    put(s + i, Math.tanh(v * 1.6) * 0.85 * g, 0, 0.3);
  }
  pump(t, 0.5);
}

function clap(t, g = 1) {
  const s = Math.round(t * SR);
  const fl = biquad('bp', 1300, 0.9), fr = biquad('bp', 1500, 0.9);
  for (let i = 0; i < 0.45 * SR; i++) {
    const x = i / SR;
    let e = 0;
    for (const o of [0, 0.011, 0.023]) if (x >= o) e = Math.max(e, Math.exp(-(x - o) * 260));
    if (x >= 0.03) e = Math.max(e, Math.exp(-(x - 0.03) * 16) * 0.8);
    const vl = run(fl, noise()) * e * 2.6, vr = run(fr, noise()) * e * 2.6;
    const k = s + i; if (k >= N) break;
    L[k] += vl * g; R[k] += vr * g; VERB[k] += (vl + vr) * 0.3 * g;
  }
}

function hat(t, g = 1, open = false, pan = 0) {
  const s = Math.round(t * SR);
  const h1 = biquad('hp', 7000, 0.7), h2 = biquad('hp', 9000, 0.7);
  const dur = open ? 0.25 : 0.06;
  for (let i = 0; i < dur * SR; i++) {
    const x = i / SR;
    put(s + i, run(h2, run(h1, noise())) * Math.exp(-x * (open ? 14 : 70)) * 0.5 * g, pan, 0.05);
  }
}

function snare(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const bp = biquad('bp', 2200, 0.8);
  for (let i = 0; i < 0.2 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * 190) / SR;
    const v = Math.sin(ph) * Math.exp(-x * 30) * 0.4 + run(bp, noise()) * Math.exp(-x * 22) * 1.3;
    put(s + i, v * g, 0, 0.2);
  }
}

function impact(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const lp = biquad('lp', 1800, 0.7);
  for (let i = 0; i < 2.6 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (34 + 70 * Math.exp(-x * 9))) / SR;
    let v = Math.sin(ph) * Math.exp(-x * 1.6) * 1.1;
    v += run(lp, noise()) * Math.exp(-x * 4) * 0.45;
    put(s + i, Math.tanh(v * 1.5) * 0.8 * g, 0, 0.45);
  }
  kick(t, 0.9 * g);
  pump(t, 0.85, 0.6);
}

function riser(t0, t1, g = 1) {
  const s0 = Math.round(t0 * SR), s1 = Math.round(t1 * SR);
  const fl = biquad('bp', 300, 2), fr = biquad('bp', 300, 2); let ph = 0;
  for (let k = s0; k < s1 && k < N; k++) {
    const p = (k - s0) / (s1 - s0);
    if ((k - s0) % 64 === 0) { const f = 300 * Math.pow(22, p); retune(fl, 'bp', f, 2); retune(fr, 'bp', f * 1.07, 2); }
    ph += (2 * Math.PI * (180 * Math.pow(6, p))) / SR;
    const a = p * p * g;
    const tone = Math.sin(ph) * 0.12 * a;
    L[k] += (run(fl, noise()) * 1.6 + tone) * a;
    R[k] += (run(fr, noise()) * 1.6 + tone) * a;
    VERB[k] += tone * 0.5;
  }
}

function sweepDown(t, dur, g = 1) {
  const s0 = Math.round(t * SR);
  const f = biquad('bp', 6000, 1.5);
  for (let i = 0; i < dur * SR; i++) {
    const p = i / (dur * SR);
    if (i % 64 === 0) retune(f, 'bp', 6000 * Math.pow(0.04, p), 1.5);
    put(s0 + i, run(f, noise()) * (1 - p) * 1.2 * g, 0, 0.3);
  }
}

function typeClick(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const hp = biquad('hp', 3000, 0.7);
  for (let i = 0; i < 0.03 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * 4200) / SR;
    put(s + i, (run(hp, noise()) * 0.8 + Math.sin(ph) * 0.2) * Math.exp(-x * 500) * g, (rnd() - 0.5) * 0.4, 0.05);
  }
}

function bassNote(t, dur, midi, g = 1) {
  const s = Math.round(t * SR), f0 = mtof(midi);
  const lp = biquad('lp', 1200, 1.2); let ph = 0, sub = 0;
  for (let i = 0; i < dur * SR; i++) {
    const x = i / SR;
    if (i % 32 === 0) retune(lp, 'lp', 180 + 1400 * Math.exp(-x * 14), 1.4);
    ph = (ph + f0 / SR) % 1; sub += (2 * Math.PI * f0) / SR;
    const env = Math.min(1, x / 0.004) * Math.min(1, (dur - x) / 0.02);
    const v = run(lp, ph * 2 - 1) * 0.55 + Math.sin(sub) * 0.55;
    put(s + i, Math.tanh(v * 1.4) * env * 0.55 * g);
  }
}

function pad(t0, t1, notes, g, cutFrom, cutTo) {
  const s0 = Math.round(t0 * SR), s1 = Math.round(t1 * SR);
  const voices = [];
  notes.forEach((m) => [-0.12, 0, 0.11].forEach((d) => voices.push({ f: mtof(m + d), p: rnd(), pan: d * 5 })));
  const fl = biquad('lp', cutFrom, 0.9), fr = biquad('lp', cutFrom, 0.9);
  for (let k = s0; k < s1 && k < N; k++) {
    const p = (k - s0) / (s1 - s0);
    if ((k - s0) % 128 === 0) { const c = cutFrom * Math.pow(cutTo / cutFrom, p); retune(fl, 'lp', c, 0.9); retune(fr, 'lp', c, 0.9); }
    let l = 0, r = 0;
    for (const v of voices) { v.p = (v.p + v.f / SR) % 1; const saw = v.p * 2 - 1; l += saw * (1 - v.pan * 0.5); r += saw * (1 + v.pan * 0.5); }
    const env = Math.min(1, (k - s0) / (SR * 0.6)) * Math.min(1, (s1 - k) / (SR * 0.3));
    const sc = 0.35 + 0.65 * DUCK[k];
    L[k] += run(fl, l) * 0.05 * g * env * sc;
    R[k] += run(fr, r) * 0.05 * g * env * sc;
  }
}

function stab(t, notes, g = 1) {
  const s = Math.round(t * SR);
  notes.forEach((m, n) => {
    const f = mtof(m); let ph = 0, ph2 = 0;
    for (let i = 0; i < 1.8 * SR; i++) {
      const x = i / SR;
      ph += (2 * Math.PI * f) / SR; ph2 += (2 * Math.PI * f * 2.0) / SR;
      const v = Math.sin(ph + Math.sin(ph2) * 1.2 * Math.exp(-x * 6)) * Math.exp(-x * 2.4) * 0.16 * g;
      put(s + i, v, (n % 2 ? 0.3 : -0.3), 0.6);
    }
  });
}

// ---- Arrangement (beat = 0.5s) ----
const BAR_A = [[0, 'stomp', 1.1], [0.25, 'stomp'], [0.625, 'clap'], [1.0, 'stomp'], [1.375, 'clap'], [1.375, 'stomp', 0.6],
  [2.0, 'stomp'], [2.25, 'stomp'], [2.5, 'clap']];
const BAR_B = [[3.0, 'stomp', 1.1], [3.0, 'kick', 0.8], [3.375, 'stomp'], [4.5, 'stomp'], [4.75, 'stomp'], [5.0, 'clap']];
const BAR_C = [[5.5, 'stomp'], [5.75, 'stomp'], [6.0, 'stomp', 1.1], [6.0, 'kick', 0.8], [6.5, 'clap', 1.2],
  [7.0, 'stomp'], [7.0, 'kick', 0.7], [7.25, 'stomp'], [7.5, 'clap'], [7.5, 'kick', 0.7], [8.0, 'stomp'], [8.0, 'kick', 0.8], [8.25, 'stomp']];
const inst = { stomp, clap, kick, snare };
for (const [t, name, g = 1] of [...BAR_A, ...BAR_B, ...BAR_C]) inst[name](t, g);

impact(0, 0.5);
riser(1.75, 3.0, 0.8);
impact(3.75, 1.0);
sweepDown(3.8, 1.2, 0.5);
impact(6.5, 0.55);
for (let t = 6.75; t < 7.5; t += 0.25) hat(t, 0.6, false, 0.2);
for (let t = 7.5; t < 8.375; t += 0.125) hat(t, 0.7, false, -0.2);
{
  let t = 7.75, step = 0.125;
  while (t < 8.4) { snare(t, 0.35 + (t - 7.75) * 1.1); t += step; step = Math.max(0.0625, step * 0.8); }
}
riser(7.0, 8.4, 1.0);

// Drop
impact(8.5, 1.1);
sweepDown(8.55, 1.0, 0.4);
for (let t = 8.5; t < 13.49; t += 0.5) kick(t, 1.0);
for (let t = 9.0; t < 13.49; t += 1.0) { clap(t, 1.0); stomp(t, 0.5); }
for (let t = 8.75; t < 13.49; t += 1.0) stomp(t, 0.8);
for (let t = 8.5; t < 13.0; t += 0.125) {
  const off = Math.abs(((t - 8.5) / 0.25) % 2 - 1) < 1e-6;
  hat(t, off ? 0.8 : 0.4, false, off ? 0.25 : -0.25);
}
for (let t = 8.75; t < 13.0; t += 0.5) hat(t, 0.35, true, 0.1);
const RIFF = [28, 28, 40, 28, 31, 31, 43, 31, 33, 33, 45, 33, 26, 26, 38, 35];
{ let n = 0; for (let t = 8.5; t < 13.49; t += 0.25) bassNote(t, 0.22, RIFF[n++ % RIFF.length], 1.0); }
for (let i = 0; i < 26; i++) typeClick(8.62 + i * 0.034 + rnd() * 0.012, 0.35);
for (let t = 12.25; t < 13.0; t += 0.25) stomp(t, 0.9);
{ let t = 13.0; while (t < 13.47) { snare(t, 0.4 + (t - 13.0) * 1.2); t += 0.0625; } }
riser(12.5, 13.45, 0.9);

// Outro
impact(13.5, 1.2);
stab(13.5, [52, 59, 64, 66, 71], 1.0);
stomp(14.0, 0.7); stomp(14.25, 0.7); clap(14.5, 0.8);

pad(0, 8.45, [40, 47, 52, 55], 1.0, 350, 1600);
pad(8.5, 15, [40, 47, 52, 55, 59], 0.9, 1400, 500);

// Stutter glitch into the language switch (repeat a 1/32 slice).
{
  const src = Math.round(5.0 * SR), sl = Math.round(0.0625 * SR), dst = Math.round(5.25 * SR);
  for (let r = 0; r < 4; r++) for (let i = 0; i < sl; i++) {
    const a = (1 - r * 0.15) * (i < 40 ? i / 40 : 1);
    L[dst + r * sl + i] = L[src + i] * a; R[dst + r * sl + i] = R[src + i] * a;
  }
}

// Mono-in / stereo-out reverb (Schroeder).
function reverb() {
  const combs = (lens) => lens.map((n) => ({ b: new Float32Array(n), i: 0, lp: 0 }));
  const cl = combs([1557, 1617, 1491, 1422]), cr = combs([1580, 1640, 1514, 1445]);
  const al = [556, 441].map((n) => ({ b: new Float32Array(n), i: 0 }));
  const ar = [579, 464].map((n) => ({ b: new Float32Array(n), i: 0 }));
  const proc = (cs, as, x) => {
    let y = 0;
    for (const c of cs) { const o = c.b[c.i]; c.lp = o * 0.7 + c.lp * 0.3; c.b[c.i] = x + c.lp * 0.8; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of as) { const o = a.b[a.i]; const v = -y + o; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = v; }
    return y;
  };
  for (let k = 0; k < N; k++) { L[k] += proc(cl, al, VERB[k]) * 0.18; R[k] += proc(cr, ar, VERB[k]) * 0.18; }
}
reverb();

// Master: fade-out tail, soft clip, normalise.
let peak = 0;
for (let k = 0; k < N; k++) {
  const t = k / SR;
  const fade = t > 14.4 ? Math.max(0, (15 - t) / 0.6) : 1;
  L[k] = Math.tanh(L[k] * 0.9) * fade; R[k] = Math.tanh(R[k] * 0.9) * fade;
  peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[k] * norm)) * 32767), 44 + k * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[k] * norm)) * 32767), 46 + k * 4);
}
fs.mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../assets/music.wav', import.meta.url), buf);
console.log('wrote assets/music.wav', LEN + 's', 'peak-norm', norm.toFixed(2));
