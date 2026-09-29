"""Pure sound design (no background music). Rhythm comes from on-screen sources."""
import numpy as np
from scipy import signal
from scipy.io import wavfile
from engine import *
from foley import *
from edit import TOTAL

DUR = TOTAL + 0.2
fx = Bus(DUR)        # close / foreground
bed = Bus(DUR)       # ambiences & distant crowds
perc = Bus(DUR)      # diegetic rhythm (dhol, dandiya, claps, ghungroo)
hall = Bus(DUR)      # big-space reverb send
room = Bus(DUR)      # short outdoor/room send
temple_rv = Bus(DUR) # temple hall send
STEP = 0.5 / 3
hp = lambda x, f: signal.sosfilt(sos("hp", f, 2), x, axis=0)


def add(bus, x, t, g, p=0.0, h=0.0, r=0.0, tr=0.0):
    bus.add(x, t, g, p)
    if h: hall.add(x, t, g * h, p)
    if r: room.add(x, t, g * r, p)
    if tr: temple_rv.add(x, t, g * tr, p)


def grid(t0, t1):
    """Triplet grid steps (time, step-in-bar) between t0 and t1; bars start at 1.6 + 2k."""
    out = []
    k0 = int(np.floor((t0 - 1.6) / STEP)) - 1
    k = k0
    while True:
        t = 1.6 + k * STEP
        if t >= t1 - 1e-6: break
        if t >= t0 - 1e-6: out.append((round(t, 4), k % 12))
        k += 1
    return out


DHUM = {0: 1.0, 3: .45, 6: .9, 8: .55}
TAK = {2: .8, 5: .9, 9: .75, 11: .95, 4: .22, 7: .22, 10: .3}


def dhol_bed(t0, t1, g=1.0, dist=0.0, pan=0.0, fill_last=True):
    """Diegetic garba dhol (the dholi in the scene)."""
    for t, s in grid(t0, t1):
        bar_idx = int(round((t - 1.6 - s * STEP) / 2.0))
        tk = dict(TAK)
        if fill_last and bar_idx % 4 == 3: tk.update({9: .9, 10: .8, 11: 1.0})
        for d, fnx, gg in ((DHUM, dhol_dhum, .6), (tk, dhol_tak, .42)):
            if s in d:
                x = fnx(d[s] * rng.uniform(.9, 1.05))
                if dist: x = filt(x, "lp", 6000 - 5000 * dist)
                add(perc, x, t, g * gg * (1 - .5 * dist), pan, h=.15 + .3 * dist, r=.2)


def dandiya_bed(t0, t1, g=1.0, dist=0.0, steps=(0, 3, 6, 9), people=3):
    for t, s in grid(t0, t1):
        if s in steps:
            for _ in range(people):
                x = dandiya(rng.uniform(.4, 1), bells=rng.random() < .5)
                if dist: x = filt(x, "lp", 7000 - 5000 * dist)
                add(perc, x, t + abs(rng.normal(0, .012)), g * .25, rng.uniform(-.8, .8), h=.1 + .2 * dist, r=.15)


def ghungroo_bed(t0, t1, g=1.0, steps=(0, 3, 6, 9), dist=0.0):
    for t, s in grid(t0, t1):
        if s in steps:
            x = ghungroo(rng.uniform(.5, 1), bells=18)
            if dist: x = filt(x, "lp", 9000 - 5000 * dist)
            add(perc, x, t + rng.uniform(0, .02), g * .5, rng.uniform(-.6, .6), r=.2)
            add(perc, footstep(rng.uniform(.4, .8)), t, g * .25, rng.uniform(-.5, .5))


def crowd_claps(t0, t1, g=1.0, steps=(3, 9), people=14, dist=0.3):
    for t, s in grid(t0, t1):
        if s in steps:
            x = filt(group_clap(people, spread=.03), "lp", 9000 - 5000 * dist)
            add(perc, x, t, g * .6, rng.uniform(-.3, .3), h=.25, r=.3)


