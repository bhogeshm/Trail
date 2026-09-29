"""Detailed foley + ambience voices (no music). Builds on engine.py primitives."""
import numpy as np
from engine import SR, tt, filt, noise, rng, softclip, shaped_noise, adsr, relay_click


def _ring(t, partials):
    return sum(a * np.sin(2 * np.pi * f * t + rng.random() * 6.28) * np.exp(-t / d) for f, d, a in partials)


def ghungroo(vel=1.0, bells=14, spread=0.035, dur=0.45):
    """Anklet bells: a cluster of tiny brass bells rattling (one foot-fall / shake)."""
    t = tt(dur)
    x = np.zeros(len(t))
    for _ in range(bells):
        o = int(abs(rng.normal(0, spread)) * SR)
        if o >= len(t) - 100:
            continue
        f0 = rng.uniform(4200, 7800)
        tl = t[: len(t) - o]
        # tiny bell: a few inharmonic partials + the rattling pellet
        b = _ring(tl, [(f0, rng.uniform(.05, .13), 1), (f0 * 1.51, .05, .5), (f0 * 2.03, .03, .25)])
        b += filt(noise(len(tl)), "hp", 5000) * np.exp(-tl / .004) * .6
        x[o:] += b * rng.uniform(.3, 1)
    return x * vel * 0.25


def ghungroo_shake(dur=0.6, vel=1.0, rate=38):
    """Continuous jingle (spinning / stick shaking)."""
    n = int(dur * SR)
    x = np.zeros(n + SR)
    for k in range(int(dur * rate)):
        i = int((k / rate + rng.uniform(0, .01)) * SR)
        g = ghungroo(rng.uniform(.3, .8), bells=4, spread=.01, dur=.2)
        x[i:i + len(g)] += g
    env = np.sin(np.pi * np.clip(np.arange(len(x)) / n, 0, 1)) ** .7
    return x[:n + int(.2 * SR)] * env[:n + int(.2 * SR)] * vel


def bangles(vel=1.0):
    """Glass/metal bangles chinking together."""
    t = tt(0.4)
    x = np.zeros(len(t))
    for _ in range(rng.integers(2, 5)):
        o = int(rng.uniform(0, .025) * SR)
        f0 = rng.uniform(2600, 4200)
        tl = t[: len(t) - o]
        x[o:] += _ring(tl, [(f0, .09, 1), (f0 * 2.32, .05, .6), (f0 * 3.7, .03, .35)]) * rng.uniform(.4, 1)
    return x * vel * .35


def real_clap(vel=1.0, body=None):
    """Single human clap: 2-3 micro-slaps + palm-cavity resonance + skin noise."""
    t = tt(0.25)
    body = body or rng.uniform(900, 1500)
    env = np.zeros(len(t))
    for o in np.cumsum([0, rng.uniform(.002, .005), rng.uniform(.003, .006)]):
        env += (t >= o) * np.exp(-np.clip(t - o, 0, None) / rng.uniform(.004, .008))
    n = filt(noise(len(t)), "bp", (body * .6, body * 3.2))
    cav = np.sin(2 * np.pi * body * t) * np.exp(-t / .012) * .5
    x = (n + cav) * env
    tail = filt(noise(len(t)), "bp", (700, 4000)) * np.exp(-t / .03) * .15
    return (x + tail) * vel


def group_clap(people=5, spread=0.018, vel=1.0, with_bangles=True):
    out = np.zeros(int(.6 * SR))
    for _ in range(people):
        o = int(abs(rng.normal(0, spread)) * SR)
        c = real_clap(rng.uniform(.6, 1))
        out[o:o + len(c)] += c
        if with_bangles:
            b = bangles(rng.uniform(.4, .9))
            o2 = o + int(.004 * SR)
            out[o2:o2 + len(b)] += b[: len(out) - o2]
    return out * vel / np.sqrt(people)


