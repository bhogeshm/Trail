// Procedural 15s score: heartbeat -> rising electronic pulse -> 3 heavy impacts -> silence.
// Writes assets/music.wav (44.1 kHz stereo). Grid: 120 BPM (beat = 0.5s).
import fs from 'node:fs';

const SR = 44100;
const LEN = 15;
const N = SR * LEN;
const L = new Float32Array(N);
const R = new Float32Array(N);
const VERB = new Float32Array(N);

let seed = 42;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function biquad(type, f, q) {
  const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
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

const DUCK = new Float32Array(N).fill(1);
function pump(t, depth = 0.6, rel = 0.22) {
  const s = Math.round(t * SR);
  for (let i = 0; i < rel * SR; i++) {
    const k = s + i; if (k >= N) break;
    DUCK[k] = Math.min(DUCK[k], 1 - depth * Math.pow(1 - i / (rel * SR), 2));
  }
}

function heartbeat(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const lp = biquad('lp', 180, 0.7);
  for (let i = 0; i < 0.3 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (38 + 30 * Math.exp(-x * 25))) / SR;
    const env = Math.min(1, x / 0.012) * Math.exp(-x * 16);
    put(s + i, (Math.sin(ph) * 0.9 + run(lp, noise()) * 0.6) * env * g, 0, 0.08);
  }
}

function kick(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const hp = biquad('hp', 2500, 0.7);
  for (let i = 0; i < 0.45 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (46 + 130 * Math.exp(-x * 40))) / SR;
    let v = Math.sin(ph) * Math.exp(-x * 7);
    v += run(hp, noise()) * Math.exp(-x * 380) * 0.3;
    put(s + i, Math.tanh(v * 1.8) * 0.75 * g, 0, 0.04);
  }
  pump(t);
}

function clap(t, g = 1) {
  const s = Math.round(t * SR);
  const fl = biquad('bp', 1400, 0.9), fr = biquad('bp', 1600, 0.9);
  for (let i = 0; i < 0.35 * SR; i++) {
    const x = i / SR;
    let e = 0;
    for (const o of [0, 0.01, 0.021]) if (x >= o) e = Math.max(e, Math.exp(-(x - o) * 260));
    if (x >= 0.028) e = Math.max(e, Math.exp(-(x - 0.028) * 18) * 0.7);
    const k = s + i; if (k >= N) break;
    const vl = run(fl, noise()) * e * 2.2 * g, vr = run(fr, noise()) * e * 2.2 * g;
    L[k] += vl; R[k] += vr; VERB[k] += (vl + vr) * 0.25;
  }
}

function hat(t, g = 1, pan = 0) {
  const s = Math.round(t * SR);
  const h1 = biquad('hp', 7500, 0.7), h2 = biquad('hp', 9500, 0.7);
  for (let i = 0; i < 0.05 * SR; i++) put(s + i, run(h2, run(h1, noise())) * Math.exp(-(i / SR) * 80) * 0.45 * g, pan, 0.04);
}

function snare(t, g = 1) {
  const s = Math.round(t * SR); let ph = 0;
  const bp = biquad('bp', 2400, 0.8);
  for (let i = 0; i < 0.18 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * 200) / SR;
    put(s + i, (Math.sin(ph) * Math.exp(-x * 30) * 0.4 + run(bp, noise()) * Math.exp(-x * 24) * 1.2) * g, 0, 0.2);
  }
}

// Spark / electric crackle: gated buzz + HF noise snaps.
function crackle(t0, dur, g = 1) {
  const s0 = Math.round(t0 * SR); let ph = 0;
  const hp = biquad('hp', 3000, 0.7);
  for (let i = 0; i < dur * SR; i++) {
    const x = i / SR;
    const gate = Math.sin(x * 2 * Math.PI * 38) > 0.2 && rnd() > 0.35 ? 1 : 0.1;
    ph = (ph + 118 / SR) % 1;
    const buzz = (ph < 0.5 ? 1 : -1) * 0.35;
    const env = Math.min(1, x / 0.01) * Math.min(1, (dur - x) / 0.01);
    put(s0 + i, (buzz + run(hp, noise()) * 1.2) * gate * env * 0.5 * g, (rnd() - 0.5) * 0.6, 0.15);
  }
}
function snap(t, g = 1) {
  const s = Math.round(t * SR);
  const hp = biquad('hp', 1800, 0.7);
  for (let i = 0; i < 0.06 * SR; i++) put(s + i, run(hp, noise()) * Math.exp(-(i / SR) * 90) * 1.4 * g, 0, 0.3);
}

