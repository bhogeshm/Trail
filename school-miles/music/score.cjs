// Original, royalty-free score for "School Miles" — warm piano + strings with a
// stomp-and-clap pulse. 120 BPM (beat = 0.5s). Accents land on every title change:
// 3.0, 7.0, 11.0, 16.0, 20.0 and the end-card hit at 22.7.
// Usage: node music/score.cjs  ->  writes assets/score.wav
const fs = require("fs");
const path = require("path");

const SR = 48000;
const DUR = 26.8;
const BEAT = 0.5;
const N = Math.floor(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N); // reverb send
const sendR = new Float32Array(N);

let seed = 20260929;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(t0, len, fn, { gl = 1, gr = 1, rev = 0 } = {}) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR, k / SR);
    L[k] += v * gl;
    R[k] += v * gr;
    sendL[k] += v * gl * rev;
    sendR[k] += v * gr * rev;
  }
}

// ---------- Arrangement intensity ----------
// 0-3 intro (piano + pad), 3-11 stomp/clap, 11-20 full, 20-22.7 lift, 22.7+ resolve
const HITS = [3, 7, 11, 16, 20];
const FINAL = 22.7;

// Ducking of sustained parts under each stomp
function duck(t) {
  if (t < 3 || t > FINAL) return 1;
  const ph = (t % 1.0) / 1.0; // stomps every 1s
  return 0.62 + 0.38 * Math.min(1, ph / 0.35);
}

// ---------- Instruments ----------
function piano(t0, m, vel = 1, len = 2.2, pan = 0) {
  const f = midi(m);
  const partials = [1, 2, 3, 4, 5, 6].map((h) => ({
    f: f * h * (1 + 0.0004 * h * h),
    a: [1, 0.45, 0.22, 0.12, 0.06, 0.03][h - 1],
    d: 1.6 + h * 1.1,
  }));
  add(
    t0,
    len,
    (t) => {
      let s = 0;
      for (const p of partials) s += Math.sin(2 * Math.PI * p.f * t) * p.a * Math.exp(-t * p.d);
      const att = Math.min(1, t / 0.004);
      const rel = Math.min(1, (len - t) / 0.25);
      return s * att * rel * 0.1 * vel;
    },
    { gl: 1 - pan * 0.5, gr: 1 + pan * 0.5, rev: 0.55 },
  );
}

function strings(t0, len, notes, amp = 1) {
  const voices = [];
  notes.forEach((m) =>
    [-0.07, 0.0, 0.08].forEach((d, j) => voices.push({ f: midi(m + d), p: (j * 0.31 + m * 0.07) % 1, side: j % 2 })),
  );
  let lpL = 0,
    lpR = 0;
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const t = i / SR;
    let a = 0,
      b = 0;
    for (const v of voices) {
      const vib = 1 + 0.0025 * Math.sin(2 * Math.PI * 5.2 * t + v.p * 6);
      const ph = (v.p + v.f * vib * t) % 1;
      const saw = 2 * ph - 1;
      if (v.side) a += saw;
      else b += saw;
    }
    lpL += 0.035 * (a - lpL);
    lpR += 0.035 * (b - lpR);
    const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.5);
    const g = (0.09 * amp * env * duck(k / SR)) / Math.sqrt(voices.length);
    L[k] += lpL * g;
    R[k] += lpR * g;
    sendL[k] += lpL * g * 0.5;
    sendR[k] += lpR * g * 0.5;
  }
}

function bass(t0, len, m, amp = 1) {
  const f = midi(m);
  add(t0, len, (t, abs) => {
    const s = Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t);
    const env = Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.08);
    return s * 0.2 * amp * env * duck(abs);
  });
}

