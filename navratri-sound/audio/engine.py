"""Tiny synthesis toolkit: instruments + SFX, all procedural (48 kHz stereo)."""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def sos(kind, f, order=2):
    if kind == "bp":
        return signal.butter(order, [f[0], f[1]], "bandpass", fs=SR, output="sos")
    return signal.butter(order, f, kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def noise(n):
    return rng.standard_normal(n)


def shaped_noise(dur, mask, nfft=2048):
    """Noise whose spectrum over time is mask(t[frames], f[bins]) -> gain."""
    hop = nfft // 4
    n = int(dur * SR)
    frames = n // hop + 4
    f = np.fft.rfftfreq(nfft, 1 / SR)
    t = np.arange(frames) * hop / SR
    M = mask(t[:, None], f[None, :])
    ph = np.exp(2j * np.pi * rng.random(M.shape))
    Z = (M * ph).T
    _, x = signal.istft(Z, fs=SR, nperseg=nfft, noverlap=nfft - hop)
    x = x[:n]
    return x / (np.abs(x).max() + 1e-9)


def pan2(x, p=0.0):
    """p in [-1,1] constant-power pan -> (n,2)."""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


class Bus:
    def __init__(self, dur):
        self.b = np.zeros((int(dur * SR), 2))

    def add(self, x, t, gain=1.0, p=0.0):
        if x.ndim == 1:
            x = pan2(x, p)
        i = int(round(t * SR))
        if i < 0:
            x, i = x[-i:], 0
        j = min(len(self.b), i + len(x))
        if j > i:
            self.b[i:j] += gain * x[: j - i]


def reverb_ir(rt60=2.0, dur=None, bright=5000, predelay=0.012):
    dur = dur or rt60 * 1.2
    chans = []
    for _ in range(2):
        ir = shaped_noise(dur, lambda t, f: np.exp(-6.9 * t / rt60 * (1 + f / bright)))
        ir *= np.minimum(1, tt(dur)[: len(ir)] / 0.004 + 0.0)
        chans.append(np.concatenate([np.zeros(int(predelay * SR)), ir]))
    ir = np.stack(chans, 1)
    return ir / np.sqrt((ir ** 2).sum(0).mean())


def convolve(x, ir):
    out = np.zeros((len(x) + len(ir) - 1, 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], ir[:, c])
    return out[: len(x)]


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.1):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = np.clip((dur - t) / max(r, 1e-6), 0, 1)
    return e * rel


def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m) - 69) / 12)


def softclip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- percussion
def dhol_dhum(vel=1.0, f0=72):
    """Bass head of the dhol: deep pitched boom with a bent attack."""
    t = tt(0.9)
    f = f0 * (1 + 0.9 * np.exp(-t / 0.018)) * (1 - 0.05 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.32)
    x += 0.35 * np.sin(1.52 * ph) * np.exp(-t / 0.12)
    x += 0.18 * np.sin(2.31 * ph) * np.exp(-t / 0.07)
    click = filt(noise(len(t)), "lp", 2200) * np.exp(-t / 0.006) * 0.5
    x = softclip(x + click, 1.8)
    return x * vel


def dhol_tak(vel=1.0, pitch=1.0):
    """Treble head hit with the thin cane stick: sharp crack + ring."""
    t = tt(0.35)
    modes = [(410, 0.09, 1.0), (655, 0.06, 0.6), (880, 0.05, 0.45), (1180, 0.035, 0.3), (1630, 0.025, 0.2)]
    x = sum(a * np.sin(2 * np.pi * f * pitch * t + rng.random() * 6) * np.exp(-t / d) for f, d, a in modes)
    crack = filt(noise(len(t)), "bp", (1800, 7000)) * np.exp(-t / 0.012)
    return (0.55 * x + 0.9 * crack) * vel


def dandiya(vel=1.0, bells=True):
    """Two lacquered wooden sticks clacking, with tiny ghungroo jingles."""
    t = tt(0.5)
    modes = [(1320, 0.045, 1.0), (2870, 0.028, 0.7), (4480, 0.02, 0.45), (760, 0.03, 0.4)]
    x = sum(a * np.sin(2 * np.pi * f * (1 + 0.02 * rng.standard_normal()) * t) * np.exp(-t / d) for f, d, a in modes)
    x += 0.8 * filt(noise(len(t)), "hp", 2500) * np.exp(-t / 0.004)
    if bells:
        j = np.zeros(len(t))
        for _ in range(5):
            o = int(rng.uniform(0.003, 0.05) * SR)
            f = rng.uniform(5500, 8500)
            jt = t[: len(t) - o]
            j[o:] += np.sin(2 * np.pi * f * jt) * np.exp(-jt / 0.06) * rng.uniform(0.3, 1)
        x += 0.12 * j
    return x * vel


