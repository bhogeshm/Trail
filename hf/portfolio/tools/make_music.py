"""Synthesise the stomp soundtrack for the portfolio film.

120 BPM (beat = 0.5s, bar = 2s). Every section boundary in the script lands on the
grid, so visuals and audio share the same clock:
  0-3   idea pulse          3-6  sketch -> whoosh      6-9  stomp enters
  9-13  AI experiment+riser 13-17 DROP (AI vibe edit)  17-21 impacts + rise
  21-25 peak montage        25-28 silence -> heartbeat 28-32 name impact
  32-36 end card resolve + click
"""
import wave
import numpy as np

SR = 44100
DUR = 36.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)
BEAT = 0.5


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    s = sig[: N - i] * gain
    L[i : i + len(s)] += s * (1 - max(pan, 0))
    R[i : i + len(s)] += s * (1 + min(pan, 0))


def env(d, a=0.002, decay=8.0):
    t = t_arr(d)
    e = np.exp(-t * decay)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def noise(d):
    return rng.standard_normal(int(SR * d))


# ---------- instruments ----------
def stomp(big=1.0):
    d = 0.45
    t = t_arr(d)
    f = 45 + 110 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, decay=7)
    thud = bandpass(noise(d), 80, 900) * env(d, decay=30) * 0.9
    click = bandpass(noise(d), 2000, 8000) * env(d, decay=120) * 0.25
    return np.tanh((body * 1.2 + thud + click) * 1.6 * big) * 0.85


def clap():
    d = 0.35
    out = np.zeros(int(SR * d))
    base = bandpass(noise(d), 900, 3500)
    for k, off in enumerate([0.0, 0.011, 0.022]):
        i = int(off * SR)
        e = env(d - off, decay=60 if k < 2 else 14)
        out[i:] += base[i:] * e
    return np.tanh(out * 2.2) * 0.95


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    return bandpass(noise(d), 7000, 16000) * env(d, decay=10 if open_ else 70) * 0.35


def sub(freq, d, gain=0.6):
    t = t_arr(d)
    e = np.minimum(1, t / 0.01) * np.exp(-t * 2.2)
    return np.sin(2 * np.pi * freq * t) * e * gain


def saw(freq, t):
    return 2 * ((freq * t) % 1.0) - 1


def stab(freqs, d=0.22, gain=0.22):
    t = t_arr(d)
    s = sum(saw(f, t) + saw(f * 1.006, t) for f in freqs) / (2 * len(freqs))
    return lowpass(s, 3200) * env(d, decay=11) * gain


def pad(freqs, d, gain=0.12, cutoff=1800):
    t = t_arr(d)
    s = sum(saw(f, t) + saw(f * 1.004, t) + saw(f * 0.996, t) for f in freqs)
    s = lowpass(s / (3 * len(freqs)), cutoff)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
    return s * a * gain


def whoosh(d, rise=True, gain=0.5):
    t = t_arr(d)
    n = noise(d)
    out = np.zeros_like(n)
    seg = int(SR * 0.05)
    for i in range(0, len(n), seg):
        p = i / len(n)
        c = 400 + (7000 * p if rise else 7000 * (1 - p))
        out[i : i + seg] = bandpass(n[i : i + seg], c * 0.6, c * 1.6)
    shape = np.sin(np.pi * t / d) ** 2 if not rise else (t / d) ** 2
    return out * shape * gain


def riser(d, gain=0.3):
    t = t_arr(d)
    f = 110 * (2 ** (3 * (t / d) ** 1.6))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (tone * 0.4 + whoosh(d, True, 1.0)) * (t / d) ** 2 * gain


def impact(gain=1.0, tail=2.5):
    d = tail
    t = t_arr(d)
    f = 30 + 90 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crack = bandpass(noise(d), 200, 6000) * np.exp(-t * 14) * 0.6
    return np.tanh((boom * 1.4 + crack) * 1.2) * gain * 0.9