def footstep(vel=1.0, surface="dirt"):
    t = tt(0.3)
    thump = np.sin(2 * np.pi * (70 + 60 * np.exp(-t / .01)) * t) * np.exp(-t / .04)
    if surface == "dirt":
        grit = filt(noise(len(t)), "bp", (400, 5000)) * np.exp(-t / .035)
        grains = np.zeros(len(t))
        for _ in range(25):
            i = int(abs(rng.normal(.01, .015)) * SR)
            if i < len(t) - 200:
                grains[i:i + 200] += noise(200) * np.exp(-np.arange(200) / 30) * rng.uniform(.2, 1)
        x = .7 * thump + .5 * grit + .4 * filt(grains, "hp", 1500)
    else:  # hard / wet road
        x = .6 * thump + .6 * filt(noise(len(t)), "bp", (800, 6000)) * np.exp(-t / .015)
    return x * vel


def swish(dur=0.5, vel=1.0, lo=500, hi=4000):
    """Fabric (ghagra / dupatta) swirl."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "bp", (lo, hi))
    env = np.sin(np.pi * t / dur) ** 2 * (1 + .4 * np.sin(2 * np.pi * 9 * t))
    return x * env * vel * .6


def walla(dur, vel=1.0, density=30, distance=0.0):
    """Crowd chatter/babble: many syllable-rate formant bursts. distance 0..1 muffles it."""
    n = int(dur * SR)
    x = np.zeros(n)
    base = filt(noise(n), "bp", (300, 3000))
    for _ in range(density):
        rate = rng.uniform(3, 6)                    # syllables / s
        ph = rng.random() * 6.28
        t = np.arange(n) / SR
        syl = np.clip(np.sin(2 * np.pi * rate * t + ph), 0, None) ** 2
        f1 = rng.uniform(400, 900)
        f2 = rng.uniform(1100, 2600)
        v = filt(noise(n), "bp", (f1 * .8, f1 * 1.25)) + .6 * filt(noise(n), "bp", (f2 * .85, f2 * 1.15))
        # a voiced buzz underneath
        f0 = rng.uniform(110, 260) * (1 + .05 * np.sin(2 * np.pi * .7 * t + ph))
        v += .25 * filt(np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)), "bp", (f1 * .8, f2))
        x += v * syl * rng.uniform(.3, 1)
    x = x / (np.abs(x).max() + 1e-9) + .15 * base / (np.abs(base).max() + 1e-9)
    if distance > 0:
        x = filt(x, "lp", 5000 - 4000 * distance)
    return x * vel


def cheer(dur=2.0, vel=1.0, voices=45):
    """'Hoooo!' crowd whoop with whistles."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for _ in range(voices):
        on = rng.uniform(0, .25)
        f0 = rng.uniform(220, 480)
        rise = f0 * (1 + .35 * np.clip((t - on) / .25, 0, 1)) * (1 - .15 * np.clip((t - on - .5) / 1.0, 0, 1))
        ph = 2 * np.pi * np.cumsum(rise) / SR
        v = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 8))
        v = filt(v, "bp", (rng.uniform(350, 600), rng.uniform(1300, 2800)))
        env = np.clip((t - on) / .08, 0, 1) * np.exp(-np.clip(t - on - .35, 0, None) / rng.uniform(.5, 1.2))
        x += v * env * rng.uniform(.2, 1)
    for _ in range(3):  # whistles
        on = rng.uniform(.05, .5)
        f = rng.uniform(1800, 2800) * (1 + .15 * np.sin(np.pi * np.clip((t - on) / .6, 0, 1)))
        w = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip((t - on) / .04, 0, 1) * np.exp(-np.clip(t - on, 0, None) / .5)
        x += .25 * w * (t >= on)
    x += filt(noise(n), "bp", (300, 3500)) * .35 * adsr(n, .1, 1, 1, dur * .6)
    return x / np.abs(x).max() * vel


def manjira(vel=1.0, dur=1.2):
    """Small hand cymbals (temple)."""
    t = tt(dur)
    x = _ring(t, [(2710, .5, 1), (3940, .35, .8), (5230, .3, .6), (6610, .2, .4), (8120, .15, .3)])
    x += filt(noise(len(t)), "hp", 4000) * np.exp(-t / .01) * .6
    return x * vel * .3