# ======================================================== AMBIENCE BEDS
add(bed, filt(noise(int(1.6 * SR)), "lp", 350) * adsr(int(1.6 * SR), .4, 1, 1, .15), 0, .05)       # van cabin
add(bed, day_bed(6.0), 1.6, .5)                                                                      # daytime exterior
add(bed, night_bed(DUR - 7.6), 7.6, .35)                                                             # night
add(bed, walla(3.0, distance=.9), 7.6, .10, 0, h=.3)                                                 # festival far away
add(bed, walla(1.6, distance=.6), 10.1, .14, 0, h=.3)
add(bed, walla(13.6, density=40, distance=.35), 11.5, .16, 0, h=.25)                                 # at the ground
add(bed, walla(12.6, density=60, distance=.3), 28.1, .16, 0, h=.25)
add(bed, walla(4.4, density=50, distance=.5), 40.6, .07, 0, h=.3)

# ======================================================== 0.0  girl in the van
add(fx, swish(.5, .5, 300, 2500), .35, .25, -.2)
add(fx, bangles(.6), .55, .35, -.2, r=.2)
# tap · tap · THUMP (fingers on her knee, then the basket lands)
add(fx, tap(.9), 1.0, .55, -.1, h=.35)
add(fx, tap(1.0), 1.5, .65, .1, h=.4)
# ======================================================== 1.6  marigold basket drop
LAND = 2.0
add(fx, whoosh(.42, 1400, 300), LAND - .4, .35)
add(fx, thud(1.0, 78), LAND, 1.0, 0, h=.2, r=.3)
add(fx, impact(.55, 40, 1.2), LAND, .45, 0, h=.1)
add(fx, wicker_crunch(.3), LAND, .6, .1, r=.2)
add(fx, thud(.35, 120), 2.27, .45, .1)                       # basket settles / tilts
add(fx, wicker_crunch(.15), 2.27, .3)
for i in range(18):                                          # marigolds bouncing off
    t = LAND + .04 + rng.uniform(0, 1.0) ** 1.5
    add(fx, soft_pat(rng.uniform(.3, 1)), t, .45, rng.uniform(-.8, .8), r=.2)
for t in (2.45, 2.62, 2.9):                                  # the stray ones rolling away
    add(fx, soft_pat(.5), t, .35, .6)
# ======================================================== 3.6  blue indicator (+ bridge the tick into the tyre shot)
for t, on in [(3.667, 1), (4.17, 0), (4.667, 1), (5.17, 0)]:
    add(fx, relay_click(bool(on)), t, .85, -.2, r=.25)
for t, on in [(5.667, 1), (6.17, 0), (6.667, 1), (7.17, 0)]:  # heard from inside, softer
    add(fx, filt(relay_click(bool(on)), "lp", 5000), t, .35, -.3, r=.2)
add(bed, diesel(2.0, 720, .5), 3.6, .10)
# ======================================================== 5.6  tyre on gravel
add(fx, thud(.9, 55), 5.6, .7, 0, r=.2)
add(fx, hp(gravel(2.0, density=1100), 120), 5.6, .5)
add(fx, hp(diesel(2.0, 900), 70), 5.6, .14)
for t in np.arange(5.75, 7.6, .23):                          # tread blocks popping stones
    add(fx, dandiya(.12, bells=False), t + rng.uniform(0, .05), .12, rng.uniform(-.5, .5))
