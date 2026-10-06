"""Synthesize the original festive score for the NPAV Navratri reel.

Deterministic (seeded) numpy synthesis: dhol groove, dandiya clicks, manjira,
tanpura-style drone, plucked melody, node chimes, risers, whooshes and impacts
placed on the composition's scene timings. Writes assets/audio/score.wav.
"""

import os
import wave

import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(9)

L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl = gain * np.sqrt(0.5 * (1 - pan))
    gr = gain * np.sqrt(0.5 * (1 + pan))
    L[i : i + len(sig)] += sig * gl
    R[i : i + len(sig)] += sig * gr


def tt(d):
    return np.arange(int(d * SR)) / SR


def bandnoise(d, lo, hi, seed):
    n = int(d * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.max(np.abs(y)) + 1e-9)


# ---------------- instruments ----------------
def dhol_low():
    t = tt(0.45)
    f = 55 + 85 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7)
    click = bandnoise(0.45, 80, 900, 1) * np.exp(-t * 60) * 0.35
    return np.tanh((body + click) * 1.6)


def dhol_high(seed=2):
    t = tt(0.22)
    tone = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 30) * 0.5
    slap = bandnoise(0.22, 1200, 5200, seed) * np.exp(-t * 45)
    return tone + slap * 0.8


def dandiya_click(seed=3):
    t = tt(0.09)
    res = np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 90)
    n = bandnoise(0.09, 1500, 7000, seed) * np.exp(-t * 140)
    return (res * 0.6 + n * 0.7) * 0.8


def manjira(seed=4):
    t = tt(0.9)
    s = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([3120, 4410, 5980, 7230]))
    return s / 4 * np.exp(-t * 5) * 0.5 + bandnoise(0.9, 6000, 12000, seed) * np.exp(-t * 18) * 0.15


def bell(freq, d=1.6, bright=1.0):
    t = tt(d)
    partials = [(1, 1.0, 2.2), (2.76, 0.45 * bright, 3.5), (5.4, 0.25 * bright, 6), (8.93, 0.12 * bright, 9)]
    s = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * dec) for m, a, dec in partials)
    return s * 0.5


def pluck(freq, d=0.6, seed=5):
    n = int(d * SR)
    p = max(2, int(SR / freq))
    buf = np.random.default_rng(seed).uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    # sitar-ish buzz
    return np.tanh(out * 2.2) * 0.5


def whoosh(d, lo=300, hi=6000, seed=6, rise=True):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = np.random.default_rng(seed).standard_normal(n)
    # sweeping band via block FFT filtering
    out = np.zeros(n)
    blk = 2048
    for b in range(0, n, blk // 2):
        seg = x[b : b + blk]
        if len(seg) < 16:
            break
        w = np.hanning(len(seg))
        prog = b / n
        c = lo * (hi / lo) ** (prog if rise else 1 - prog)
        S = np.fft.rfft(seg * w)
        f = np.fft.rfftfreq(len(seg), 1 / SR)
        S *= np.exp(-((np.log((f + 1) / c)) ** 2) / 0.35)
        out[b : b + len(seg)] += np.fft.irfft(S, len(seg))
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    if rise:
        env = (t / d) ** 2.2
    out = out / (np.max(np.abs(out)) + 1e-9)
    return out * env


def impact(d=2.2, seed=7):
    t = tt(d)
    f = 38 + 70 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = bandnoise(d, 200, 9000, seed) * np.exp(-t * 14)
    return np.tanh((sub * 1.2 + crack * 0.6) * 1.4)


def shimmer(d=1.8, base=880, seed=8):
    t = tt(d)
    r = np.random.default_rng(seed)
    s = np.zeros(len(t))
    for k in range(14):
        f = base * (2 ** (r.integers(0, 24) / 12))
        st = r.uniform(0, d * 0.4)
        e = np.clip(t - st, 0, None)
        s += np.sin(2 * np.pi * f * t) * np.exp(-e * 3) * (t > st)
    return s / 10


# Bhairav-ish scale on D
SCALE = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 277.18, 293.66, 311.13, 369.99, 392.0, 440.0]

# ---------------- drone (whole piece, ducks in the dark scene) ----------------
t = np.arange(N) / SR
drone = np.zeros(N)
for f, a in [(73.42, 0.5), (110.0, 0.3), (146.83, 0.25), (220.0, 0.12), (293.66, 0.06)]:
    drone += a * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.21 * t)) * (0.8 + 0.2 * np.sin(2 * np.pi * (0.33 + f / 1000) * t))
denv = np.interp(t, [0, 0.6, 9.8, 10.2, 13.6, 14.0, 19.5, 19.65, 20], [0, 0.5, 0.5, 0.75, 0.9, 0.5, 0.55, 0, 0])
L += drone * denv * 0.22
R += drone * denv * 0.22

# ---------------- groove ----------------
BPM = 126
STEP = 60 / BPM / 4
KICK = {0, 3, 6, 8, 11, 14}
SLAP = {4, 12}
GHOST = {2, 10, 15}
CLICK = {2, 6, 10, 14, 7}


def groove_gain(tm):
    if tm < 0.15:
        return 0.0
    if tm < 3.0:
        return 0.8
    if tm < 6.0:
        return 0.9
    if tm < 9.75:
        return 0.85
    if tm < 14.0:
        return 0.0
    if tm < 15.45:
        return 0.55
    if tm < 17.0:
        return 0.85
    if tm < 19.6:
        return 1.0
    return 0.0


