import numpy as np
from scipy.io import wavfile
from engine import *
from edit import TOTAL, out_time, beat

DUR = TOTAL + 0.2
music = Bus(DUR)    # melodic + groove
drums = Bus(DUR)
sfx = Bus(DUR)
send_hall = Bus(DUR)   # long reverb send
send_room = Bus(DUR)   # short reverb send
kicks = []             # sidechain triggers

STEP = 0.5 / 3         # triplet 8th (garba swing grid)
DROP1, EDM, TEMPLE, DROP2, BREAK, FINALE = 11.6, 19.1, 25.1, 28.1, 40.6, 42.6

def sec(t):
    if t < DROP1: return "intro"
    if t < EDM: return "groove"
    if t < TEMPLE: return "edm"
    if t < 28.02: return "temple"
    if t < BREAK: return "drop2"
    if t < FINALE: return "break"
    return "finale"

# ------------------------------------------------------------- harmony
PROG = [("D", 38, [62, 66, 69]), ("G", 43, [62, 67, 71]), ("C", 36, [60, 64, 67]), ("D", 38, [62, 66, 69])]
def chord_at(bar_start):
    m = int(round((bar_start - 13.6) / 2.0)) % 4
    return PROG[m]

# ------------------------------------------------------------- melody (beats)
PHRASE_A = [(0, 1, 74), (1, .5, 72), (1.5, .5, 74), (2, 1, 76), (3, 1, 74),
            (4, .67, 72), (4.67, .33, 71), (5, 1, 69), (6, .67, 67), (6.67, .33, 69), (7, 1, 71),
            (8, 1, 72), (9, .5, 71), (9.5, .5, 69), (10, 1, 67), (11, 1, 64),
            (12, .67, 66), (12.67, .33, 64), (13, 1.5, 62), (14.5, .5, 69), (15, .5, 71), (15.5, .5, 72)]
PHRASE_B = [(0, .5, 69), (.5, .5, 71), (1, 1, 72), (2, .67, 74), (2.67, .33, 72), (3, 1, 71),
            (4, 1, 72), (5, 1, 71), (6, .67, 69), (6.67, .33, 71), (7, 1, 74)]

def to_sec(phrase, t0, until=None, legato=0.93):
    out = []
    for b, l, m in phrase:
        s = t0 + b * 0.5
        if until and s >= until: break
        e = s + l * 0.5 * legato
        if until: e = min(e, until - 0.03)
        out.append((s, e - s, m))
    return out

def place_lead(notes, t_from, t_to, gain=0.5, octave_flute=True, p=0.1):
    rel = [(s - t_from, l, m) for s, l, m in notes]
    dur = t_to - t_from
    x = shehnai(rel, dur)
    music.add(x, t_from, gain, p)
    send_hall.add(x, t_from, gain * 0.35, p)
    if octave_flute:
        f = flute([(s, l, m + 12) for s, l, m in rel], dur)
        music.add(f, t_from, gain * 0.28, -0.3)
        send_hall.add(f, t_from, gain * 0.2, -0.3)

lead1 = to_sec(PHRASE_A, 13.6) + to_sec(PHRASE_B, 21.6, until=TEMPLE)
place_lead(lead1, 13.6, TEMPLE + 0.4, gain=0.42)
# temple alaap: slow, ornamented
alaap = [(25.3, .85, 69), (26.15, .45, 71), (26.6, .8, 69), (27.4, .55, 66)]
place_lead(alaap, 25.2, 28.02, gain=0.36, octave_flute=False)
# drop 2: long held Sa into the hook, then hook, then answer an octave up
lead2 = [(28.1, 1.15, 74), (29.3, .12, 76), (29.42, .15, 74)] + to_sec(PHRASE_A, 29.6) + \
        [(s, l, m + 12) for s, l, m in to_sec(PHRASE_B, 37.6, until=BREAK)]
place_lead(lead2, 28.05, BREAK + 0.5, gain=0.44)
# finale: long final Sa
place_lead([(42.62, 3.4, 74)], 42.6, 46.6, gain=0.4)

