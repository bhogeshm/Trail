"""Synthesize the score + sound design for the portfolio film.

Deterministic (seeded) numpy synthesis, 120 BPM grid. Writes assets/audio/score.wav.
Music is ducked under the voice-over windows listed in VO.
Run: python3 scripts/score.py
"""
import numpy as np
import soundfile as sf
from pathlib import Path

SR = 48000
DUR = 40.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = Path(__file__).resolve().parent.parent / "assets" / "audio"

# VO placement (start, length) — must match index.html
VO = [(1.2, 2.64), (4.5, 1.98), (8.6, 2.01), (12.6, 2.0), (16.5, 2.66),
      (21.3, 2.39), (26.2, 3.31), (31.6, 2.15), (35.2, 2.74)]

mus = np.zeros((N, 2))   # music bed (ducked)
sfx = np.zeros((N, 2))   # sound design (not ducked)


def t_(d):
    return np.arange(int(SR * d)) / SR


def add(buf, at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    j = min(N, i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env(n, a=0.005, rel=None):
    e = np.ones(n)
    na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if rel:
        nr = min(n, int(rel * SR)); e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def lp(x, cutoff):
    """One-pole low-pass; cutoff may be scalar or per-sample array."""
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)):
        s += a[k] * (x[k] - s); y[k] = s
    return y


def hp(x, cutoff):
    return x - lp(x, cutoff)


def noise(d):
    return rng.standard_normal(int(SR * d))


# ---------- instruments ----------
def kick(d=0.5, f0=120, f1=42, g=1.0):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * g


def sub_impact(d=3.0):
    t = t_(d)
    f = 30 + 60 * np.exp(-t * 4)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crack = hp(noise(d), 800) * np.exp(-t * 9) * 0.5
    return body + crack


def tail(d=4.5, bright=2500):
    t = t_(d)
    n = lp(noise(d), bright) * np.exp(-t * 1.1)
    return np.stack([n, np.roll(lp(noise(d), bright) * np.exp(-t * 1.1), 0)], 1) * 0.35


def click(g=1.0, f=3200):
    t = t_(0.03)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 400) + hp(noise(0.03), 3000) * np.exp(-t * 300) * 0.4) * g


def tick(g=1.0):
    t = t_(0.02)
    return np.sin(2 * np.pi * 5200 * t) * np.exp(-t * 600) * g


def whoosh(d=0.6, f0=300, f1=4000, rev=False):
    t = t_(d)
    sweep = f0 * (f1 / f0) ** (t / d)
    n = lp(noise(d), sweep)
    e = np.sin(np.pi * t / d) ** 2
    s = n * e
    return s[::-1] if rev else s


def riser(d=1.0, f0=200, f1=6000):
    t = t_(d)
    sweep = f0 * (f1 / f0) ** (t / d) ** 2
    s = lp(noise(d), sweep) * (t / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(80 + 400 * (t / d) ** 2) / SR) * (t / d) ** 2 * 0.3
    return s + tone


def metal_hit(d=1.6):
    t = t_(d)
    parts = [(220, 1.0), (347, 0.7), (512, 0.55), (771, 0.4), (1130, 0.3), (1597, 0.2)]
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (2 + f / 400)) for f, a in parts)
    return s * 0.5 + kick(d, 90, 38) * 0.9


def pen_stroke(d=0.5):
    t = t_(d)
    return hp(lp(noise(d), 6000), 1500) * np.sin(np.pi * t / d) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))


def blip(f=880, d=0.12):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 30)


def heartbeat():
    return np.concatenate([kick(0.18, 70, 40), np.zeros(int(0.06 * SR)), kick(0.25, 60, 35) * 0.7])