def clap(vel=1.0):
    t = tt(0.4)
    env = np.zeros(len(t))
    for k, o in enumerate([0, 0.009, 0.019, 0.03]):
        env += (t >= o) * np.exp(-(t - o).clip(0) / (0.006 if k < 3 else 0.09))
    x = filt(noise(len(t)), "bp", (900, 3200)) * env
    return x * vel


def kick(vel=1.0):
    t = tt(0.55)
    f = 48 + 150 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    x += 0.4 * filt(noise(len(t)), "hp", 3000) * np.exp(-t / 0.003)
    return softclip(x, 1.5) * vel


def hat(vel=1.0, dur=0.05):
    t = tt(dur * 4)
    return filt(noise(len(t)), "hp", 7500) * np.exp(-t / dur) * vel


def shaker(vel=1.0):
    t = tt(0.12)
    env = np.sin(np.pi * np.clip(t / 0.08, 0, 1)) ** 2
    return filt(noise(len(t)), "bp", (4000, 11000)) * env * vel


def snare(vel=1.0):
    t = tt(0.3)
    x = 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    x += filt(noise(len(t)), "bp", (1500, 9000)) * np.exp(-t / 0.08)
    return x * vel


def crash(vel=1.0, dur=3.0):
    t = tt(dur)
    x = filt(noise(len(t)), "hp", 3500) * np.exp(-t / (dur / 4))
    ring = sum(np.sin(2 * np.pi * f * t) for f in [3310, 4870, 6120, 7430]) * 0.04 * np.exp(-t / (dur / 3))
    return (x + ring) * vel


# ---------------------------------------------------------------- tonal
def additive(freq, n, harm_amp, phase=None):
    """freq: per-sample array; harm_amp(k, f_k) -> amplitude array."""
    ph = 2 * np.pi * np.cumsum(freq) / SR
    out = np.zeros(n)
    for k in range(1, 60):
        fk = freq * k
        if np.min(fk) > SR / 2 - 1000:
            break
        a = harm_amp(k, fk) * (fk < SR / 2 - 1000)
        out += a * np.sin(k * ph + (0 if phase is None else phase * k))
    return out


def formant(fk, peaks):
    return sum(g * np.exp(-0.5 * ((fk - fc) / bw) ** 2) for fc, bw, g in peaks)