function impact(t, g = 1, metal = false) {
  const s = Math.round(t * SR); let ph = 0;
  const lp = biquad('lp', 2200, 0.7);
  const partials = [187, 293, 419, 611, 887].map((f) => ({ f, p: 0 }));
  for (let i = 0; i < 3.2 * SR; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (30 + 80 * Math.exp(-x * 8))) / SR;
    let v = Math.sin(ph) * Math.exp(-x * 1.3) * 1.2;
    v += run(lp, noise()) * Math.exp(-x * 3.2) * 0.6;
    if (metal) for (const q of partials) { q.p += (2 * Math.PI * q.f) / SR; v += Math.sin(q.p) * Math.exp(-x * 3.5) * 0.08; }
    put(s + i, Math.tanh(v * 1.6) * 0.85 * g, 0, 0.5);
  }
  kick(t, g);
  pump(t, 0.9, 0.7);
}

function riser(t0, t1, g = 1) {
  const s0 = Math.round(t0 * SR), s1 = Math.round(t1 * SR);
  const fl = biquad('bp', 300, 2), fr = biquad('bp', 300, 2); let ph = 0;
  for (let k = s0; k < s1 && k < N; k++) {
    const p = (k - s0) / (s1 - s0);
    if ((k - s0) % 64 === 0) { const f = 300 * Math.pow(25, p); retune(fl, 'bp', f, 2); retune(fr, 'bp', f * 1.07, 2); }
    ph += (2 * Math.PI * (160 * Math.pow(7, p))) / SR;
    const a = p * p * g, tone = Math.sin(ph) * 0.14 * a;
    L[k] += (run(fl, noise()) * 1.5 + tone) * a;
    R[k] += (run(fr, noise()) * 1.5 + tone) * a;
    VERB[k] += tone * 0.4;
  }
}

function reverseSwell(t1, dur, g = 1) {
  const s0 = Math.round((t1 - dur) * SR);
  const lp = biquad('lp', 5000, 0.7);
  for (let i = 0; i < dur * SR; i++) {
    const p = i / (dur * SR);
    put(s0 + i, run(lp, noise()) * Math.pow(p, 3) * 0.9 * g, 0, 0.2);
  }
}

// Rising pulse: 16th-note saw bass through an opening low-pass.
function pulse(t0, t1, notes, cutFrom, cutTo, g = 1) {
  const step = 0.125;
  const f = biquad('lp', cutFrom, 3);
  let n = 0;
  for (let t = t0; t < t1 - 1e-6; t += step, n++) {
    const s = Math.round(t * SR), f0 = mtof(notes[n % notes.length]);
    let ph = 0, ph2 = 0.3;
    for (let i = 0; i < step * 0.92 * SR; i++) {
      const x = i / SR, k = s + i; if (k >= N) break;
      if (i % 32 === 0) {
        const p = (t - t0 + x) / (t1 - t0);
        retune(f, 'lp', (cutFrom * Math.pow(cutTo / cutFrom, p)) * (0.6 + 0.8 * Math.exp(-x * 30)), 3);
      }
      ph = (ph + f0 / SR) % 1; ph2 = (ph2 + (f0 * 1.006) / SR) % 1;
      const env = Math.min(1, x / 0.003) * Math.exp(-x * 9);
      const v = run(f, (ph * 2 - 1) + (ph2 * 2 - 1)) * 0.3 * env * g * (0.4 + 0.6 * DUCK[k]);
      L[k] += v; R[k] += v;
    }
  }
}