# ------------------------------------------------------------- per-bar groove
DHUM = {0: 1.0, 3: .5, 6: .9, 8: .6}
TAK = {2: .8, 5: .9, 9: .7, 11: .9, 4: .25, 7: .25, 10: .3}
FILL = {9: .9, 10: .8, 11: 1.0}
bar_starts = [1.6 + 2 * m for m in range(-1, 24)]
for bi, b0 in enumerate(bar_starts):
    for s in range(12):
        t = b0 + s * STEP
        if t < 0 or t > DUR - 1: continue
        S = sec(t)
        last_of_4 = ((b0 - 13.6) / 2.0) % 4 == 3
        if S in ("groove", "edm", "drop2"):
            # dhol
            if s in DHUM:
                x = dhol_dhum(DHUM[s]); drums.add(x, t, .55, -.1); send_room.add(x, t, .12)
            tk = dict(TAK)
            if last_of_4: tk.update(FILL)
            if s in tk:
                x = dhol_tak(tk[s], pitch=1 + .02 * (s % 3)); drums.add(x, t, .42, .15); send_room.add(x, t, .12, .15)
            # dandiya clacks on the backbeat, lighter ones on off-steps
            if s in (3, 9): x = dandiya(1.0); drums.add(x, t, .38, .35); send_room.add(x, t, .15, .35)
            if s in (5, 11): x = dandiya(.5, bells=False); drums.add(x, t, .3, -.35); send_room.add(x, t, .1, -.35)
            # claps: foreground when the women clap on screen
            if s in (3, 9):
                g = .55 if 13.6 <= t < 15.6 else .16
                x = clap(); drums.add(x, t, g, 0); send_room.add(x, t, g * .5)
            if 13.6 <= t < 15.6 and s in (6, 11):
                x = clap(.7); drums.add(x, t, .35, .2); send_room.add(x, t, .15)
            # bass
            _, root, ch = chord_at(b0)
            if s in (0, 5, 6, 8, 11):
                n = {0: root, 5: root, 6: root + 7, 8: root + 12, 11: root + 7}[s]
                music.add(bass_note(n, .3 if s != 0 else .45), t, .34)
            # harmonium chord (once per bar)
            if s == 0:
                x = harmonium(ch, 1.95, bright=2200); music.add(x, t, .22, -.25); send_hall.add(x, t, .08, -.25)
        if S in ("edm", "drop2"):
            if s in (0, 3, 6, 9):
                music_k = kick(1.0); drums.add(music_k, t, .62); kicks.append(t)
            if s in (1, 2, 4, 5, 7, 8, 10, 11):
                drums.add(hat(.5 if s % 3 == 2 else .25), t, .18, .4 if s % 2 else -.4)
            if s in (2, 5, 8, 11):
                _, _, ch = chord_at(b0)
                x = supersaw([c + 12 for c in ch], .16, cutoff=4200)
                music.add(x, t, .5, -.5 if s % 2 else .5); send_hall.add(x, t, .12)
        if S == "intro":
            if t >= 5.6 and s % 3 != 0:
                drums.add(shaker(.3 + .5 * (t - 5.6) / 6), t, .14, .5 if s % 2 else -.5)

# intro heartbeat on the downbeats, doubling as it builds
for t in [3.6, 5.6, 7.6, 8.6, 9.6, 10.1, 10.6, 10.85, 11.1]:
    x = filt(dhol_dhum(.9, f0=58), "lp", 900); drums.add(x, t, .6); send_hall.add(x, t, .12)
    drums.add(filt(dhol_dhum(.4, f0=58), "lp", 700), t + .22, .45)
# dhol roll into the drop
for i, t in enumerate(np.arange(10.6, 11.45, STEP / 2)):
    x = dhol_tak(.25 + .75 * i / 10); drums.add(x, t, .35, .2 if i % 2 else -.2); send_room.add(x, t, .1)
# temple section: soft half-time dhol + roll into the blackout
for t in [25.1, 26.1, 27.1]:
    x = dhol_dhum(.7); drums.add(x, t, .32); send_hall.add(x, t, .2)