# distant festival dhol starts to be heard (heartbeat of the night)
dhol_bed(7.6, 10.1, g=.55, dist=.9)
# ======================================================== 7.6  Gurkha on wet rangoli
add(fx, hp(wet_roll(2.5), 110), 7.6, .35)
add(fx, hp(diesel(2.5, 780, 1.0), 70), 7.6, .18)
add(fx, powder_puff(1.0, 1.0), 9.15, .55, .2, r=.2)          # rangoli powder kicks up
add(fx, powder_puff(.6, .8), 9.45, .35, .3)
# ======================================================== 10.1 Traveller door
dhol_bed(10.1, 11.3, g=.6, dist=.75)
add(fx, footstep(.7, "hard"), 10.35, .45, .3)
add(fx, footstep(.6, "hard"), 10.68, .4, .35)
add(fx, swish(.35, .6), 10.95, .3, .3)
add(fx, whoosh(.3, 400, 1200), 11.0, .3, .3)                 # door swinging shut
add(fx, slam(1.0), 11.3, .9, .25, h=.25, r=.3)
add(fx, reverse_swell(.28), 11.32, .45)                     # suck-in to the drop
# ======================================================== 11.6 DHOL (close, full)
add(fx, impact(.9, 44, 2.5), 11.6, .6, 0, h=.25)
add(fx, cheer(2.2), 11.62, .28, 0, h=.3)
for t, v in [(11.6, 1.0), (11.9, .95), (13.07, 1.0)]:        # visible stick strikes
    add(fx, dhol_dhum(v, 70), t, .75, -.15, h=.2, r=.25)
dhol_bed(11.6, 13.6, g=1.0, pan=-.1)
ghungroo_bed(11.6, 13.6, g=.35, dist=.4)
# ======================================================== 13.6 women walk & clap
dhol_bed(13.6, 16.6, g=.65, dist=.25, pan=-.3)
for i, t in enumerate(np.arange(13.6, 15.6, .25)):           # footsteps + anklets, 5 women
    add(fx, footstep(.6, "hard"), t + rng.uniform(0, .03), .3, rng.uniform(-.6, .6))
    add(fx, ghungroo(.8, bells=20), t + rng.uniform(0, .02), .45, rng.uniform(-.7, .7), r=.2)
add(fx, swish(.6, .6), 14.25, .3, -.3)                       # arms swing up
add(fx, swish(.6, .6), 14.28, .3, .3)
for t in (14.62, 14.93, 15.17, 15.42):                       # measured hand contacts
    add(fx, group_clap(5, spread=.014), t, 1.0, 0, r=.35, h=.12)
# ======================================================== 15.6 dandiya hero
add(fx, dandiya(.5), 15.6, .45, 0, r=.2)
add(fx, whoosh(.4, 500, 3000), 15.65, .45, -.3)
add(fx, ghungroo_shake(.4, .8), 15.65, .35, -.2)
add(fx, dandiya(1.0), 16.07, 1.1, 0, h=.45, r=.3)            # the CLACK
add(fx, ghungroo_shake(.5, 1.0), 16.07, .6, .1, r=.2)
add(fx, swish(.5, .5, 1200, 6000), 16.1, .2, .4)             # ribbons flutter
# ======================================================== 16.6 van + dancers jump out
dhol_bed(16.6, 19.1, g=.8, dist=.35)
dandiya_bed(16.6, 19.1, g=.6, dist=.5)
add(fx, diesel(1.2, 1100), 16.6, .3, -.2)
add(fx, tyre_dirt(1.2), 16.6, .3)
add(fx, slide_door(.25), 16.88, .7, .1, r=.3)
for t in (17.55, 17.85, 18.2):                               # hop down: land + anklets
    add(fx, footstep(1.0), t, .6, rng.uniform(-.2, .3), r=.2)
    add(fx, ghungroo(1.0, bells=26), t, .7, rng.uniform(-.3, .3), r=.2)
add(fx, cheer(1.8, voices=25), 17.85, .3, 0, h=.3)
add(fx, dandiya(1.0), 18.6, .8, 0, h=.3, r=.3)               # sticks up together
add(fx, swish(.5, .8), 18.25, .35, .2)
# ======================================================== 19.1 DJ
dhol_bed(19.1, 21.1, g=.7, dist=.4)
crowd_claps(19.1, 21.1, g=.5)
for t in (19.3, 19.47, 19.6):                                # mixer knobs / faders
    add(fx, relay_click(True, .5), t, .35, .1)
