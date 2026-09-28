// Score for "Diwali Terrace": warm, festive, mostly acoustic-plucked-and-bells.
// Reads out/cues.json (written by render.mjs from STORY.cues()), writes out/audio.wav.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './synth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'cues.json'), 'utf8'));
S.init(cues.DURATION);
const { CHORDS: C } = S;
const bt = S.grid(96, 0); // 96 BPM, one beat = 0.625 s

// ---- music -----------------------------------------------------------
// intro (0-3.4s): still terrace night air, sparse pluck + soft pad, no drums
S.pad(0.1, C.Dm.map((m) => m - 12), 3.4, 0.035);
[[0.4, 62], [1.1, 65], [1.9, 69], [2.6, 62], [3.0, 65]].forEach(([t, m]) => S.pluck(t, m, 0.16, 0.15, 0.985, 0.35, 1.6));

// ember lifts off + rises into the firework (3.4-4.75): a curious upward slide, tremolo bells
S.pad(3.4, C.Bb.map((m) => m - 12), 2.0, 0.04);
S.slide(cues.emberStart, 300, 900, 1.1, 0.09, 0.1);
[[3.7, 74], [4.0, 77], [4.3, 81], [4.55, 84]].forEach(([t, m]) => S.bell(t, m, 0.1, 0.1, 0.8));

// fireworks (4.75-5.7): the hero payoff moment
S.crash(cues.fireworkMain, 0.16);
S.chime(cues.fireworkMain, 81, 0.14, 0.05);
S.sparkle(cues.fireworkMain, 1.1, 22, 0.07);
S.pop(cues.firework2, 0.09, 700, -0.4);
S.sparkle(cues.firework2, 0.6, 10, 0.04, -0.4);
S.pop(cues.firework3, 0.09, 760, 0.4);
S.sparkle(cues.firework3, 0.6, 10, 0.04, 0.4);
S.strum(bt(7.6), C.Bb.slice(1).map((m) => m - 5), 0.1, 0, 0.02);
S.bass(bt(7.6), 34, 1.0, 0.22);

// falling spark toward the lantern (6.15-7.7): descending whoosh + trailing glints
S.whoosh(cues.sparkFall, 1.5, 0.13, 1800, 500, 0.3);
S.sparkle(cues.sparkFall + 0.1, 1.3, 10, 0.035, 0.3);
S.bloop(cues.sparkArrive, 0.12, 0.4);

// terrace groove settles in as she appears (7.3-9.2): warm marimba + soft bass, no drums yet
const groove = ['F', 'Dm', 'Bb', 'C'];
for (let b = 12; b <= 19; b++) {
  const chName = groove[Math.floor((b - 12) / 2) % groove.length];
  const ch = C[chName].map((m) => m - 12);
  if (b % 2 === 0) { S.bass(bt(b), ch[0], 0.5, 0.24); S.pad(bt(b), ch.slice(1, 4).map((m) => m + 12), 1.25, 0.03); }
}
[[12.3, 74], [12.7, 77], [13.1, 81], [13.9, 79], [14.6, 77], [15.4, 74], [16.1, 77]].forEach(([b, m]) => S.marimba(bt(b), m, 0.13, -0.15));

// anticipation as the hand rises (8.6-9.25)
S.slide(8.65, 260, 460, 0.5, 0.06, 0);
// the bite: a small bright pop + a two-note happy chime, then settle
S.pop(cues.bite, 0.14, 900);
S.chime(cues.bite + 0.02, 86, 0.09, 0);
S.sparkle(cues.bite, 0.5, 8, 0.035, 0);
S.slide(10.05, 520, 380, 0.4, 0.05, 0); // content little sigh as she lowers it

// text reveal (12.0-13.3): the warm final cadence, IV-V-I landing on the settle
S.crash(cues.textIn, 0.1);
S.strum(bt(19.2), C.Bb.slice(1).map((m) => m - 5), 0.11, -0.1, 0.03);
S.strum(bt(19.9), C.F.slice(1).map((m) => m - 5), 0.11, 0, 0.03);
S.strum(bt(20.6), C.Bb.slice(1).map((m) => m + 7), 0.12, 0.1, 0.04);
S.bass(bt(19.2), 34, 1.6, 0.24); S.bass(bt(20.6), 41, 2.6, 0.28);
[[19.3, 77], [19.9, 81], [20.6, 84], [21.3, 86]].forEach(([b, m]) => S.bell(bt(b), m, 0.12, 0.15, 2.2));
S.sparkle(13.4, 1.2, 16, 0.045, 0.1); // the little marigold-confetti sparkle
S.pad(12.0, C.Bb.map((m) => m - 12), 3.0, 0.035);

// ---- ambient sound effects on the terrace throughout ----------------
for (const t of cues.blinks) S.tick(t, 0.06, 2600, 0);
S.rustle(0.6, 3.2, 0.025, 0); // faint night breeze under the whole intro

const peak = S.writeMix(path.join(ROOT, 'out', 'audio.wav'));
console.log(`wrote out/audio.wav (${cues.DURATION}s, peak ${peak.toFixed(2)})`);