// Stomp: foot on a wooden stage — low thump + boxy body + room
function stomp(t0, amp = 1) {
  let ph = 0;
  add(
    t0,
    0.5,
    (t) => {
      const f = 48 + 95 * Math.exp(-t * 30);
      ph += (2 * Math.PI * f) / SR;
      return Math.sin(ph) * Math.exp(-t * 11) * 0.85 * amp;
    },
    { rev: 0.25 },
  );
  let lp = 0,
    lp2 = 0;
  add(
    t0,
    0.22,
    (t) => {
      const n = rnd();
      lp += 0.08 * (n - lp);
      lp2 += 0.08 * (lp - lp2);
      return lp2 * Math.exp(-t * 26) * 2.6 * amp;
    },
    { rev: 0.45 },
  );
}

// Clap: layered short noise bursts, band-passed
function clap(t0, amp = 1) {
  let lp = 0;
  add(
    t0,
    0.35,
    (t) => {
      const n = rnd();
      lp += 0.35 * (n - lp);
      const bp = n - lp;
      let env = Math.exp(-t * 18);
      if (t < 0.03) env *= 0.55 + 0.45 * Math.cos(t * 2 * Math.PI * 100);
      return bp * env * 0.32 * amp;
    },
    { gl: 0.95, gr: 1.05, rev: 0.7 },
  );
}

function shaker(t0, amp = 1, pan = 0) {
  let lp = 0;
  add(
    t0,
    0.09,
    (t) => {
      const n = rnd();
      lp += 0.6 * (n - lp);
      const env = Math.min(1, t / 0.012) * Math.exp(-t * 45);
      return (n - lp) * env * 0.09 * amp;
    },
    { gl: 1 - pan, gr: 1 + pan, rev: 0.2 },
  );
}

// Soft reversed-cymbal swell into a hit
function swell(tEnd, len, amp = 1) {
  let lp = 0;
  add(
    tEnd - len,
    len,
    (t) => {
      const x = t / len;
      lp += (0.05 + 0.6 * x) * (rnd() - lp);
      return (rnd() - lp) * x * x * x * 0.16 * amp;
    },
    { rev: 0.4 },
  );
}

// Cinematic hit: deep boom + soft crash
function boom(t0, amp = 1) {
  let ph = 0;
  add(
    t0,
    2.0,
    (t) => {
      const f = 36 + 50 * Math.exp(-t * 9);
      ph += (2 * Math.PI * f) / SR;
      return Math.sin(ph) * Math.exp(-t * 2.4) * 0.7 * amp;
    },
    { rev: 0.2 },
  );
  let hp = 0;
  add(
    t0,
    2.4,
    (t) => {
      const n = rnd();
      hp += 0.25 * (n - hp);
      return (n - hp) * Math.exp(-t * 2.2) * 0.1 * amp;
    },
    { rev: 0.8 },
  );
}

// ---------- Harmony: Am – F – C – G, one chord per bar (2s) ----------
const PROG = [
  { root: 45, chord: [57, 60, 64], hi: [69, 72, 76] }, // Am
  { root: 41, chord: [57, 60, 65], hi: [69, 72, 77] }, // F
  { root: 48, chord: [55, 60, 64], hi: [67, 72, 76] }, // C
  { root: 43, chord: [55, 59, 62], hi: [67, 71, 74] }, // G
];
const chordAt = (bar) => PROG[bar % 4];

// Piano: gentle broken-chord pattern on 8ths, sparse in intro
for (let bar = 0; bar < 12; bar++) {
  const t = bar * 2;
  if (t >= FINAL) break;
  const c = chordAt(bar);
  const full = t >= 11;
  const pattern = full ? [0, 2, 1, 2, 0, 2, 1, 2] : [0, -1, 1, -1, 2, -1, 1, -1];
  pattern.forEach((idx, j) => {
    if (idx < 0) return;
    const tt = t + j * 0.25;
    if (tt >= FINAL) return;
    const note = c.hi[idx];
    piano(tt, note, j % 4 === 0 ? 0.95 : 0.7, 1.6, idx === 1 ? -0.3 : 0.3);
  });
  piano(t, c.chord[0] - 12 + 12, 0.55, 2.0, 0); // low support voice
}