def slam(vel=1.0):
    """Car door closing: latch + panel thump + rattle."""
    t = tt(0.8)
    x = .9 * np.sin(2 * np.pi * (55 + 90 * np.exp(-t / .012)) * t) * np.exp(-t / .09)
    x += .5 * filt(noise(len(t)), "lp", 1200) * np.exp(-t / .03)
    lc = relay_click(False, .9)
    x[: len(lc)] += lc
    x += .15 * _ring(t, [(420, .12, 1), (730, .08, .7), (1170, .05, .5)])
    return softclip(x * 1.2, 1.3) * vel


def slide_door(dur=0.35, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    roll = filt(noise(n), "bp", (150, 1800)) * (1 + .5 * np.sin(2 * np.pi * 42 * t))
    x = roll * np.clip(t / .05, 0, 1)
    end = slam(.8)
    out = np.zeros(n + len(end))
    out[:n] += x * .5
    out[n - 200:n - 200 + len(end)] += end
    return out * vel


def hiss(dur=1.0, vel=1.0):
    """Colour-smoke cannon / CO2 jet."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "hp", 1800) * np.clip(t / .02, 0, 1) * np.exp(-t / (dur * .5))
    x += filt(noise(n), "bp", (200, 900)) * np.exp(-t / .15) * .5
    return x * vel


def wind(dur, vel=1.0):
    return shaped_noise(dur, lambda t, f: (1 / (1 + (f / 400) ** 2)) * (0.6 + 0.4 * np.sin(2 * np.pi * .35 * t) ** 2)) * vel


def buzz(dur, vel=1.0, f=100):
    """Electrical hum of lamps / LED walls."""
    t = tt(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 5)) * adsr(len(t), .1, 1, 1, .2)
    return x * vel * .2


def night_bed(dur, vel=1.0):
    """Open-air night: crickets + soft air."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "lp", 700) * .25
    for f, rate in [(4300, 16), (4700, 13), (5100, 19)]:
        chirp = (np.sin(2 * np.pi * rate * t + rng.random() * 6) > .6) * (np.sin(2 * np.pi * .6 * t + rng.random() * 6) > -.2)
        x += .05 * np.sin(2 * np.pi * f * t) * signal_smooth(chirp.astype(float))
    return x * vel


def day_bed(dur, vel=1.0):
    """Daytime exterior: distant traffic + a few birds."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "lp", 400) * .4
    for _ in range(4):
        on = rng.uniform(0, dur - .4)
        tl = np.arange(int(.18 * SR)) / SR
        f = 3200 + 900 * np.sin(2 * np.pi * 12 * tl)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tl / .18) ** 2 * .06
        i = int(on * SR)
        x[i:i + len(b)] += b
    return x * vel


def signal_smooth(x, ms=4):
    k = int(ms / 1000 * SR)
    return np.convolve(x, np.ones(k) / k, "same")


def diesel(dur, rpm=800, vel=1.0):
    t = tt(dur)
    f = rpm / 60 * 2 * (1 + .01 * np.sin(2 * np.pi * .8 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph + k) / k ** .6 for k in range(1, 14)) * (1 + .4 * np.sin(ph / 2))
    x += filt(noise(len(t)), "lp", 500) * .7 * (1 + .6 * np.sin(ph))
    return filt(softclip(x * .5, 2), "lp", 1400) * vel


def tyre_dirt(dur, vel=1.0):
    n = int(dur * SR)
    x = np.zeros(n)
    for _ in range(int(dur * 500)):
        i = rng.integers(0, n - 400)
        L = rng.integers(60, 300)
        x[i:i + L] += noise(L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(.05, 1) ** 2
    x = filt(x, "bp", (300, 5000)) + filt(noise(n), "lp", 220) * .9
    return x * adsr(n, .2, 1, 1, .3) * vel


def powder_puff(vel=1.0, dur=0.8):
    t = tt(dur)
    x = filt(noise(len(t)), "bp", (250, 2500)) * (1 - np.exp(-t / .02)) * np.exp(-t / .2)
    x += filt(noise(len(t)), "hp", 4000) * np.exp(-t / .35) * .2
    return x * vel