add(fx, whoosh(.3, 300, 2500), 19.75, .45, -.2)              # arm swings up
add(fx, impact(.5, 55, 1.5), 20.0, .45, 0, h=.3)             # stage lights switch colour
add(fx, buzz(1.1, 1.0), 20.0, .25)
add(fx, cheer(1.8), 20.0, .45, 0, h=.3)
for t in (20.3, 20.6, 20.9):                                 # fist pumps
    add(fx, whoosh(.18, 400, 1600), t - .12, .25, -.2)
    add(perc, dhol_dhum(1.0), t, .35)
# ======================================================== 21.1 Gurkha
add(fx, hp(diesel(2.25, 820), 60), 21.1, .3)
add(fx, relay_click(True), 21.5, .8, .2, r=.3)               # amber blink on
add(fx, relay_click(False), 22.0, .7, .2, r=.3)              # and off
add(fx, engine(1.0, lambda t: 850 + 2400 * np.sin(np.pi * np.clip(t / 1.0, 0, 1))), 22.1, .35)
add(fx, whoosh(.35, 3000, 500), 22.75, .3)
add(fx, light_on(1.0), 23.09, .8, 0, h=.35)                  # headlight snap
dhol_bed(21.1, 23.35, g=.35, dist=.85)
# ======================================================== 23.35 the whole garba ground
add(fx, cheer(2.0, voices=60), 23.35, .55, 0, h=.35)
dhol_bed(23.35, 25.1, g=.95, dist=.3)
crowd_claps(23.35, 25.1, g=1.0, steps=(0, 3, 6, 9), people=24)
dandiya_bed(23.35, 25.1, g=.6, dist=.6, people=5)
ghungroo_bed(23.35, 25.1, g=.6, dist=.5)
# ======================================================== 25.1 Durga temple
add(fx, temple_bell(620), 25.1, .9, -.3, tr=.6)
add(fx, shankh(2.6), 25.2, .45, .1, tr=.5)
for i, t in enumerate(np.arange(25.3, 27.8, .125)):          # aarti hand-bell
    add(fx, temple_bell(2350 + 30 * (i % 3), .25, .8), t, .3 * (.6 + .4 * np.sin(i)), .45, tr=.3)
for t, s in grid(25.1, 27.9):
    if s in (0, 6): add(perc, dhol_dhum(.6), t, .45, -.4, tr=.5)
    if s in (3, 9): add(perc, manjira(1.0), t, .6, .35, tr=.4)
    if s in (0, 3, 6, 9): add(perc, ghungroo(.6, bells=16), t + .01, .35, rng.uniform(-.5, .5), tr=.3)
    if s in (3, 9): add(perc, group_clap(6, .02, .6), t, .35, 0, tr=.4)
add(fx, swish(1.2, .6), 25.6, .25, -.3, tr=.3)
add(fx, swish(1.2, .6), 26.9, .25, .3, tr=.3)
add(fx, reverse_swell(.8), 27.2, .55)                        # everything sucks into the blackout
# ======================================================== 28.1 aerial reveal (after 0.1 s of silence)
add(fx, impact(1.0, 42, 3.5), 28.1, .9, 0, h=.35)
add(fx, crash(.8, 3.0), 28.1, .25, 0, h=.1)
add(bed, wind(3.0, 1.0), 28.1, .25)
for t, p in [(28.3, -.7), (29.25, .7), (30.2, -.5)]:          # searchlight beams sweeping
    add(fx, whoosh(1.1, 300, 5000, peak="arc"), t, .3, p)
