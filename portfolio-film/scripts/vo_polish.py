"""Polish Kokoro VO lines: resample to 48k stereo, gentle low-shelf warmth, short room reverb, peak-normalize."""
import numpy as np, soundfile as sf
from pathlib import Path
A = Path(__file__).resolve().parent.parent / "assets" / "audio"
rng = np.random.default_rng(3)
SR = 48000
ir_t = np.arange(int(0.45 * SR)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 9); ir[0] = 0
for i in range(9):
    src = A / f"vo{i}.wav"
    x, sr = sf.read(src)
    if x.ndim > 1: x = x.mean(1)
    n = int(len(x) * SR / sr)
    x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    x = np.concatenate([x, np.zeros(int(0.5 * SR))])
    # warmth: add a bit of low-passed signal
    k = 1 - np.exp(-2 * np.pi * 220 / SR); y = np.empty_like(x); s = 0.0
    for j in range(len(x)): s += k * (x[j] - s); y[j] = s
    x = x + 0.35 * y
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + len(ir)) * np.fft.rfft(ir, len(x) + len(ir)))[: len(x)]
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    out = x + 0.12 * wet
    out = np.tanh(out / np.max(np.abs(out)) * 1.3)
    out = out / np.max(np.abs(out)) * 0.89
    sf.write(A / f"vo{i}.wav", np.stack([out, out], 1).astype(np.float32), SR)
    print(i, round(len(out) / SR, 2))