def tick(freq=2400, gain=0.25):
    d = 0.04
    return np.sin(2 * np.pi * freq * t_arr(d)) * env(d, decay=150) * gain


def glitch(d=0.25, gain=0.25):
    t = t_arr(d)
    s = np.sign(np.sin(2 * np.pi * (300 + 900 * ((t * 37) % 1)) * t))
    gate = (np.floor(t * 64) % 2)
    return s * gate * gain * np.exp(-t * 4)


def heartbeat(gain=0.8):
    return sub(52, 0.3, 0.9 * gain) + np.concatenate([np.zeros(int(0.17 * SR)), sub(46, 0.3, 0.6 * gain)])[: int(0.3 * SR)]


def pencil(d):
    n = bandpass(noise(d), 2500, 9000)
    t = t_arr(d)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) * np.sin(2 * np.pi * 3.3 * t)
    return n * am * 0.12


A1, C2, E2, F1, G1 = 55.0, 65.41, 82.41, 43.65, 49.0
AM = [220, 261.63, 329.63]
FM = [174.61, 220, 261.63]
CM = [196, 261.63, 329.63]
GM = [196, 246.94, 293.66]

# ---------- 0-3 idea pulse ----------
place(noise(DUR) * 0.004, 0)  # faint grain bed
for tt in (0.25, 1.25, 2.25):
    place(sub(62, 0.6, 0.35), tt)
    place(tick(3200, 0.08), tt)

# ---------- 3-6 sketch -> footage ----------
place(pencil(2.2), 3.0)
place(tick(1800, 0.2), 3.0)
place(whoosh(0.9, True, 0.45), 5.1)
place(sub(A1, 1.0, 0.5), 3.0)

# ---------- stomp engine ----------
def bar_stomp(t0, level=1.0, hats=0, bass=None, stabs=None, bars=2):
    # classic STOMP STOMP CLAP (rest) on quarter notes
    for k in range(bars):
        pattern = [(0.0, "S"), (0.5, "S"), (1.0, "C"), (1.5, "-")]
        for off, kind in pattern:
            at = t0 + k * 2.0 + off
            if kind == "S":
                place(stomp(level), at, 0.9)
            elif kind == "C":
                place(clap(), at, 0.8 * level, pan=0.05)
        if level >= 1.1:
            place(stomp(0.7), t0 + k * 2.0 + 1.5, 0.7)
            place(stomp(0.6), t0 + k * 2.0 + 1.75, 0.6)
        if hats:
            step = 0.25 if hats == 1 else 0.125
            for j in range(int(2.0 / step)):
                place(hat(open_=(j % 4 == 2 and hats == 1)), t0 + k * 2.0 + j * step, 0.8, pan=-0.2)
        if bass:
            place(sub(bass[k % len(bass)], 1.0, 0.45), t0 + k * 2.0)
            place(sub(bass[k % len(bass)], 0.5, 0.35), t0 + k * 2.0 + 0.5)
        if stabs:
            ch = stabs[k % len(stabs)]
            for off in (0.75, 1.25, 1.75):
                place(stab(ch), t0 + k * 2.0 + off, 1.0, pan=0.25 if off == 1.25 else -0.25)


# 6-9: beat enters (stomp only, sparse) + flashes
bar_stomp(6.0, 0.8, hats=0, bass=[A1], bars=1)
place(stomp(0.8), 8.0)
place(stomp(0.8), 8.5)
place(whoosh(0.5, True, 0.3), 8.5)

# 9-13: AI experiment - stomp + hats + glitches + riser
bar_stomp(9.0, 0.9, hats=1, bass=[A1, F1])
for g in (9.75, 10.5, 11.25, 12.0, 12.5):
    place(glitch(0.2, 0.12), g, pan=0.3)
place(riser(2.0, 0.35), 11.0)
for j in range(8):  # stomp roll into drop
    place(stomp(0.6 + j * 0.05), 12.0 + j * 0.125, 0.6)