def shutter():
    t = t_(0.09)
    a = hp(noise(0.09), 2500) * np.exp(-t * 60)
    b = np.zeros(int(0.04 * SR))
    return np.concatenate([a[: len(a) // 2], b, a[: len(a) // 2] * 0.7])


def hat(g=1.0):
    t = t_(0.05)
    return hp(noise(0.05), 7000) * np.exp(-t * 90) * g


def pad(freqs, d, g=1.0, bright=1200):
    t = t_(d)
    s = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            s += sum(np.sin(2 * np.pi * ff * h * t) / h for h in (1, 2, 3, 4))
    s = lp(s, bright)
    return s / len(freqs) * g


# ---------- arrangement ----------
# 0-4 THE IDEA
add(sfx, 0.0, lp(noise(3.6), 90) * env(int(3.6 * SR), 1.2, 1.5) * 3.0)          # sub rumble
add(sfx, 0.0, np.sin(2 * np.pi * 38 * t_(3.8)) * env(int(3.8 * SR), 1.5, 1.8), 0.5)
add(sfx, 0.9, hp(noise(0.12), 4000) * np.exp(-t_(0.12) * 40) * 0.25)              # digital flicker
add(sfx, 1.0, blip(1760, 0.2), 0.12)                                               # dot pulse
add(sfx, 2.2, tick(), 0.5); add(sfx, 2.7, tick(), 0.5)                              # cursor ticks
add(sfx, 3.5, click(), 0.55)                                                       # mouse click

# 4-8 ANIMATE
add(sfx, 4.0, pen_stroke(0.55), 0.35, -0.3)
add(sfx, 5.0, whoosh(0.45, 400, 5000), 0.4, 0.3)
add(sfx, 6.0, click(), 0.45)
add(sfx, 7.0, kick(0.6, 90, 40), 0.7)
for b in np.arange(4.0, 8.0, 1.0):
    add(mus, b, kick(0.4, 110, 45), 0.55)

# 8-12 DESIGN ECOSYSTEM
for k, at in enumerate((8.0, 9.0, 10.0, 11.0)):
    add(sfx, at, click(f=2600 + k * 300), 0.5, [-0.4, -0.1, 0.1, 0.4][k])
add(sfx, 9.4, whoosh(0.35, 800, 6000) * 0.6, 0.35)                                  # layer shuffle
add(sfx, 10.4, hp(lp(noise(0.5), 3000), 400) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t_(0.5))), 0.18)  # scrub
add(sfx, 11.5, kick(0.6, 70, 35), 0.8)
for b in np.arange(8.0, 12.0, 1.0):
    add(mus, b, kick(0.4, 110, 45), 0.6)
    add(mus, b + 0.5, hat(), 0.12)

# 12-16 3D / CGI
add(sfx, 11.0, riser(1.0), 0.35)
add(sfx, 12.0, metal_hit(), 0.6)
add(sfx, 13.0, whoosh(0.9, 80, 1200), 0.8)
add(sfx, 13.0, kick(1.2, 60, 28), 0.7)
add(sfx, 12.0, tail(2.0, 1800), 0.5)
add(sfx, 15.0, riser(1.0, 300, 8000), 0.45)
for b in np.arange(12.0, 16.0, 0.5):
    add(mus, b, kick(0.35, 120, 45), 0.6 if (b * 2) % 2 == 0 else 0.35)
    add(mus, b + 0.25, hat(), 0.14)

# 16-21 AI ECOSYSTEM — 0.3s silence, heartbeat, pulses
add(sfx, 16.3, heartbeat(), 0.8); add(sfx, 17.1, heartbeat(), 0.6)
nodes_t = [17.6 + i * 0.33 for i in range(9)]
for i, at in enumerate(nodes_t):
    add(sfx, at, blip(660 * 2 ** ((i % 5) / 6), 0.1), 0.22, (-0.6 + i * 0.15))
    add(sfx, at, tick(), 0.25)
add(sfx, 20.6, riser(0.4, 500, 9000), 0.4)
for b in np.arange(18.5, 21.0, 0.5):
    add(mus, b, kick(0.3, 100, 45), 0.35)

# 21-25.5 PORTFOLIO PAYOFF — densest
add(sfx, 21.0, sub_impact(1.8), 0.9); add(sfx, 21.0, tail(1.5), 0.6)
cuts = [21.0, 21.5, 21.75, 22.0, 22.25, 22.5, 23.5, 23.75, 24.0, 24.25, 24.5, 24.75, 25.0]
for k, at in enumerate(cuts):
    add(sfx, at, shutter(), 0.3, (-1) ** k * 0.4)
for b in np.arange(21.0, 25.5, 0.5):
    add(mus, b, kick(0.35, 130, 45), 0.8)
    add(mus, b + 0.25, hat(), 0.2)
    add(mus, b + 0.375, hat(), 0.1)
for at in (22.5, 23.5):
    add(sfx, at, whoosh(0.3, 600, 7000), 0.35)
add(sfx, 25.0, riser(0.5, 400, 7000), 0.4)

# 25.5-30.5 PROOF — confident groove, counters
add(sfx, 25.5, kick(0.8, 80, 32), 0.9); add(sfx, 25.5, whoosh(0.6, 200, 3000), 0.45)
add(sfx, 27.5, whoosh(0.5, 300, 4000), 0.35, 0.3)
for k in range(24):
    add(sfx, 26.0 + k * 0.05, tick(), 0.08)   # counter roll
for k in range(20):
    add(sfx, 28.0 + k * 0.05, tick(), 0.07)
for b in np.arange(25.5, 30.5, 0.5):
    add(mus, b, kick(0.35, 115, 45), 0.6 if (b * 2) % 2 == 1 else 0.4)
    add(mus, b + 0.25, hat(), 0.12)
add(sfx, 29.7, riser(0.8, 300, 9000), 0.3)

# music pad / bass bed 4.0 -> 30.5 (hard cut)
chords = [(4.0, [73.4, 110, 146.8]), (8.0, [58.3, 87.3, 116.5]), (12.0, [65.4, 98, 130.8]),
          (16.3, [55, 82.4, 110]), (21.0, [73.4, 110, 146.8, 220]), (25.5, [58.3, 87.3, 116.5, 174.6])]
ends = [c[0] for c in chords[1:]] + [30.5]
for (st, fr), en in zip(chords, ends):
    d = en - st
    g = 0.22 + 0.05 * chords.index((st, fr))
    p = pad(fr, d + 0.05, g, 900 + 250 * chords.index((st, fr)))
    if st != 16.3:
        p *= env(len(p), 0.08)
    else:
        p *= env(len(p), 1.2)
    add(mus, st, np.stack([p, np.roll(p, 240)], 1))
# bass pulse on beats from 8 to 30.5
for b in np.arange(8.0, 30.5, 0.5):
    if 16.0 <= b < 18.5:
        continue
    root = [c for c in chords if c[0] <= b][-1][1][0] / 2
    tb = t_(0.45)
    add(mus, b, np.sin(2 * np.pi * root * tb) * np.exp(-tb * 5), 0.35)
# hard stop at 30.5 and 16.0-16.3 drop
mus[int(16.0 * SR): int(16.3 * SR)] = 0
mus[int(30.5 * SR):] = 0

# 30.5-34.5 HUMAN REVEAL — room tone + breath + swell
add(sfx, 30.5, lp(noise(4.0), 400) * 0.05)
add(sfx, 31.0, lp(hp(noise(0.7), 300), 2500) * np.sin(np.pi * t_(0.7) / 0.7) ** 2, 0.04)  # breath
sw = pad([146.8, 220, 293.7], 2.0, 0.25, 1500) * np.linspace(0, 1, int(2.0 * SR)) ** 2
add(sfx, 32.5, sw)

# 34.5-40 SIGNATURE
add(sfx, 34.5, sub_impact(4.0), 1.0)
add(sfx, 34.5, tail(5.0, 1500), 0.9)
add(sfx, 34.5, pad([73.4, 110, 146.8, 220], 5.5, 0.18, 1200) * env(int(5.5 * SR), 0.01, 4.0))
add(sfx, 38.6, click(f=2200), 0.5)

# ---------- ducking ----------
duck = np.ones(N)
for st, ln in VO:
    a, b = int((st - 0.1) * SR), int((st + ln + 0.15) * SR)
    duck[a:b] = 0.32
duck = lp(duck, 6.0)
mus *= duck[:, None]
sfx *= (0.5 + 0.5 * duck)[:, None] ** 1.6   # milder duck on sound design

mix = mus + sfx
mix = np.tanh(mix * 0.9) * 0.9
mix /= np.max(np.abs(mix)) / 0.85
fo = int(0.4 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
OUT.mkdir(parents=True, exist_ok=True)
sf.write(OUT / "score.wav", mix.astype(np.float32), SR)
print("wrote", OUT / "score.wav", round(len(mix) / SR, 2), "s")