function arp(t0, t1, notes, g = 1) {
  let n = 0;
  for (let t = t0; t < t1 - 1e-6; t += 0.125, n++) {
    const s = Math.round(t * SR), f0 = mtof(notes[n % notes.length]); let ph = 0;
    const pan = n % 2 ? 0.45 : -0.45;
    for (let i = 0; i < 0.11 * SR; i++) {
      const x = i / SR;
      ph += (2 * Math.PI * f0) / SR;
      const v = (Math.sin(ph) + Math.sin(ph * 2) * 0.3 + Math.sin(ph * 3) * 0.12) * Math.exp(-x * 26) * 0.16 * g;
      put(s + i, v, pan, 0.3);
    }
  }
}

function shimmer(t0, t1, g = 1) {
  const freqs = [1760, 2217, 2637, 3322, 3520];
  const s0 = Math.round(t0 * SR), s1 = Math.round(t1 * SR);
  const ph = freqs.map(() => 0);
  for (let k = s0; k < s1 && k < N; k++) {
    const p = (k - s0) / (s1 - s0), x = (k - s0) / SR;
    let v = 0;
    freqs.forEach((f, j) => { ph[j] += (2 * Math.PI * f) / SR; v += Math.sin(ph[j]) * (0.5 + 0.5 * Math.sin(x * (9 + j * 3))); });
    put(k, v * Math.pow(p, 2.2) * 0.02 * g, 0, 0.6);
  }
}

function bloom(t, notes, g = 1) {
  const s = Math.round(t * SR);
  let sub = 0;
  for (let i = 0; i < 1.6 * SR; i++) {
    const x = i / SR;
    sub += (2 * Math.PI * 44) / SR;
    put(s + i, Math.sin(sub) * Math.min(1, x / 0.03) * Math.exp(-x * 2.2) * 0.35 * g, 0, 0.1);
  }
  notes.forEach((m, n) => {
    const f = mtof(m); let a = 0, b = 0;
    for (let i = 0; i < 2.8 * SR; i++) {
      const x = i / SR;
      a += (2 * Math.PI * f) / SR; b += (2 * Math.PI * f * 3.01) / SR;
      const v = Math.sin(a + Math.sin(b) * 0.6 * Math.exp(-x * 3)) * Math.min(1, x / 0.01) * Math.exp(-x * 1.1) * 0.07 * g;
      put(s + i, v, n % 2 ? 0.35 : -0.35, 0.7);
    }
  });
}

// ---- Arrangement ----
// 0-2s: heartbeat, spark crackle, electric crack + BOOM on 1.0
heartbeat(0.04, 1.0); heartbeat(0.26, 0.6);
crackle(0.48, 0.05, 0.4); crackle(0.62, 0.04, 0.5);
heartbeat(0.7, 0.9); crackle(0.84, 0.15, 1.0); snap(0.985, 1.2);
impact(1.0, 1.25, true);
heartbeat(1.5, 0.7); heartbeat(1.7, 0.45);

// 2-5s: CREATE + rising pulse
impact(2.0, 0.55);
const PULSE_A = [33, 33, 45, 33, 33, 45, 33, 43];
pulse(2.0, 5.0, PULSE_A, 250, 1400, 1.0);
for (let t = 2.5; t < 5.0; t += 0.5) kick(t, 0.9);
for (let t = 2.75; t < 5.0; t += 0.25) hat(t, 0.55, t % 0.5 ? 0.2 : -0.2);
for (let t = 3.0; t < 5.0; t += 1.0) clap(t + 0.5, 0.8);
riser(4.2, 5.0, 0.5);