add(fx, buzz(3.0, .7, 120), 28.1, .12)
dhol_bed(28.1, 31.1, g=.7, dist=.6)
crowd_claps(28.1, 31.1, g=.9, steps=(0, 3, 6, 9), people=30, dist=.6)
dandiya_bed(28.1, 31.1, g=.5, dist=.8, people=6)
# ======================================================== 31.1 dandiya in pink smoke
add(fx, hiss(1.4, 1.0), 31.1, .35, -.5, r=.2)                # colour-smoke cannon
dhol_bed(31.1, 34.1, g=.9, dist=.2)
dandiya_bed(31.1, 34.1, g=.7, dist=.3, people=4)
ghungroo_bed(31.1, 34.1, g=.5, dist=.3)
for t in (31.48, 31.9, 32.4, 32.9, 33.4, 33.7):              # the hero pair's strikes
    add(fx, dandiya(1.0), t, .9, rng.uniform(-.2, .2), r=.3, h=.15)
for t in (31.3, 32.2, 33.1):
    add(fx, swish(.5, .7), t, .3, rng.uniform(-.5, .5))
add(fx, diesel(3.0, 800), 31.1, .12, .5)
# ======================================================== 34.1 solo dancer
add(fx, buzz(1.5, .8, 100), 34.1, .1)
dhol_bed(34.1, 35.6, g=.8, dist=.3)
for t in (34.47, 34.85, 35.23):                              # sticks crossed overhead
    add(fx, dandiya(1.0), t, .9, 0, r=.35, h=.2)
    add(fx, ghungroo(.8, 12), t, .35, 0)
for t in (34.2, 34.6, 35.0):
    add(fx, footstep(.7), t, .35, .1)
    add(fx, ghungroo(1.0, 22), t, .5, .1, r=.2)
add(fx, whoosh(.9, 400, 5000, peak="arc"), 34.95, .4, -.3)   # skirt spin
add(fx, ghungroo_shake(.8, 1.0), 35.0, .5, .1, r=.2)
add(fx, swish(.8, 1.0, 400, 3000), 35.0, .45, .2)
# ======================================================== 35.6 couple + gulal
dhol_bed(35.6, 37.6, g=.75, dist=.35)
crowd_claps(35.6, 37.6, g=.5)
add(fx, swish(.6, .6), 35.7, .3, -.3)
add(fx, bangles(1.0), 35.9, .45, -.3, r=.2)
add(fx, whoosh(.3, 500, 2000), 36.5, .35, 0)
add(fx, dandiya(.9), 36.7, .8, -.1, r=.3)
add(fx, reverse_swell(.35), 36.5, .3)
add(fx, dandiya(1.0), 36.85, 1.0, .1, r=.3, h=.25)           # strike that bursts the gulal
add(fx, poof(1.0, 1.4), 36.85, .95, .1, h=.35)
add(fx, bangles(1.0), 36.87, .5, -.2)
add(fx, cheer(1.2, voices=12), 36.95, .22)
for t in (37.12, 37.4):
    add(fx, dandiya(.8), t, .7, rng.uniform(-.2, .2), r=.3)
# ======================================================== 37.6 main stage
add(fx, cheer(3.0, voices=70), 37.6, .6, 0, h=.35)
add(fx, crash(.8, 2.5), 37.6, .22, .3, h=.1)
add(fx, poof(.8, 1.0), 37.85, .45, -.4, h=.25)               # gulal thrown at the stage
add(fx, poof(.6, 1.0), 38.3, .35, .5, h=.25)
dhol_bed(37.6, 40.55, g=1.0, dist=.2)
crowd_claps(37.6, 40.55, g=.9, steps=(0, 3, 6, 9), people=20)
dandiya_bed(37.6, 40.55, g=.7, dist=.4, people=5)
ghungroo_bed(37.6, 40.55, g=.7, dist=.3)
for t in (38.0, 38.7, 39.4, 40.0):                           # skirts twirling
    add(fx, swish(.7, .8, 400, 3500), t, .4, rng.uniform(-.6, .6))
    add(fx, ghungroo_shake(.6, .7), t, .3, rng.uniform(-.6, .6))