for i, t in enumerate(np.arange(27.1, 28.0, STEP / 2)):
    x = dhol_tak(.2 + .8 * i / 16); drums.add(x, t, .4, .2 if i % 2 else -.2); send_room.add(x, t, .1)
    if i % 2 == 0: drums.add(snare(.2 + .6 * i / 16), t, .25)
# finale "DHA ... DHA DHAAA"
for t, v in [(42.6, 1.0), (43.1, .8), (43.35, .9), (43.6, 1.0)]:
    x = dhol_dhum(v); drums.add(x, t, .7); send_hall.add(x, t, .3)
    x = dhol_tak(v); drums.add(x, t, .45); send_hall.add(x, t, .2)
    kicks.append(t)

# ------------------------------------------------------------- drones & pads
for i, t in enumerate(np.arange(0.1, DUR - 2, 0.5)):
    note = [45, 50, 50, 38][i % 4]
    S = sec(t)
    g = {"intro": .55, "temple": .6, "break": .6, "finale": .5}.get(S, .22)
    if t < 1.0: g *= t / 1.0
    x = tanpura_note(note); music.add(x, t, g, -.4 + .8 * (i % 2)); send_hall.add(x, t, g * .3)
music.add(pad([50, 57, 64], DROP1 - 0.1, cutoff=900), 0, .35)
music.add(pad([50, 57, 62, 66], 3.2, cutoff=1100), TEMPLE, .38)
music.add(harmonium([50, 57, 62, 66], 2.9, bright=1600), TEMPLE, .28, -.2)
send_hall.add(harmonium([50, 57, 62, 66], 2.9, bright=1600), TEMPLE, .15)
music.add(pad([50, 57, 64], 2.1, cutoff=700), BREAK, .4)
x = harmonium([50, 57, 62, 66, 69], 4.0, bright=2400) * np.linspace(1, 0, int(4.0 * SR)) ** .5
music.add(x, FINALE, .32); send_hall.add(x, FINALE, .2)
music.add(pad([38, 50, 57, 62, 66], 4.2, cutoff=1600), FINALE, .45)

# ------------------------------------------------------------- transitions
sfx.add(riser(1.9, tonal_midi=50), 9.6, .35); send_hall.add(riser(1.9), 9.6, .1)
sfx.add(reverse_swell(1.2), 10.4, .35)
sfx.add(riser(1.4, 400, 10000), 19.6, .2)
sfx.add(riser(0.95, 300, 9000, tonal_midi=62), 27.1, .3)
sfx.add(riser(1.9, 150, 9000, tonal_midi=50), 40.65, .38)
sfx.add(reverse_swell(1.0), 41.6, .35)
for t, g in [(DROP1, .9), (DROP2, 1.0), (FINALE, 1.0)]:
    x = impact(); sfx.add(x, t, g * .75); send_hall.add(x, t, g * .25); kicks.append(t)
    x = crash(); drums.add(x, t, .35); send_hall.add(x, t, .1)
for t in (EDM, 23.35, 37.6, 31.1):
    drums.add(crash(.8, 2.5), t, .25, .3); send_hall.add(crash(.8, 2.5), t, .06)

# ------------------------------------------------------------- sound design
# ambience: van cabin air, then open-air festival night
sfx.add(filt(noise(int(11.6 * SR)), "lp", 500) * adsr(int(11.6 * SR), 0.6, 1, 1, .4), 0, .03)
# tap .. tap .. THUMP  (basket lands on the third hit)
LAND = 2.0
sfx.add(tap(.9), LAND - 1.0, .5, -.1); send_hall.add(tap(.9), LAND - 1.0, .3)
sfx.add(tap(1.0), LAND - 0.5, .6, .1); send_hall.add(tap(1.0), LAND - 0.5, .35)
sfx.add(whoosh(.45, 900, 250), LAND - .42, .35)
sfx.add(thud(1.0, 80), LAND, .9); send_room.add(thud(1.0, 80), LAND, .3)
sfx.add(impact(.6, 42, 2.0), LAND, .45); send_hall.add(impact(.5, 42, 2.0), LAND, .12)
sfx.add(wicker_crunch(.28), LAND, .5, .1)
sfx.add(thud(.35, 110), 2.28, .4, .15); sfx.add(wicker_crunch(.15), 2.28, .25)
for i in range(14):
    t = LAND + .05 + rng.uniform(0, .9) ** 1.4
    sfx.add(soft_pat(rng.uniform(.3, 1)), t, .4, rng.uniform(-.7, .7))