// 5-8s: DISRUPT + tunnel (faster, brighter)
impact(5.0, 0.8);
pulse(5.0, 8.0, [45, 45, 57, 45, 48, 48, 60, 50], 1200, 5200, 1.0);
arp(5.5, 7.9, [69, 72, 76, 79, 81, 79, 76, 72], 1.0);
for (let t = 5.5; t < 7.95; t += 0.5) kick(t, 1.0);
for (let t = 5.0; t < 7.9; t += 0.125) hat(t, ((t - 5) / 0.125) % 2 ? 0.7 : 0.35, ((t - 5) / 0.125) % 2 ? 0.25 : -0.25);
for (let t = 6.0; t < 7.9; t += 1.0) clap(t, 0.9);
{ let t = 7.25, step = 0.125; while (t < 7.94) { snare(t, 0.3 + (t - 7.25) * 1.0); t += step; step = Math.max(0.05, step * 0.82); } }
riser(6.4, 7.95, 1.0);

// 8-10.5s: three heavy impacts, then sudden silence
impact(8.0, 1.3, true);
reverseSwell(9.0, 0.6, 0.6);
impact(9.0, 1.4, true);
reverseSwell(10.0, 0.6, 0.8);
impact(10.0, 1.6, true);

// Stutter glitches on DISRUPT hits (repeat a 1/32 slice).
function stutter(src, dst, reps) {
  const a = Math.round(src * SR), d = Math.round(dst * SR), sl = Math.round(0.0625 * SR);
  for (let r = 0; r < reps; r++) for (let i = 0; i < sl; i++) {
    const g = (1 - r * 0.12) * (i < 40 ? i / 40 : 1);
    L[d + r * sl + i] = L[a + i] * g; R[d + r * sl + i] = R[a + i] * g;
  }
}
stutter(5.0, 5.0625, 3);
stutter(6.5, 6.5625, 3);

function reverb() {
  const combs = (lens) => lens.map((n) => ({ b: new Float32Array(n), i: 0, lp: 0 }));
  const cl = combs([1557, 1617, 1491, 1422]), cr = combs([1580, 1640, 1514, 1445]);
  const al = [556, 441].map((n) => ({ b: new Float32Array(n), i: 0 }));
  const ar = [579, 464].map((n) => ({ b: new Float32Array(n), i: 0 }));
  const proc = (cs, as, x) => {
    let y = 0;
    for (const c of cs) { const o = c.b[c.i]; c.lp = o * 0.65 + c.lp * 0.35; c.b[c.i] = x + c.lp * 0.82; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of as) { const o = a.b[a.i]; const v = -y + o; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = v; }
    return y;
  };
  for (let k = 0; k < N; k++) { L[k] += proc(cl, al, VERB[k]) * 0.2; R[k] += proc(cr, ar, VERB[k]) * 0.2; }
}
reverb();

// Sudden silence after the third impact.
const CUT0 = Math.round(10.55 * SR), CUT1 = Math.round(11.6 * SR);
for (let k = CUT0; k < N; k++) {
  const g = k < CUT0 + 220 ? 1 - (k - CUT0) / 220 : 0;
  L[k] *= g; R[k] *= g;
}

// 11.6-15s: faint shimmer as the light forms, soft bloom on the logo (added after the cut).
VERB.fill(0);
shimmer(11.6, 12.25, 1.0);
bloom(12.25, [57, 61, 64, 71, 76], 1.0);
{
  const tail = new Float32Array(N);
  const cl = [1557, 1617, 1491, 1422].map((n) => ({ b: new Float32Array(n), i: 0 }));
  for (let k = CUT1; k < N; k++) {
    let y = 0;
    for (const c of cl) { const o = c.b[c.i]; c.b[c.i] = VERB[k] + o * 0.86; c.i = (c.i + 1) % c.b.length; y += o; }
    tail[k] = y * 0.12;
  }
  for (let k = CUT1; k < N; k++) { L[k] += tail[k]; R[k] += tail[k]; }
}

let peak = 0;
for (let k = 0; k < N; k++) {
  const t = k / SR;
  const fade = t > 14.2 ? Math.max(0, (15 - t) / 0.8) : 1;
  L[k] = Math.tanh(L[k] * 0.9) * fade; R[k] = Math.tanh(R[k] * 0.9) * fade;
  peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
}
const norm = 0.9 / peak;
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
console.log('wrote assets/music.wav', LEN + 's');