dl, dh, mj = dhol_low(), dhol_high(), manjira()
step = 0
tm = 0.0
while tm < 19.6:
    g = groove_gain(tm)
    s = step % 16
    half = 14.0 <= tm < 15.45
    if g > 0:
        if s in KICK and (not half or s in (0, 8)):
            add(dl, tm, 0.9 * g)
        if s in SLAP:
            add(dh, tm, 0.55 * g, pan=0.15)
        if s in GHOST and not half:
            add(dhol_high(seed=20 + step % 7), tm, 0.18 * g, pan=-0.2)
        if s in CLICK and not half:
            add(dandiya_click(seed=30 + step % 5), tm, 0.35 * g, pan=-0.45 if s % 4 else 0.45)
        if s in (4, 12) and tm > 3.0:
            add(mj, tm, 0.22 * g, pan=0.35)
        if tm >= 17.0 and s in (4, 12):  # claps in the finale
            add(bandnoise(0.15, 900, 4000, 40 + step % 3) * np.exp(-tt(0.15) * 30), tm, 0.45, pan=-0.1)
    step += 1
    tm += STEP

# ---------------- melody (plucked) ----------------
MEL = [7, 8, 9, 8, 7, 5, 4, 5, 7, 9, 10, 9, 8, 7, 5, 4]
for k in range(64):
    tm = k * STEP * 2
    if tm >= 19.4 or 9.75 <= tm < 15.45 or tm < 0.3:
        continue
    note = SCALE[MEL[k % len(MEL)]]
    add(pluck(note, 0.5, seed=50 + k), tm, 0.32 if tm < 17 else 0.42, pan=0.3 * np.sin(k))

# ---------------- scene hits ----------------
# S1 → S2 transition
add(whoosh(0.9, seed=60), 2.15, 0.35)
add(impact(1.6, seed=61), 2.98, 0.45)
# nine node chimes, ascending
for i in range(9):
    add(bell(SCALE[min(i + 3, 11)] * 2, 1.4), 3.25 + i * 0.17, 0.28, pan=-0.6 + i * 0.15)
add(shimmer(2.0, 880, 62), 4.82, 0.55)
add(bell(587.33, 2.4, 1.3), 4.85, 0.35)
add(whoosh(0.7, seed=63), 5.2, 0.35)
add(impact(1.8, seed=64), 5.88, 0.6)
# cards
add(whoosh(0.55, 400, 5000, 65, rise=False), 6.55, 0.4, pan=-0.7)
add(whoosh(0.55, 400, 5000, 66, rise=False), 6.6, 0.4, pan=0.7)
add(shimmer(1.0, 1320, 67), 7.55, 0.35, pan=-0.5)
add(shimmer(1.0, 1480, 68), 8.05, 0.35, pan=0.5)
add(shimmer(1.4, 1760, 69), 8.65, 0.45)
add(whoosh(0.6, seed=70), 9.2, 0.4)
add(impact(2.0, seed=71), 9.82, 0.6)
# dark gift scene: heartbeat sub pulses + halo chimes + riser
for k, tm in enumerate(np.arange(10.4, 13.6, 0.95)):
    hb = np.sin(2 * np.pi * 52 * tt(0.4)) * np.exp(-tt(0.4) * 9)
    add(hb, tm, 0.7)
    add(hb, tm + 0.22, 0.45)
for i in range(9):
    add(bell(SCALE[(i * 2) % 12] * 2, 1.2, 0.7), 10.95 + i * 0.19, 0.16, pan=-0.5 + i * 0.12)
add(shimmer(1.2, 1100, 72), 11.75, 0.3)
add(whoosh(1.2, 200, 9000, 73), 12.75, 0.6)
add(impact(2.4, seed=74), 13.95, 0.85)
# watch reveal
add(shimmer(1.8, 1320, 75), 15.45, 0.55)
add(bell(880, 2.0, 1.2), 15.5, 0.3)
add(whoosh(0.6, seed=76), 16.3, 0.4)
add(impact(1.6, seed=77), 16.95, 0.55)
# finale
add(whoosh(0.5, seed=78), 17.5, 0.35)
add(shimmer(1.2, 1320, 79), 18.0, 0.4)
add(impact(1.2, seed=80), 19.18, 0.9)
add(shimmer(1.0, 1760, 81), 19.18, 0.45)

# ---------------- reverb ----------------
def reverb(x, seed):
    d = 1.5
    n = int(d * SR)
    ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.arange(n) / SR * 4.2)
    ir[0] = 0
    m = len(x) + n
    nfft = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))


wl, wr = reverb(L, 90), reverb(R, 91)
L = L + 0.22 * wl
R = R + 0.22 * wr

# hard stop at the cut to black, then let a short tail breathe out
cut = int(19.6 * SR)
tail = np.exp(-np.arange(N - cut) / SR * 5)
L[cut:] *= tail
R[cut:] *= tail
fade = int(0.02 * SR)
L[:fade] *= np.linspace(0, 1, fade)
R[:fade] *= np.linspace(0, 1, fade)

mix = np.stack([L, R], 1)
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.25)
mix = mix / np.max(np.abs(mix)) * 0.66

out = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "score.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", os.path.abspath(out))
