// Tiny synth library for original, royalty-free soundtracks. Everything is generated
// sample by sample: no sample files, no licensing questions.
//
//   import * as S from './synth.mjs';
//   S.init(durationSeconds);                 // before anything else
//   S.pluck(t, midi); S.boing(t); ...          // place sounds at times in seconds
//   S.writeMix('out/audio.wav');              // mixes, normalizes, writes 48 kHz stereo WAV
//
// Music instruments write to the `mus` bus, sound effects to `sfx`.
import fs from 'node:fs';

export const SR = 48000;
export const TAU = Math.PI * 2;
export let N = 0, DUR = 0, mus, sfx;

let seed = 12345;
export const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
export const noise = () => rnd() * 2 - 1;
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

export function init(duration, s = 12345) {
  DUR = duration; N = Math.round(SR * duration); seed = s;
  mus = [new Float32Array(N), new Float32Array(N)];
  sfx = [new Float32Array(N), new Float32Array(N)];
}

// beat grid: beat(b) = offset + b * 60/bpm
export const grid = (bpm, offset = 0) => (b) => offset + (b * 60) / bpm;
export const CHORDS = {
  C: [48, 60, 64, 67, 72], Am: [45, 57, 60, 64, 69], F: [41, 57, 60, 65, 69], G: [43, 55, 59, 62, 67],
  E: [40, 56, 59, 64, 68], Dm: [38, 57, 62, 65, 69], Em: [40, 55, 59, 64, 67], Bb: [46, 58, 62, 65, 70],
  D: [38, 54, 57, 62, 66], A: [45, 57, 61, 64, 69],
};

// write fn(i, t) into a bus with equal-power pan (-1..1)
export function put(bus, t0, dur, gain, pan, fn) {
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i, i / SR);
    bus[0][k] += v * gl; bus[1][k] += v * gr;
  }
}