// Strings enter at 3s, open up at 11s and 20s
for (let bar = 0; bar < 12; bar++) {
  const t = bar * 2;
  if (t + 0.01 >= FINAL) break;
  const c = chordAt(bar);
  const len = Math.min(2.25, FINAL - t + 0.3);
  const amp = t < 3 ? 0.8 : t < 11 ? 0.8 : t < 20 ? 1.0 : 1.25;
  strings(t, len, t >= 11 ? [...c.chord, c.hi[2]] : c.chord, amp);
}

// Bass from 7s
for (let bar = 3; bar < 12; bar++) {
  const t = bar * 2;
  const c = chordAt(bar);
  for (let q = 0; q < 4; q++) {
    const tt = t + q * 0.5;
    if (tt < 7 || tt >= FINAL - 0.05) continue;
    bass(tt, 0.46, c.root, q === 0 ? 1 : 0.75);
  }
}

// Percussion: stomp on 1 & 3 (every second), clap on 2 & 4, from 3s
for (let t = 3; t < FINAL - 0.01; t += 1.0) {
  stomp(t, HITS.includes(t) ? 1.15 : 0.9);
  if (t >= 11) stomp(t + 0.75, 0.45); // pickup ghost stomp in the full section
  clap(t + 0.5, t < 11 ? 0.8 : 1.0);
}
// Shaker 8ths in the full section
for (let t = 11; t < FINAL - 0.01; t += 0.25) {
  const pos = Math.round((t - 11) / 0.25);
  shaker(t, pos % 2 ? 1.0 : 0.55, pos % 2 ? 0.3 : -0.3);
}

// Transitional swells + hits
[7, 11, 16, 20].forEach((t) => swell(t, 0.9, t === 20 ? 1.6 : 1));
boom(3, 0.55);
boom(11, 0.7);
boom(20, 0.9);
swell(FINAL, 1.0, 1.4);

// Final hit and resolution over the end card
stomp(FINAL, 1.3);
clap(FINAL, 1.0);
boom(FINAL, 1.2);
[57, 60, 64, 69, 72, 76].forEach((m, i) => piano(FINAL + i * 0.02, m, 0.9, 4.0, (i - 2.5) * 0.15));
strings(FINAL, DUR - FINAL, [45 + 12, 60, 64, 69], 1.0);
piano(FINAL + 1.5, 81, 0.5, 2.5, 0.3);
piano(FINAL + 2.0, 79, 0.45, 2.5, -0.3);
piano(FINAL + 2.5, 76, 0.5, 1.8, 0.2);

// ---------- Reverb (Schroeder: 4 combs + 2 allpasses per side) ----------
function reverb(inp, offs) {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.floor((d + offs) * (SR / 44100)));
  combs.forEach((d) => {
    const buf = new Float32Array(d);
    let idx = 0,
      lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.7 + lp * 0.3;
      buf[idx] = inp[i] + lp * 0.84;
      out[i] += y * 0.25;
      idx = (idx + 1) % d;
    }
  });
  [225, 556].forEach((d0) => {
    const d = Math.floor(d0 * (SR / 44100));
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const x = out[i];
      const y = -x + b;
      buf[idx] = x + b * 0.5;
      out[i] = y;
      idx = (idx + 1) % d;
    }
  });
  return out;
}
const rvL = reverb(sendL, 0);
const rvR = reverb(sendR, 23);
for (let i = 0; i < N; i++) {
  L[i] += rvL[i] * 0.32;
  R[i] += rvR[i] * 0.32;
}

// ---------- Master: fade in/out, soft clip, normalize ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fin = Math.min(1, t / 0.15);
  const fout = Math.min(1, Math.max(0, (DUR - t) / 2.2));
  L[i] = Math.tanh(L[i] * 1.2 * fin * fout);
  R[i] = Math.tanh(R[i] * 1.2 * fin * fout);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
const out = path.join(__dirname, "..", "assets", "score.wav");
fs.writeFileSync(out, buf);
console.log("wrote", out, DUR + "s");