# indicator relay (blue van, shot 3) – clicks follow the lamp exactly
for src, on in [(3.70, 1), (4.19, 0), (4.70, 1), (5.20, 0)]:
    t = out_time(src)
    x = relay_click(bool(on)); sfx.add(x, t, .7, -.2); send_room.add(x, t, .25)
for t0 in (out_time(3.70), out_time(4.70)):
    tl = tt(.5); sfx.add(np.sin(2 * np.pi * 1760 * tl) * np.exp(-tl / .2) * .03, t0, 1)  # lamp glow shimmer
# tyre on gravel: weight thump + crunch
sfx.add(thud(.9, 60), 5.6, .6); sfx.add(gravel(2.0), 5.6, .26)
# Gurkha on wet rangoli
sfx.add(wet_roll(2.5), 7.6, .24)
sfx.add(engine(2.5, lambda t: 850 + 60 * np.sin(t * 3)), 7.6, .22)
# Traveller door
sfx.add(door_latch(), 10.45, .7, .3); send_room.add(door_latch(), 10.45, .2)
sfx.add(whoosh(.6, 300, 1500, peak="arc"), 10.55, .15, .3)
# dandiya hero clack
for t, g in [(15.62, 1.0), (16.12, .7)]:
    x = dandiya(1.0); sfx.add(x, t, .75 * g); send_hall.add(x, t, .4 * g)
# van rolls in with dancers
sfx.add(engine(2.5, lambda t: 1300 - 250 * t / 2.5), 16.6, .16, .2)
sfx.add(crowd(2.5, voices=20), 16.6, .1)
# Gurkha rev + headlight flash
sfx.add(engine(2.25, lambda t: 900 + 2600 * np.clip((t - .3) / .8, 0, 1) * np.exp(-np.clip(t - 1.2, 0, None) / .6)), 21.1, .32)
t = 23.09
sfx.add(light_on(1.0), t, .65); send_hall.add(light_on(1.0), t, .2); sfx.add(whoosh(.4, 3000, 600), t - .35, .25)
# crowd moments
for t, d, g in [(DROP1, 2.0, .18), (23.35, 1.8, .3), (37.6, 3.0, .3), (FINALE, 3.5, .25)]:
    x = crowd(d); sfx.add(x, t, g, 0); send_hall.add(x, t, g * .4)
# temple: big bell, aarti hand bell, conch
x = temple_bell(620); sfx.add(x, TEMPLE, .9, -.3); send_hall.add(x, TEMPLE, .5)
for i, t in enumerate(np.arange(25.3, 27.9, 0.125)):
    x = temple_bell(2350 + 30 * (i % 3), .25, 0.8); sfx.add(x, t, .35 * (0.6 + 0.4 * np.sin(i)), .45); send_hall.add(x, t, .15)
x = shankh(2.8); sfx.add(x, 25.2, .28, .1); send_hall.add(x, 25.2, .25)
# aerial reveal: searchlight sweeps
for t, p in [(28.3, -.7), (29.25, .7), (30.2, -.5)]:
    sfx.add(whoosh(1.1, 300, 5000, peak="arc"), t, .28, p)
# dandiya in pink smoke
sfx.add(whoosh(1.0, 200, 2500, peak="arc"), 31.1, .25, .4)
# solo dancer spin
sfx.add(whoosh(1.3, 400, 6000, peak="arc"), 34.15, .28, -.3)
# gulal colour burst
t = out_time(36.85)
sfx.add(reverse_swell(.5), t - .5, .2); sfx.add(poof(), t, .75, .15); send_hall.add(poof(), t, .35)
# break: headlight with marigold – indicator clicks return (echo of the opening)
for src, on in [(41.20, 1), (41.64, 0), (42.08, 1)]:
    t = out_time(src)
    x = relay_click(bool(on)); sfx.add(x, t, .8, -.15); send_hall.add(x, t, .25)