// RBJ biquad ('lp' | 'hp' | 'bp')
export function biquad(type, f, q = 0.707) {
  const w = TAU * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
// band-pass whose centre moves without resetting its state (no zipper noise)
export function sweepBP(q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f) => {
    const w = TAU * f / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q), a0 = 1 + a;
    const y = (a * x - a * x2 + 2 * c * y1 - (1 - a) * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

// ---------------------------------------------------------------- instruments
export function pluck(t0, midi, gain = 0.3, pan = 0, decay = 0.996, bright = 0.5, dur = 1.6) { // Karplus-Strong ukulele
  const f = mtof(midi), L = Math.max(2, Math.round(SR / f)), buf = new Float32Array(L);
  for (let i = 0; i < L; i++) buf[i] = noise();
  let idx = 0;
  const lp = biquad('lp', 2000 + bright * 5000);
  put(mus, t0, dur, gain, pan, (i, t) => {
    const cur = buf[idx];
    buf[idx] = decay * 0.5 * (cur + buf[(idx + 1) % L]);
    idx = (idx + 1) % L;
    return lp(cur) * (t > dur - 0.05 ? (dur - t) / 0.05 : 1);
  });
}
export function strum(t0, midis, gain = 0.16, pan = 0, spread = 0.018) {
  midis.forEach((m, k) => pluck(t0 + k * spread, m, gain, pan + (k - 1.5) * 0.12, 0.994, 0.45, 1.2));
}
export function bell(t0, midi, gain = 0.2, pan = 0, dur = 1.4, bus = mus) { // FM bell
  const fc = mtof(midi), fm = fc * 3.5;
  put(bus, t0, dur, gain, pan, (i, t) => Math.sin(TAU * fc * t + 2.2 * Math.exp(-t / 0.25) * Math.sin(TAU * fm * t)) * env(t, 0.003, dur * 0.35));
}
export function marimba(t0, midi, gain = 0.22, pan = 0) {
  const f = mtof(midi);
  put(mus, t0, 0.6, gain, pan, (i, t) => Math.sin(TAU * f * t) * env(t, 0.002, 0.16) + 0.35 * Math.sin(TAU * f * 4 * t) * env(t, 0.001, 0.03));
}
export function pad(t0, midis, dur = 2, gain = 0.05, pan = 0) { // soft sustained chord
  put(mus, t0, dur, gain, pan, (i, t) => {
    const e = Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.5);
    return midis.reduce((s, m) => s + Math.sin(TAU * mtof(m) * t) + 0.3 * Math.sin(TAU * mtof(m) * 2.003 * t), 0) * e / midis.length;
  });
}
export function bass(t0, midi, dur = 0.35, gain = 0.34) {
  const f = mtof(midi), lp = biquad('lp', 600);
  put(mus, t0, dur, gain, 0, (i, t) => {
    const ph = (f * t) % 1, tri = 4 * Math.abs(ph - 0.5) - 1;
    const e = env(t, 0.004, dur * 0.6) * (t > dur - 0.03 ? (dur - t) / 0.03 : 1);
    return lp(Math.tanh(1.6 * (0.7 * tri + 0.5 * Math.sin(TAU * f * t)))) * e;
  });
}
export function kick(t0, gain = 0.55) { // pitch drops 160 -> 50 Hz
  put(mus, t0, 0.35, gain, 0, (i, t) => Math.sin(TAU * (50 * t + 110 * 0.035 * (1 - Math.exp(-t / 0.035)))) * env(t, 0.001, 0.12));
}
export function snare(t0, gain = 0.3) {
  const hp = biquad('hp', 1200);
  put(mus, t0, 0.25, gain, 0.05, (i, t) => 0.8 * hp(noise()) * env(t, 0.001, 0.07) + 0.4 * Math.sin(TAU * 190 * t) * env(t, 0.001, 0.04));
}
export function hat(t0, gain = 0.08, pan = 0.3) {
  const hp = biquad('hp', 7000);
  put(mus, t0, 0.06, gain, pan, (i, t) => hp(noise()) * env(t, 0.0005, 0.015));
}
export function clap(t0, gain = 0.2) {
  const bp = biquad('bp', 1500, 0.8);
  put(mus, t0, 0.2, gain, -0.1, (i, t) => {
    const burst = (t < 0.01 || (t > 0.012 && t < 0.02) || (t > 0.024 && t < 0.034)) ? 1 : Math.exp(-(t - 0.034) / 0.05);
    return bp(noise()) * burst * 2;
  });
}
export function crash(t0, gain = 0.14) {
  const hp = biquad('hp', 4500);
  put(mus, t0, 1.6, gain, 0.2, (i, t) => hp(noise()) * env(t, 0.002, 0.5));
}

// ---------------------------------------------------------------- sound effects
export function click(t0, gain = 0.1) { // keyboard key
  const bp = biquad('bp', 2600 + rnd() * 1400, 1.2), tone = 1300 + rnd() * 500;
  put(sfx, t0, 0.04, gain, 0.25 + rnd() * 0.2, (i, t) => (bp(noise()) * 2.2 + 0.25 * Math.sin(TAU * tone * t)) * env(t, 0.0004, 0.008));
}
export function pop(t0, gain = 0.12, f0 = 500) { // bubbly pop
  put(sfx, t0, 0.09, gain, rnd() * 1.2 - 0.3, (i, t) => Math.sin(TAU * (f0 + 1100 * (t / 0.09)) * t) * env(t, 0.002, 0.025));
}
export function boing(t0, gain = 0.2, f0 = 180, f1 = 520, dur = 0.45, pan = 0) { // hop / spring
  let ph = 0;
  put(sfx, t0, dur, gain, pan, (i, t) => {
    const f = f0 + (f1 - f0) * Math.min(1, t / (dur * 0.5)) + 40 * Math.sin(TAU * 26 * t) * Math.exp(-t / 0.2);
    ph += TAU * f / SR;
    return (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * env(t, 0.005, dur * 0.35);
  });
}
export function slide(t0, f0, f1, dur, gain = 0.1, pan = 0) { // slide whistle (up or down)
  let ph = 0;
  put(sfx, t0, dur, gain, pan, (i, t) => {
    const f = f0 * Math.pow(f1 / f0, t / dur) * (1 + 0.012 * Math.sin(TAU * 7 * t));
    ph += TAU * f / SR;
    return Math.sin(ph) * Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.06);
  });
}
export function whoosh(t0, dur = 0.35, gain = 0.2, fA = 400, fB = 2400, pan = 0) {
  const bp = sweepBP(1.4);
  put(sfx, t0, dur, gain, pan, (i, t) => { const u = t / dur; return bp(noise(), fA + (fB - fA) * Math.sin(Math.PI * u * 0.5)) * Math.sin(Math.PI * u) * 1.6; });
}
export function thud(t0, gain = 0.4, size = 1) { // landing / impact
  const lp = biquad('lp', 400);
  put(sfx, t0, 0.35, gain, 0, (i, t) => Math.sin(TAU * (45 * t + 70 * size * 0.04 * (1 - Math.exp(-t / 0.04)))) * env(t, 0.001, 0.09) + 0.6 * lp(noise()) * env(t, 0.001, 0.03));
}
export function tick(t0, gain = 0.08, f = 3000, pan = 0) { // blinks, tiny taps
  put(sfx, t0, 0.03, gain, pan, (i, t) => Math.sin(TAU * f * t) * env(t, 0.0005, 0.006));
}
export function glitch(t0, dur = 0.22, gain = 0.12) { // digital error
  let f = 200;
  put(sfx, t0, dur, gain, 0, (i, t) => {
    if (i % 900 === 0) f = 80 + rnd() * 900;
    return Math.round((Math.sin(TAU * f * t) > 0 ? 1 : -1) * 4) / 4 * (0.6 + 0.4 * noise()) * (1 - t / dur);
  });
}
export function footstep(t0, gain = 0.14, pan = 0) {
  const bp = biquad('bp', 380 + rnd() * 120, 1.5);
  put(sfx, t0, 0.08, gain, pan, (i, t) => bp(noise()) * 3 * env(t, 0.001, 0.02) + 0.3 * Math.sin(TAU * 140 * t) * env(t, 0.001, 0.02));
}
export function skid(t0, dur = 0.2, gain = 0.12) {
  const bp = sweepBP(3);
  put(sfx, t0, dur, gain, -0.2, (i, t) => bp(noise(), 2200 - 1400 * (t / dur)) * 2.5 * (1 - t / dur));
}
export function rustle(t0, dur = 0.4, gain = 0.1, pan = 0) { // leaves, grass, cloth
  const bp = biquad('bp', 3000, 0.7);
  put(sfx, t0, dur, gain, pan, (i, t) => bp(noise()) * (0.5 + 0.5 * Math.sin(TAU * 18 * t + noise() * 0.3)) * Math.sin(Math.PI * t / dur) * 2);
}
export function sniff(t0, gain = 0.08) {
  const bp = biquad('bp', 4200, 1.5);
  put(sfx, t0, 0.07, gain, 0.2, (i, t) => bp(noise()) * Math.sin(Math.PI * t / 0.07) * 3);
}
export function clink(t0, gain = 0.14, pan = -0.5) { // ceramic / glass
  const parts = [[2310, 0.25], [3470, 0.12], [5230, 0.08], [7040, 0.05]];
  put(sfx, t0, 0.6, gain, pan, (i, t) => parts.reduce((s, [f, d]) => s + Math.sin(TAU * f * t) * Math.exp(-t / d), 0) * 0.5);
}
export function knock(t0, gain = 0.3, pan = 0) { // muffled bump
  const lp = biquad('lp', 700);
  put(sfx, t0, 0.18, gain, pan, (i, t) => lp(noise()) * 2 * env(t, 0.001, 0.025) + 0.7 * Math.sin(TAU * 150 * t) * env(t, 0.001, 0.04));
}
export function squeak(t0, gain = 0.08, pan = 0) {
  let ph = 0;
  put(sfx, t0, 0.12, gain, pan, (i, t) => { const f = 1700 + 900 * Math.sin(Math.PI * t / 0.12); ph += TAU * f / SR; return Math.sin(ph) * Math.sin(Math.PI * t / 0.12); });
}
export function sparkle(t0, dur = 1, n = 18, gain = 0.06) { // magic / success glitter
  for (let k = 0; k < n; k++) {
    const t = t0 + rnd() * dur, f = 2600 + rnd() * 4200, p = rnd() * 2 - 1;
    put(sfx, t, 0.25, gain * (1 - ((t - t0) / dur) * 0.6), p, (i, u) => Math.sin(TAU * f * u) * env(u, 0.002, 0.05));
  }
}
export function popper(t0, gain = 0.3) { // confetti cannon
  const hp = biquad('hp', 600);
  put(sfx, t0, 0.12, gain, 0.3, (i, t) => hp(noise()) * env(t, 0.001, 0.02) * 2 + Math.sin(TAU * 120 * t) * env(t, 0.001, 0.03));
  for (let k = 0; k < 40; k++) tick(t0 + 0.03 + rnd() * 0.5, 0.03 + rnd() * 0.03, 2000 + rnd() * 5000, rnd() * 2 - 1);
}
export function bloop(t0, gain = 0.2, pan = 0) { // something pops into existence
  let ph = 0;
  put(sfx, t0, 0.2, gain, pan, (i, t) => { const f = 250 + 1400 * Math.pow(t / 0.2, 0.6); ph += TAU * f / SR; return Math.sin(ph) * env(t, 0.003, 0.06); });
}
export function chime(t0, root = 84, gain = 0.1, pan = 0.2) { // rising 4-note success arpeggio
  [0, 4, 7, 12].forEach((d, k) => bell(t0 + k * 0.08, root + d, gain, pan, 1.2, sfx));
}

// ---------------------------------------------------------------- mixdown
export function writeMix(file, o = {}) {
  const musGain = o.musGain ?? 0.85, fadeOut = o.fadeOut ?? 0.35;
  const out = [new Float32Array(N), new Float32Array(N)];
  let peak = 0;
  for (let c = 0; c < 2; c++) {
    const hp = biquad('hp', 30);
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      out[c][i] = hp(mus[c][i] * musGain + sfx[c][i]) * Math.min(1, t / 0.08) * Math.min(1, (DUR - t) / fadeOut);
      peak = Math.max(peak, Math.abs(out[c][i]));
    }
  }
  const norm = 0.89 / (peak || 1), data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < 2; c++) {
      const v = Math.tanh(out[c][i] * norm * 1.1) / Math.tanh(1.1);
      data.writeInt16LE(Math.round(clamp(v, -1, 1) * 32767), i * 4 + c * 2);
    }
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([hdr, data]));
  return peak;
}