add(fx, reverse_swell(.6), 40.0, .35)
# ======================================================== 40.6 headlight + marigold (the hush)
add(fx, riser(1.9, 120, 7000), 40.65, .3)
for t, on in [(41.30, 1), (41.73, 0), (42.17, 1)]:
    add(fx, relay_click(bool(on)), t, .95, -.15, h=.3, r=.3)
add(fx, buzz(2.0, .4, 100), 40.6, .12)
dhol_bed(40.6, 42.45, g=.3, dist=.95, fill_last=False)       # the festival, muffled, far behind
add(fx, reverse_swell(.5), 42.1, .45)
# ======================================================== 42.6 fleet line-up
add(fx, impact(1.0, 42, 4.0), 42.6, 1.0, 0, h=.4)
add(fx, light_on(1.0), 42.6, .7, 0, h=.3)
add(fx, cheer(3.5, voices=70), 42.65, .45, 0, h=.35)
for t, v in [(42.6, 1.0), (43.1, .85), (43.35, .9), (43.6, 1.0)]:   # "DHA ... DHA-DHAAA"
    add(perc, dhol_dhum(v), t, .9, 0, h=.35)
    add(perc, dhol_tak(v), t, .6, .1, h=.25)
    add(perc, dandiya(v), t + .005, .5, -.2, h=.2)
    add(perc, group_clap(20, .02), t, .5, 0, h=.3)
add(fx, temple_bell(880), 43.6, .5, .3, h=.5)
add(fx, diesel(3.5, 760, 1.0), 42.6, .15)
add(bed, night_bed(4.2), 42.6, .3)

# ======================================================== MIX
n = len(fx.b)
tt_ = np.arange(n) / SR
hp = lambda x, f: signal.sosfilt(sos("hp", f, 2), x, axis=0)
H = convolve(hp(hall.b, 180), reverb_ir(2.6, bright=4500, predelay=.03))
R = convolve(hp(room.b, 150), reverb_ir(.6, bright=7000, predelay=.01))
T = convolve(hp(temple_rv.b, 150), reverb_ir(3.4, bright=3800, predelay=.04))
gap = np.ones(n)
for a, b in [(11.5, 11.6), (27.98, 28.1)]:                  # breath of silence before the big hits
    gap[(tt_ > a) & (tt_ < b)] = 0.0
gap = signal.lfilter([0.03], [1, -0.97], gap)[:, None]
mix = (1.0 * fx.b + 0.75 * hp(bed.b, 140) + 0.9 * perc.b + .8 * H + .9 * R + .9 * T) * gap
mix = hp(mix, 30)
mix *= (np.clip((TOTAL - tt_) / 1.8, 0, 1) ** 1.5)[:, None]
mix /= np.abs(mix).max()


from scipy.ndimage import maximum_filter1d, uniform_filter1d
def limiter(x, ceil=0.7, look=0.004, rel=0.08):
    a = np.abs(x).max(1)
    g = np.minimum(1, ceil / np.maximum(a, 1e-9))
    L = int(look * SR)
    g = -maximum_filter1d(-g, 2 * L + 1)
    r = np.exp(-1 / (rel * SR))
    g = signal.lfilter([1 - r], [1, -r], g - 1) + 1
    g = -maximum_filter1d(-g, 2 * L + 1)
    return x * np.minimum(uniform_filter1d(g, L), 1)[:, None]


mix = limiter(softclip(mix * 1.4, 1.2))
mix = mix / np.abs(mix).max() * .5
wavfile.write("premaster.wav", SR, mix.astype(np.float32))
for name, b in [("stem_foreground_fx", fx.b), ("stem_rhythm_perc", perc.b), ("stem_ambience", bed.b)]:
    b = b / (np.abs(b).max() + 1e-9) * .9
    wavfile.write(f"{name}.wav", SR, (b * 32767).astype(np.int16))
print("ok", n / SR)
