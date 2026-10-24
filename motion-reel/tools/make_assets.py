"""Procedural assets for the reel: paper plate, grain tile and paper foley.

Seeded, so every run writes identical files. Run from the project root:
    python3 -I tools/make_assets.py
"""
import math
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SFX = ASSETS / "sfx"
SR = 48000
rng = np.random.default_rng(1987)


# ---------------------------------------------------------------- images
def blur_noise(w, h, scale, radius):
    small = rng.random((max(1, h // scale), max(1, w // scale))) * 255
    img = Image.fromarray(small.astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255


def paper(w=2304, h=1296):
    base = np.array([237, 234, 227], dtype=np.float32)  # --paper
    mottle = blur_noise(w, h, 48, 30) - 0.5
    cloud = blur_noise(w, h, 12, 6) - 0.5
    fine = rng.normal(0, 1, (h, w)).astype(np.float32)
    lum = 1 + mottle * 0.035 + cloud * 0.02 + fine * 0.012
    img = np.clip(base[None, None, :] * lum[..., None], 0, 255).astype(np.uint8)
    im = Image.fromarray(img, "RGB")
    # fibres: short, faint, slightly curved strokes
    layer = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(layer)
    for _ in range(2600):
        x, y = rng.random() * w, rng.random() * h
        a = rng.random() * math.pi
        n = rng.integers(10, 46)
        pts = []
        for i in range(4):
            t = i / 3
            pts.append((x + math.cos(a) * n * t + rng.normal(0, 1.2), y + math.sin(a) * n * t + rng.normal(0, 1.2)))
        d.line(pts, fill=int(rng.integers(10, 26)), width=1)
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    dark = Image.new("RGB", (w, h), (150, 145, 136))
    im = Image.composite(dark, im, layer)
    im.save(ASSETS / "paper.jpg", quality=92)


def grain(size=640):
    n = rng.normal(0, 1, (size, size)).astype(np.float32)
    n = np.asarray(Image.fromarray(np.clip(128 + n * 34, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45)))
    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[..., 0:3] = n[..., None]
    rgba[..., 3] = 255
    Image.fromarray(rgba, "RGBA").save(ASSETS / "grain.png", optimize=True)


# ---------------------------------------------------------------- audio
def write(name, sig):
    sig = np.asarray(sig, dtype=np.float64)
    peak = np.max(np.abs(sig)) or 1
    sig = sig / peak * 0.89  # about -1 dBFS
    data = (sig * 32767).astype("<i2")
    with wave.open(str(SFX / name), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(data.tobytes())


def onepole_lp(x, fc):
    a = math.exp(-2 * math.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def band(x, lo, hi):
    return onepole_lp(x, hi) - onepole_lp(x, lo)


def env(n, attack, release, curve=3.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.clip((t[-1] - t) / max(release, 1e-4), 0, 1) ** curve
    return a * r


def paper_tension(dur=1.6):
    """Slow stretch: bandpassed noise with stick-slip creaks that tighten."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    body = band(noise, 300, 2400) * (0.15 + 0.85 * (t / dur) ** 2)
    creak = np.zeros(n)
    k = 0.0
    while k < dur - 0.05:
        k += 0.11 * (1 - k / dur) + 0.025 + rng.random() * 0.02
        i = int(k * SR)
        m = int(SR * 0.012)
        if i + m < n:
            creak[i:i + m] += rng.normal(0, 1, m) * np.hanning(m) * (0.3 + k / dur)
    creak = band(creak, 900, 5000)
    return (body + creak * 1.4) * env(n, 0.25, 0.08, 1.5)


def paper_tear(dur=0.5):
    n = int(SR * dur)
    noise = rng.normal(0, 1, n)
    grit = (rng.random(n) < 0.04) * rng.normal(0, 3, n)
    sig = band(noise + grit, 700, 7000)
    return sig * env(n, 0.004, 0.42, 2.2)


def paper_cut(dur=0.22):
    n = int(SR * dur)
    sig = band(rng.normal(0, 1, n), 2000, 9000)
    return sig * env(n, 0.002, 0.2, 4)


def paper_fold(dur=0.7):
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = band(rng.normal(0, 1, n), 200, 3000) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) * (t > dur * 0.62)
    return sig + thump * 0.6


def room_tone(dur=20.0):
    """Barely-there air bed so the true silences can be felt by contrast."""
    n = int(SR * dur)
    sig = band(rng.normal(0, 1, n), 60, 900)
    return sig * env(n, 0.6, 0.6, 1.0)


def sub_swell(dur=4.0):
    """Restrained low bed: filtered noise breathing under the strategy chapter."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = onepole_lp(rng.normal(0, 1, n), 140)
    return sig * np.sin(np.pi * t / dur) ** 2


def boom(dur=2.4):
    """The disproportionate hit: noise transient into a falling sub (90 -> 34 Hz)."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 34 + 56 * np.exp(-t * 5)
    phase = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(phase) * np.exp(-t * 1.6)
    crack = band(rng.normal(0, 1, n), 80, 4000) * np.exp(-t * 28)
    body = onepole_lp(rng.normal(0, 1, n), 300) * np.exp(-t * 3.5) * 4
    return np.tanh((sub * 1.0 + crack * 0.9 + body * 0.5) * 1.6)


if __name__ == "__main__":
    ASSETS.mkdir(exist_ok=True)
    SFX.mkdir(exist_ok=True)
    paper()
    grain()
    write("paper-tension.wav", paper_tension())
    write("paper-tear.wav", paper_tear())
    write("paper-cut-a.wav", paper_cut())
    write("paper-cut-b.wav", paper_cut(0.18))
    write("paper-fold.wav", paper_fold())
    write("room-tone.wav", room_tone())
    write("sub-swell.wav", sub_swell())
    write("boom.wav", boom())
    print("assets written to", ASSETS)