# finale: fleet lights up
sfx.add(light_on(1.0), FINALE, .6); send_hall.add(light_on(1.0), FINALE, .25)
x = temple_bell(880); sfx.add(x, FINALE + .05, .6, .3); send_hall.add(x, FINALE, .4)
x = shankh(3.0, 233); sfx.add(x, 43.2, .18, -.1); send_hall.add(x, 43.2, .18)

# ------------------------------------------------------------- mix
def duck_env(n, times, depth=.55, rel=.16):
    e = np.ones(n); tl = np.arange(int(rel * 5 * SR)) / SR
    shape = 1 - depth * np.exp(-tl / rel)
    for t in times:
        i = int(t * SR); j = min(n, i + len(shape))
        e[i:j] = np.minimum(e[i:j], shape[: j - i])
    return e

n = len(music.b)
hall = convolve(signal.sosfilt(sos("hp", 200, 2), send_hall.b, axis=0), reverb_ir(2.8, bright=4500, predelay=.025))
room = convolve(signal.sosfilt(sos("hp", 150, 2), send_room.b, axis=0), reverb_ir(0.7, bright=7000, predelay=.008))
duck = duck_env(n, kicks)[:, None]

# blackout: a breath of silence right before the aerial reveal
tt_ = np.arange(n) / SR
gap = np.ones(n)
for a, b in [(11.47, DROP1), (28.0, DROP2)]:
    gap[(tt_ > a) & (tt_ < b)] = 0.0
gap = signal.lfilter([0.02], [1, -0.98], gap)[:, None]

music_mix = (music.b * duck + 0.9 * hall * duck ** .5) * gap
drum_mix = (drums.b + 0.8 * room) * gap
sfx_mix = sfx.b * 1.5
mix = 0.95 * music_mix + 1.0 * drum_mix + 0.95 * sfx_mix

# master: gentle glue, low-end tidy, fade out
mix = signal.sosfilt(sos("hp", 28, 2), mix, axis=0)
fade = np.clip((TOTAL - tt_) / 1.8, 0, 1)[:, None] ** 1.5
mix *= fade
from scipy.ndimage import maximum_filter1d, uniform_filter1d
def limiter(x, ceil=0.89, look=0.004, rel=0.08):
    a = np.abs(x).max(1)
    g = np.minimum(1, ceil / np.maximum(a, 1e-9))
    L = int(look * SR)
    g = -maximum_filter1d(-g, 2 * L + 1)           # look-ahead min
    r = np.exp(-1 / (rel * SR))
    g = signal.lfilter([1 - r], [1, -r], g - 1) + 1 # smooth release
    g = -maximum_filter1d(-g, 2 * L + 1)
    g = uniform_filter1d(g, L)
    return x * np.minimum(g, 1)[:, None]
def lufs(x):
    k = signal.sosfilt(sos("hp", 60, 2), x, axis=0); k = signal.sosfilt(sos("hp", 1500, 1), k, axis=0) * 0.6 + k * 0.4
    bl = int(.4 * SR); hop = int(.1 * SR)
    ms = np.array([(k[i:i + bl] ** 2).sum(1).mean() for i in range(0, len(k) - bl, hop)])
    ms = ms[ms > 10 ** (-7)]
    return -0.691 + 10 * np.log10(ms.mean())
mix /= np.abs(mix).max()
mix = limiter(softclip(mix * 1.6, 1.2), ceil=0.7)   # tame transient spikes ~4 dB
mix = mix / np.abs(mix).max() * 0.5
wavfile.write("premaster.wav", SR, mix.astype(np.float32))
for name, b in [("stem_music", music_mix), ("stem_drums", drum_mix), ("stem_sfx", sfx_mix)]:
    b = b / (np.abs(b).max() + 1e-9) * .9
    wavfile.write(f"{name}.wav", SR, (b * 32767).astype(np.int16))
print("done", n / SR)