# 13-17: THE DROP - highest density
place(impact(1.1, 2.0), 13.0)
bar_stomp(13.0, 1.1, hats=2, bass=[A1, F1], stabs=[AM, FM])
bar_stomp(15.0, 1.1, hats=2, bass=[C2 / 2, G1], stabs=[CM, GM], bars=1)
for x in (13.0, 13.5, 14.0, 15.0, 15.5, 16.0, 16.5):
    place(tick(1400, 0.18), x)
for x in (14.75, 16.75):
    place(glitch(0.25, 0.2), x)

# 17-21: layered impacts -> cinematic rise
for x in (17.0, 18.0, 19.0):
    place(impact(0.75, 1.2), x)
bar_stomp(17.0, 0.9, hats=1, bass=[A1, F1])
place(pad(AM + [440], 4.0, 0.11), 17.0)
place(riser(1.6, 0.3), 19.4)

# 21-25: peak montage
place(impact(0.9, 1.2), 21.0)
bar_stomp(21.0, 1.15, hats=2, bass=[A1, F1], stabs=[AM, FM])
for j in range(8):  # final half-bar clap roll
    place(clap(), 24.0 + j * 0.125, 0.4 + j * 0.06)

# ---------- 25-28: sudden silence -> heartbeat ----------
cut = int(25.0 * SR)
L[cut:] = 0
R[cut:] = 0
place(noise(3.0) * 0.003, 25.0)
place(heartbeat(0.7), 25.75)
place(heartbeat(1.0), 26.5)  # "FELT."
place(tick(2800, 0.1), 26.5)
place(heartbeat(0.7), 27.4)
place(whoosh(0.9, True, 0.35), 27.1)

# ---------- 28-32: identity ----------
place(riser(1.0, 0.25), 28.0)
place(impact(1.2, 3.5), 29.0)  # name locks
place(pad(AM, 3.0, 0.12, 1400), 29.0)
place(pad(FM, 2.0, 0.12, 1600), 31.0)
for x in (29.0, 29.5, 31.0, 31.5):
    place(stomp(0.55), x, 0.7)
for x in (30.0, 32.0):
    place(clap(), x, 0.45)

# ---------- 32-36: end card resolve ----------
place(whoosh(0.6, False, 0.3), 31.8)
place(pad(CM + [523.25], 2.0, 0.12, 1800), 33.0)
place(pad(AM + [440], 3.0, 0.12, 1500), 33.0 + 2.0)
place(stomp(0.5), 33.0, 0.6)
place(stomp(0.5), 33.5, 0.6)
place(clap(), 34.0, 0.4)
place(tick(4200, 0.35), 34.0)  # clean digital click on URL line
place(tick(2100, 0.2), 34.03)
place(sub(A1, 2.0, 0.35), 33.0)

# ---------- simple stereo reverb ----------
def reverb(x, secs=1.6, mix=0.18, seed=1):
    r = np.random.default_rng(seed)
    ir_t = np.arange(int(SR * secs)) / SR
    ir = r.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.0)
    ir[0] = 0
    n = len(x) + len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    y /= np.max(np.abs(y)) + 1e-9
    return x + y * mix * np.max(np.abs(x))


L = reverb(L, seed=1)
R = reverb(R, seed=2)
# keep the silence at 25.0-25.7 truly silent (reverb tail choked)
s0, s1 = int(25.0 * SR), int(25.7 * SR)
L[s0:s1] *= np.linspace(0, 0, s1 - s0)
R[s0:s1] *= np.linspace(0, 0, s1 - s0)
# fade tail
fo = int(1.2 * SR)
L[-fo:] *= np.linspace(1, 0, fo)
R[-fo:] *= np.linspace(1, 0, fo)

mix = np.stack([L, R], 1)
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.4) * 0.92
pcm = (mix * 32767).astype(np.int16)
with wave.open("assets/stomp_score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote assets/stomp_score.wav", DUR, "s")
