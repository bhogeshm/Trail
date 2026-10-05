"""Synthesize the WasteWise score (music.wav) and sound design (sfx.wav).

Deterministic: fixed seed, pure numpy. 120 BPM so every scene cut
(4, 8, 12, 19, 23, 27 s) lands on a beat.
Run: python3 tools/make_audio.py
"""
import numpy as np
import soundfile as sf

SR = 44100
DUR = 30.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    if sig.ndim == 1 and buf.ndim == 2:
        sig = np.stack([sig, sig], 1)
    buf[i:j] += sig[: j - i] * gain


def env(n, a=0.002, d=0.2, sec=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
    return e


def lowpass(x, cutoff):
    # one-pole, cutoff may be array
    a = np.exp(-2 * np.pi * np.asarray(cutoff) / SR)
    y = np.zeros_like(x)
    prev = 0.0
    if np.ndim(a) == 0:
        a = np.full(len(x), a)
    for k in range(len(x)):
        prev = (1 - a[k]) * x[k] + a[k] * prev
        y[k] = prev
    return y


def kick(gain=1.0, length=0.45):
    t = t_arr(length)
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    return np.tanh((s + click) * 1.6) * gain


def snare(length=0.25):
    t = t_arr(length)
    n = rng.standard_normal(len(t)) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    hp = n - lowpass(n, 1500)
    return hp * 0.6 + tone * 0.4


def hat(length=0.06, open_=False):
    t = t_arr(0.3 if open_ else length)
    n = rng.standard_normal(len(t))
    hp = n - lowpass(n, 7000)
    return hp * np.exp(-t * (12 if open_ else 70))


def clap():
    t = t_arr(0.3)
    n = rng.standard_normal(len(t))
    e = np.zeros_like(t)
    for off in (0, 0.011, 0.023):
        e += np.where(t >= off, np.exp(-(t - off) * 60), 0)
    e += np.exp(-t * 10) * 0.3
    band = lowpass(n, 2500) - lowpass(n, 900)
    return band * e * 2.2


def saw(freq, t):
    return 2 * ((freq * t) % 1.0) - 1


def bass_note(freq, length, cutoff=500):
    t = t_arr(length)
    s = saw(freq, t) * 0.6 + np.sin(2 * np.pi * freq * t) * 0.6
    e = np.minimum(1, t / 0.005) * np.exp(-t * 3.2)
    return lowpass(s * e, cutoff)


def chord(freqs, length, cutoff=2400, decay=5.0, detune=0.004):
    t = t_arr(length)
    s = np.zeros_like(t)
    for f in freqs:
        for d in (-detune, 0, detune):
            s += saw(f * (1 + d), t)
    s /= len(freqs) * 3
    e = np.minimum(1, t / 0.004) * np.exp(-t * decay)
    return lowpass(s * e, cutoff)


def pad(freqs, length, cutoff=900, attack=0.6):
    t = t_arr(length)
    s = np.zeros_like(t)
    for f in freqs:
        for d in (-0.006, -0.002, 0.002, 0.006):
            s += saw(f * (1 + d), t)
    s /= len(freqs) * 4
    e = np.minimum(1, t / attack) * np.minimum(1, (length - t) / 0.4).clip(0, 1)
    return lowpass(s * e, cutoff)


def riser(length, f0=200, f1=4000):
    t = t_arr(length)
    n = rng.standard_normal(len(t))
    cut = f0 * (f1 / f0) ** (t / length)
    hp = lowpass(n, cut) - lowpass(n, cut * 0.4)
    sweep = np.sin(2 * np.pi * np.cumsum(cut * 0.25) / SR) * 0.15
    return (hp + sweep) * (t / length) ** 2


def impact(length=2.4):
    t = t_arr(length)
    f = 32 + 90 * np.exp(-t * 14)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    n = rng.standard_normal(len(t))
    noise = lowpass(n, 3000) * np.exp(-t * 6) * 0.5
    return np.tanh((boom * 1.4 + noise) * 1.3)


def whoosh(length=0.5, up=True):
    t = t_arr(length)
    n = rng.standard_normal(len(t))
    x = t / length
    shape = np.sin(np.pi * x) ** 2
    cut = 300 + 5000 * (x if up else 1 - x)
    band = lowpass(n, cut) - lowpass(n, cut * 0.3)
    return band * shape


def note(n):  # midi -> Hz
    return 440 * 2 ** ((n - 69) / 12)


music = np.zeros((N, 2))
sfx = np.zeros((N, 2))

# Progression in A minor -> resolves to C major / F lift
A2, C3, D3, E3, F2, G2 = 45, 48, 50, 52, 41, 43
Am = [57, 60, 64]
F = [53, 57, 60]
C = [55, 60, 64]
G = [55, 59, 62]

# ---------- 0-4: THE PROBLEM — tense pulse, ticking, low drone
place(music, pad([note(33), note(40)], 4.0, cutoff=380, attack=0.2), 0, 0.9)
for b in range(8):
    t0 = b * BEAT
    place(music, hat(), t0 + BEAT / 2, 0.25)
    place(music, bass_note(note(A2 - 12), 0.22, 260), t0, 0.7)
for at in (1.0, 1.5, 2.0, 2.5):  # word slams
    place(music, kick(1.0), at, 0.9)
place(music, kick(1.0), 3.0, 0.7)
place(music, kick(1.0), 3.25, 0.7)
place(music, kick(1.0), 3.5, 0.8)
place(music, kick(1.0), 3.75, 0.9)
place(music, riser(1.4, 400, 6000), 2.6, 0.35)

# ---------- 4-8: THE INSIGHT — freeze, airy pad, half-time
place(music, pad([note(n) for n in Am], 2.0, cutoff=1400, attack=0.25), 4.0, 0.6)
place(music, pad([note(n) for n in F], 2.0, cutoff=1600, attack=0.3), 6.0, 0.6)
place(music, kick(0.8), 5.0, 0.6)
place(music, kick(0.8), 6.0, 0.6)
place(music, kick(0.8), 7.0, 0.6)
place(music, clap(), 6.0, 0.35)
for k in range(8):
    place(music, hat(), 6.0 + k * BEAT / 4 + 1.0, 0.12 + 0.03 * k)
place(music, riser(1.5, 300, 9000), 6.5, 0.45)

# ---------- 8-27: MAIN GROOVE
prog = [(A2, Am), (F2, F), (C3 - 12, C), (G2, G)]
bar = 4 * BEAT
for t0 in np.arange(8.0, 27.0, BEAT):
    beat_in_bar = int(round((t0 - 8.0) / BEAT)) % 4
    # drop: no kick in the 'collector unavailable' break 19.0-20.5
    if 19.0 <= t0 < 20.5:
        continue
    place(music, kick(1.0), t0, 0.85)
    place(music, hat(), t0 + BEAT / 2, 0.3)
    if beat_in_bar in (1, 3):
        place(music, clap(), t0, 0.5)
    if t0 >= 23.0:  # 16th hats drive the pipeline
        place(music, hat(), t0 + BEAT / 4, 0.16)
        place(music, hat(), t0 + 3 * BEAT / 4, 0.16)

for i, t0 in enumerate(np.arange(8.0, 27.0, bar)):
    root, ch = prog[i % 4]
    if 19.0 <= t0 < 21.0:
        # tension: minor stab, alarm-ish
        continue
    for k in range(8):
        tt = t0 + k * BEAT / 2
        if tt >= 27.0:
            break
        oct_ = 12 if k % 2 else 0
        place(music, bass_note(note(root - 12 + oct_), BEAT / 2 * 0.95, 700), tt, 0.55)
    for k in (0, 1.5, 2.5):
        tt = t0 + k * BEAT
        if tt < 27.0:
            place(music, chord([note(n) for n in ch], 0.5, cutoff=3200), tt, 0.28)

# break 19-21: warning stabs then lift
place(music, pad([note(n) for n in [45, 48, 51]], 1.6, cutoff=700, attack=0.05), 19.0, 0.55)
for tt in (19.0, 19.375, 19.75, 20.125):
    place(music, chord([note(n) for n in [69, 72, 75]], 0.18, cutoff=4000, decay=14), tt, 0.25)
place(music, riser(0.6, 500, 8000), 20.0, 0.35)
place(music, chord([note(n) for n in [60, 64, 67, 72]], 1.2, cutoff=4000, decay=2.5), 20.5, 0.35)
for k in range(4):
    place(music, bass_note(note(36 + (12 if k % 2 else 0)), BEAT / 2 * 0.95, 700), 20.5 + k * BEAT / 2, 0.55)

# into the pipeline + flashes
place(music, riser(1.0, 400, 10000), 26.0, 0.5)

# ---------- 27-30: FINAL — impact + lush ring out, clean stop
place(music, impact(3.0), 27.0, 1.0)
place(music, pad([note(n) for n in [48, 55, 60, 64, 67]], 3.0, cutoff=2600, attack=0.05), 27.0, 0.55)
place(music, chord([note(n) for n in [60, 64, 67, 72]], 2.8, cutoff=5000, decay=1.2), 27.0, 0.4)
place(music, kick(1.1, 0.8), 29.5, 0.9)
place(music, impact(0.5), 29.5, 0.6)

# ---------- SFX (scene-synced)
place(sfx, kick(1.2, 0.6) * 0.9 + lowpass(rng.standard_normal(int(0.6 * SR)), 500) * np.exp(-t_arr(0.6) * 9) * 0.5, 0.55, 0.9)  # bag thud
place(sfx, whoosh(0.35, True), 0.2, 0.25)
for at in (1.0, 1.5, 2.0, 2.5):
    place(sfx, whoosh(0.18, False), at - 0.05, 0.35)
place(sfx, impact(1.2), 4.0, 0.55)  # freeze hit
place(sfx, whoosh(0.5, True), 5.55, 0.35)
place(sfx, whoosh(0.6, True), 6.5, 0.4)  # green sweep
place(sfx, impact(1.6), 8.0, 0.75)  # logo
place(sfx, whoosh(0.6, True), 9.6, 0.45)
place(sfx, whoosh(0.5, True), 11.7, 0.45)
for at in (12.55, 13.25, 13.95, 14.55, 14.75, 14.95):
    place(sfx, hat(0.03) * 3, at, 0.25)  # UI ticks
for at in (16.1, 18.2):
    place(sfx, hat(0.02) * 4, at, 0.35)  # taps
place(sfx, whoosh(0.4, True), 16.4, 0.35)
place(sfx, impact(0.9), 19.0, 0.5)  # alarm
place(sfx, whoosh(0.4, False), 20.35, 0.45)
place(sfx, hat(0.02) * 4, 21.8, 0.4)
place(sfx, chord([note(84), note(88), note(91)], 0.5, cutoff=8000, decay=6), 21.9, 0.25)  # success chime
place(sfx, whoosh(0.5, True), 22.75, 0.4)
for at in (23.1, 23.6, 24.1, 24.6):
    place(sfx, chord([note(76 + 2 * int((at - 23.1) / 0.5))], 0.25, cutoff=6000, decay=12), at, 0.25)
for at in (25.3, 25.85, 26.4):
    place(sfx, whoosh(0.2, False), at - 0.08, 0.35)
place(sfx, whoosh(0.5, False), 26.6, 0.45)


def finish(buf, peak):
    # gentle stereo width on music, then normalize + soft clip
    buf = np.tanh(buf * 1.1)
    buf /= np.max(np.abs(buf)) + 1e-9
    fade = np.ones(len(buf))
    fl = int(0.25 * SR)
    fade[-fl:] = np.linspace(1, 0, fl)
    return (buf * peak * fade[:, None]).astype(np.float32)


if __name__ == "__main__":
    sf.write("assets/music/score.wav", finish(music, 0.89), SR)
    sf.write("assets/music/sfx.wav", finish(sfx, 0.8), SR)
    print("wrote assets/music/score.wav, assets/music/sfx.wav")