def pitch_curve(notes, dur, glide=0.045, vib_rate=5.6, vib_depth=0.18, vib_delay=0.18):
    """notes: list of (start, length, midi) relative times; returns midi curve + gate."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    m = np.full(n, np.nan)
    gate = np.zeros(n)
    since = np.zeros(n)
    for s, l, p in notes:
        i, j = int(s * SR), min(n, int((s + l) * SR))
        m[i:j] = p
        gate[i:j] = 1
        since[i:j] = t[i:j] - s
    # hold pitch through rests
    idx = np.where(np.isnan(m), 0, np.arange(n))
    np.maximum.accumulate(idx, out=idx)
    m = m[idx]
    m = np.nan_to_num(m, nan=notes[0][2])
    # portamento (meend): one-pole smoothing
    a = np.exp(-1 / (glide * SR))
    m = signal.lfilter([1 - a], [1, -a], m, zi=[m[0] * a])[0]
    vib = vib_depth * np.sin(2 * np.pi * vib_rate * t) * np.clip((since - vib_delay) / 0.25, 0, 1)
    return m + vib, gate


def shehnai(notes, dur, level=1.0, octave=0):
    """Double-reed lead with nasal formants, meend glides and breath."""
    m, gate = pitch_curve(notes, dur)
    f = mtof(m + 12 * octave)
    n = len(f)
    peaks = [(1150, 260, 1.0), (2650, 420, 0.55), (480, 180, 0.35)]
    x = additive(f, n, lambda k, fk: formant(fk, peaks) / (k ** 0.35))
    a = np.exp(-1 / (0.02 * SR))
    env = signal.lfilter([1 - a], [1, -a], gate)
    breath = filt(noise(n), "bp", (1500, 5000)) * 0.05
    x = softclip((x + breath) * env * 1.4, 1.3)
    return x * level


def flute(notes, dur, level=1.0):
    m, gate = pitch_curve(notes, dur, glide=0.03, vib_depth=0.12)
    f = mtof(m)
    n = len(f)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    a = np.exp(-1 / (0.035 * SR))
    env = signal.lfilter([1 - a], [1, -a], gate)
    x = x + filt(noise(n), "bp", (1800, 6000)) * 0.12
    return x * env * level


def harmonium(midis, dur, level=1.0, bright=2500):
    t = tt(dur)
    n = len(t)
    x = np.zeros(n)
    for m in midis:
        for det in (-0.07, 0.07):
            f = np.full(n, mtof(m + det))
            x += additive(f, n, lambda k, fk: 1 / k ** 0.8 * np.exp(-fk / bright))
    x *= adsr(n, 0.05, 0.3, 0.85, 0.25) / max(1, len(midis))
    return x * level


def tanpura_note(midi, dur=2.4, level=1.0):
    """Plucked drone with the jawari 'buzz': a formant peak sweeping up the harmonics."""
    t = tt(dur)
    n = len(t)
    f0 = mtof(midi)
    fc = 900 + 3200 * (1 - np.exp(-t / 1.2))
    x = np.zeros(n)
    for k in range(1, 40):
        if k * f0 > 9000:
            break
        a = (1 / k ** 0.6) * (0.25 + np.exp(-0.5 * ((k * f0 - fc) / 500) ** 2))
        x += a * np.sin(2 * np.pi * k * f0 * (1 + 0.0004 * k) * t)
    x *= np.exp(-t / 1.6) * np.minimum(1, t / 0.01)
    return x * level * 0.15


def bass_note(midi, dur, level=1.0):
    t = tt(dur)
    f = mtof(midi)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    x *= adsr(len(t), 0.005, 0.25, 0.6, 0.06)
    return softclip(x * 1.3, 1.2) * level


def supersaw(midis, dur, level=1.0, cutoff=3500):
    t = tt(dur)
    n = len(t)
    x = np.zeros(n)
    for m in midis:
        for d in np.linspace(-0.18, 0.18, 7):
            f0 = mtof(m + d)
            ph = rng.random()
            x += 2 * (((f0 * t + ph) % 1.0) - 0.5)
    x = filt(x, "lp", cutoff, 2) * adsr(n, 0.01, 0.12, 0.45, 0.08)
    return x * level / (7 * max(1, len(midis)))


def pad(midis, dur, level=1.0, cutoff=1400):
    t = tt(dur)
    n = len(t)
    x = np.zeros(n)
    for m in midis:
        for d in (-0.1, 0, 0.1):
            f0 = mtof(m + d)
            x += 2 * (((f0 * t + rng.random()) % 1.0) - 0.5)
    x = filt(x, "lp", cutoff, 2)
    x *= adsr(n, min(1.5, dur / 3), 1.0, 1.0, min(1.5, dur / 3))
    return x * level / (3 * max(1, len(midis)))


def temple_bell(f0=880, level=1.0, dur=5.0):
    t = tt(dur)
    x = np.zeros(len(t))
    for r, a, d in [(0.5, 0.5, 2.5), (1, 1, 2.0), (1.19, 0.6, 1.6), (1.56, 0.5, 1.2), (2.0, 0.45, 1.0),
                    (2.51, 0.4, 0.8), (3.34, 0.25, 0.5), (4.1, 0.18, 0.35)]:
        for det in (0, 1.6):
            x += a * np.sin(2 * np.pi * (f0 * r + det) * t) * np.exp(-t / d)
    x += 0.5 * filt(noise(len(t)), "hp", 4000) * np.exp(-t / 0.004)
    return x * level * 0.15


def shankh(dur=3.0, f0=233, level=1.0):
    """Conch blow: swelling, slightly rising, formant-rich horn with breath."""
    t = tt(dur)
    n = len(t)
    env = np.clip(t / (dur * 0.35), 0, 1) ** 1.5 * np.clip((dur - t) / 0.6, 0, 1)
    f = f0 * (1 + 0.035 * np.clip(t / dur, 0, 1)) * (1 + 0.006 * np.sin(2 * np.pi * 4.5 * t))
    peaks = [(620, 160, 1.0), (1250, 260, 0.6), (2500, 500, 0.25)]
    x = additive(f, n, lambda k, fk: formant(fk, peaks) * (0.6 + 0.4 * env))
    x += filt(noise(n), "bp", (500, 2500)) * 0.12
    return softclip(x * env * 1.5, 1.4) * level


# ---------------------------------------------------------------- SFX
def whoosh(dur=0.8, f_lo=300, f_hi=4000, peak=0.6, level=1.0):
    def mask(t, f):
        u = np.clip(t / dur, 0, 1)
        fc = f_lo * (f_hi / f_lo) ** np.sin(np.pi * u) if peak == "arc" else f_lo * (f_hi / f_lo) ** u
        g = np.exp(-0.5 * (np.log(f / fc + 1e-9) / 0.6) ** 2)
        env = np.where(u < (0.5 if peak == "arc" else peak), (u / (0.5 if peak == "arc" else peak)) ** 2,
                       np.exp(-(u - (0.5 if peak == "arc" else peak)) / 0.12))
        return g * env
    return shaped_noise(dur, mask) * level


def riser(dur=2.0, f_lo=200, f_hi=9000, level=1.0, tonal_midi=None):
    x = shaped_noise(dur, lambda t, f: np.exp(-0.5 * (np.log(f / (f_lo * (f_hi / f_lo) ** np.clip(t / dur, 0, 1)) + 1e-9) / 0.5) ** 2) * np.clip(t / dur, 0, 1) ** 2)
    if tonal_midi is not None:
        t = tt(dur)
        n = len(t)
        m = tonal_midi + 12 * (t / dur) ** 2
        f = mtof(m)
        ph = 2 * np.pi * np.cumsum(f) / SR
        saw = sum(np.sin(k * ph) / k for k in range(1, 12))
        x = x[:n] + 0.35 * saw * (t / dur) ** 2
    return x * level


def reverse_swell(dur=1.5, level=1.0):
    t = tt(dur)
    x = filt(noise(len(t)), "hp", 2500) * (t / dur) ** 3
    return x * level


def impact(level=1.0, sub=46, dur=3.5):
    t = tt(dur)
    n = len(t)
    f = sub + 60 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    body = filt(noise(n), "lp", 900) * np.exp(-t / 0.18)
    metal = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t / d) for fr, d in [(97, 1.2), (143, 0.9), (211, 0.7), (389, 0.5)]) * 0.25
    crack = filt(noise(n), "hp", 1500) * np.exp(-t / 0.02) * 0.6
    return softclip((1.1 * x + 0.8 * body + metal + crack) * 1.2, 1.6) * level


def thud(level=1.0, f0=85):
    t = tt(0.6)
    f = f0 + 70 * np.exp(-t / 0.02)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    x += filt(noise(len(t)), "lp", 700) * np.exp(-t / 0.05) * 0.7
    return softclip(x * 1.3, 1.5) * level


def wicker_crunch(dur=0.25, level=1.0):
    n = int(dur * SR)
    x = np.zeros(n)
    for _ in range(90):
        i = int(abs(rng.exponential(dur * 0.25)) * SR)
        if i >= n - 400:
            continue
        L = 300
        seg = noise(L) * np.exp(-np.arange(L) / rng.uniform(20, 80))
        x[i:i + L] += seg * rng.uniform(0.2, 1)
    return filt(x, "bp", (700, 5500)) * level


def soft_pat(level=1.0):
    """A marigold flower bouncing on concrete."""
    t = tt(0.12)
    x = filt(noise(len(t)), "bp", (180, 1400)) * np.exp(-t / 0.018)
    return x * level


def tap(level=1.0):
    """Deep woody knock – the 'tap' of the tap-tap-thump."""
    t = tt(0.8)
    x = np.sin(2 * np.pi * (180 + 90 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.09)
    x += 0.6 * np.sin(2 * np.pi * 520 * t) * np.exp(-t / 0.03)
    x += 0.5 * filt(noise(len(t)), "bp", (1500, 5000)) * np.exp(-t / 0.005)
    return x * level


def relay_click(on=True, level=1.0):
    """Indicator relay: crisp 'tick' (on) / slightly duller 'tock' (off)."""
    t = tt(0.08)
    base = [(3100, 0.006), (5900, 0.004), (1500, 0.01)] if on else [(2300, 0.007), (4300, 0.005), (1100, 0.012)]
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in base)
    x += filt(noise(len(t)), "hp", 2000) * np.exp(-t / 0.0015) * 1.2
    x += 0.4 * np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.015)
    return x * level


def gravel(dur, level=1.0, density=900):
    n = int(dur * SR)
    x = np.zeros(n)
    count = int(density * dur)
    for _ in range(count):
        i = rng.integers(0, n - 600)
        L = rng.integers(80, 500)
        x[i:i + L] += noise(L) * np.exp(-np.arange(L) / (L / 5)) * rng.uniform(0.1, 1) ** 2
    x = filt(x, "bp", (250, 6000))
    rumble = filt(noise(n), "lp", 160) * 0.8
    env = adsr(n, 0.2, 1, 1, 0.4)
    return (x + rumble) * env * level


def wet_roll(dur, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "bp", (300, 2500)) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t) ** 2)
    x += filt(noise(n), "lp", 180) * 0.8
    for _ in range(int(dur * 6)):
        i = rng.integers(0, n - 4000)
        L = 3000
        tl = np.arange(L) / SR
        x[i:i + L] += 0.5 * np.sin(2 * np.pi * (700 + 900 * tl / 0.05) * tl) * np.exp(-tl / 0.012)
    return x * adsr(n, 0.3, 1, 1, 0.5) * level


def engine(dur, rpm_curve, level=1.0):
    t = tt(dur)
    n = len(t)
    rpm = rpm_curve(t)
    f = rpm / 60 * 2  # 4-cyl firing frequency
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph + rng.random() * 6) / k ** 0.7 * (1 + 0.3 * np.sin(0.5 * k * ph)) for k in range(1, 18))
    x += filt(noise(n), "lp", 900) * 0.6 * (rpm / rpm.max())
    x = softclip(filt(x, "lp", 1800) * 0.6, 2.2)
    return x * level


def crowd(dur, level=1.0, voices=40):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for _ in range(voices):
        on = rng.uniform(0, dur * 0.3)
        f0 = rng.uniform(170, 420)
        glide = f0 * (1 + 0.25 * np.sin(np.pi * np.clip((t - on) / rng.uniform(0.6, 1.4), 0, 1)))
        ph = 2 * np.pi * np.cumsum(glide) / SR
        v = sum(np.sin(k * ph) / k for k in range(1, 10))
        v = filt(v, "bp", (rng.uniform(500, 800), rng.uniform(1100, 2600)))
        env = np.clip((t - on) / 0.15, 0, 1) * np.exp(-np.clip(t - on - 0.3, 0, None) / rng.uniform(0.6, 1.5))
        x += v * env * rng.uniform(0.3, 1)
    x += filt(noise(n), "bp", (400, 3000)) * 0.5 * adsr(n, 0.2, 1, 1, dur * 0.6)
    # applause
    for _ in range(int(dur * 60)):
        i = rng.integers(0, n - 20000)
        c = clap(rng.uniform(0.1, 0.5))
        x[i:i + len(c)] += c * np.exp(-i / SR / (dur * 0.6))
    return x * level / np.abs(x).max()


def poof(level=1.0, dur=1.2):
    """Gulal colour burst: a soft powdery explosion."""
    t = tt(dur)
    n = len(t)
    x = filt(noise(n), "bp", (200, 3500)) * (1 - np.exp(-t / 0.01)) * np.exp(-t / 0.25)
    x += filt(noise(n), "hp", 5000) * np.exp(-t / 0.5) * 0.25
    x += 0.5 * np.sin(2 * np.pi * (70 + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.15)
    return x * level


def door_latch(level=1.0):
    t = tt(0.5)
    x = relay_click(False, 0.8)
    x = np.concatenate([x, np.zeros(len(t) - len(x))])
    x += 0.7 * np.sin(2 * np.pi * (110 + 60 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.06)
    return x * level


def light_on(level=1.0):
    """Headlights snapping on: electrical thunk + whump + sparkle."""
    t = tt(1.5)
    n = len(t)
    x = 0.8 * np.sin(2 * np.pi * (60 + 90 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.25)
    c = relay_click(True, 0.6)
    x[: len(c)] += c
    sp = np.sum([np.sin(2 * np.pi * f * t) for f in (5200, 6600, 8300)], 0) * np.exp(-t / 0.5) * 0.05
    return (x + sp) * level
