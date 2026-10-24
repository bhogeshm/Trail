"""Split assets/final.png into the layers the composition animates.

Outputs (all 1920x1080 unless noted) into ../assets:
  plate_warm.jpg   sky + water with the skyline and the "5" removed
  plate_cool.jpg   same plate with the golden glow pulled back and calm water
  five.png         the "5" exactly as in the source, alpha-masked
  bld_warm.png     the skyline exactly as in the source, alpha-masked (cropped to BLD_TOP)
  glow.png         sky between the towers as in the source, alpha-masked (cropped to BLD_TOP)
  bld_cool.png     the skyline with its golden glow pulled back (cropped to BLD_TOP)
  reveal.png       per-pixel reveal data for the skyline (R strip id, G height fraction, B alpha)
  strips.js        delay / duration per strip
"""
import json
import os

import cv2
import numpy as np

from five_mask import five_mask, real_edges

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
SHORE = 991       # first row of open water
ZONE_TOP = 300    # nothing in the skyline reaches above this row
GAP = 10         # vertical gap a tower may have and still count as one column
BLD_TOP = 300     # crop row for the skyline images

img = cv2.imread(os.path.join(ASSETS, "final.png")).astype(np.float32)
H, W = img.shape[:2]
lum = img.mean(2)

def fill_from(known, src):
    """Smooth fill of src where ~known (push-pull over an image pyramid)."""
    k = known.astype(np.float32)
    v = src * k[..., None]
    levels = []
    while min(k.shape) > 4:
        levels.append((v, k))
        h, w = k.shape
        v = cv2.resize(v, ((w + 1) // 2, (h + 1) // 2), interpolation=cv2.INTER_AREA)
        k = cv2.resize(k, ((w + 1) // 2, (h + 1) // 2), interpolation=cv2.INTER_AREA)
    c = v / np.maximum(k, 1e-6)[..., None]
    for v, k in reversed(levels):
        h, w = k.shape
        up = cv2.GaussianBlur(cv2.resize(c, (w, h), interpolation=cv2.INTER_LINEAR), (0, 0), 1.0)
        kk = np.clip(k * 4, 0, 1)[..., None]  # coverage at this level
        c = (v / np.maximum(k, 1e-6)[..., None]) * kk + up * (1 - kk)
    return c


# ---------------------------------------------------------------- the "5"
m5 = five_mask().astype(np.float32) / 255
m5 = cv2.GaussianBlur(m5, (0, 0), 0.8)
m5_edge = cv2.dilate(real_edges(five_mask()).astype(np.uint8),
                     np.ones((11, 11), np.uint8)) > 0

# ---------------------------------------------------------------- skyline
mu = cv2.blur(lum, (5, 5))
sd = np.sqrt(np.maximum(cv2.blur(lum * lum, (5, 5)) - mu * mu, 0))
inside5 = m5 > 0.5
sky = ((lum > 200) & (sd < 5)) | (inside5 & (((lum > 125) & (sd < 6)) | (lum > 185)))
# second pass: anything that differs from the surrounding sky colour (hazy distant blocks)
sky_ref = fill_from(sky & ~inside5 & (np.arange(H)[:, None] < SHORE), img)
dist = np.abs(img - sky_ref).max(2)
cand = ~sky | ((dist > 20) & ~inside5)
cand[m5_edge & (lum > 140)] = False
cand[:ZONE_TOP] = False
cand[SHORE:] = False
cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)) > 0
# left of the skyline the shore is open: the city starts where the low blocks start
band_hits = cand[955:SHORE - 6].sum(0)
x_city = int(np.argmax(np.convolve(band_hits > 2, np.ones(15), "same") >= 13)) - 10
cand[SHORE - 14:SHORE, x_city:] = True
# close vertical slits inside towers (smooth glass reads as sky)
cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((1, 9), np.uint8)) > 0
cand[:, :max(0, x_city)] = False
# keep only pixels that stand on the shore through an unbroken column (gaps <= 3 px):
# clouds and tinted sky inside the "5" never connect down to the promenade
grounded = np.zeros_like(cand)
for x in range(W):
    col = cand[:, x]
    gap = 0
    for y in range(SHORE - 1, ZONE_TOP - 1, -1):
        if col[y]:
            grounded[y, x] = True
            gap = 0
        else:
            gap += 1
            if gap > GAP:
                break
cand = grounded

# fill each column from its top-most skyline pixel down to the shore
top = np.full(W, SHORE, np.int32)
for x in range(W):
    ys = np.where(cand[:, x])[0]
    if len(ys):
        top[x] = ys[0]
# close narrow notches in the skyline profile (slits in glass that read as sky)
height = (SHORE - top).astype(np.float32).reshape(1, -1)
height = cv2.erode(cv2.dilate(height, np.ones((1, 25), np.uint8)), np.ones((1, 25), np.uint8))
top = np.minimum(top, SHORE - height.ravel().astype(np.int32))
yy = np.arange(H)[:, None]
bld = (yy >= top[None, :]) & (yy < SHORE)
bmask = bld.astype(np.float32)
bmask = cv2.GaussianBlur(bmask, (0, 0), 0.7)
bmask[SHORE - 1:] = 0

# ---------------------------------------------------------------- clean plate
hole = np.maximum(m5, bmask)
hole_d = cv2.dilate((hole > 0.02).astype(np.uint8), np.ones((11, 11), np.uint8))
known = (hole_d == 0)
known[SHORE:] = False  # never sample water into the sky
known[:ZONE_TOP // 2] |= hole_d[:ZONE_TOP // 2] == 0
sky_est = fill_from(known, img)
smooth = cv2.GaussianBlur(sky_est, (0, 0), 6)
inner = cv2.GaussianBlur((~known).astype(np.float32), (0, 0), 4)[..., None]
sky_est = sky_est * (1 - inner) + smooth * inner

# keep the cloud texture going inside the "5": a damped high-pass of the source
hp = img - cv2.GaussianBlur(img, (0, 0), 10)
hp_l = hp.mean(2, keepdims=True)
tex = np.clip(hp_l * 0.22, -18, 18)
core5 = cv2.GaussianBlur(cv2.erode((m5 > 0.5).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32), (0, 0), 5)
near_bld = cv2.GaussianBlur(cv2.dilate((bmask > 0.02).astype(np.uint8), np.ones((31, 31), np.uint8)).astype(np.float32), (0, 0), 6)
plate = sky_est + tex * (core5 * (1 - near_bld))[..., None]
a = cv2.GaussianBlur(hole_d.astype(np.float32), (0, 0), 2)
a = np.maximum(a, hole)[..., None]
plate = img * (1 - a) + plate * a
# the horizon behind the city: a clean soft gradient, no leftover haze shapes
hz = np.zeros((H, W), np.float32)
hz[700:SHORE, 560:] = 1
hz = cv2.GaussianBlur(hz, (0, 0), 30)
hz[SHORE:] = 0
plate_s = cv2.GaussianBlur(plate, (0, 0), sigmaX=70, sigmaY=12)
plate = plate * (1 - hz[..., None]) + plate_s * hz[..., None]
plate[SHORE:] = img[SHORE:]
plate = np.clip(plate, 0, 255)

# ---------------------------------------------------------------- cool (pre-glow) versions
def cool(x, strength):
    l = x.mean(2, keepdims=True)
    warm = np.clip((x[..., 2:3] - x[..., 0:1]) / 90, 0, 1) * np.clip((l - 110) / 110, 0, 1)
    warm = cv2.GaussianBlur(warm[..., 0], (0, 0), 6)[..., None]
    neutral = l * np.array([1.02, 1.0, 0.97], np.float32)  # BGR: slight blue cast
    return x * (1 - strength * warm) + neutral * (strength * warm)

plate_cool = cool(plate, 0.4)
# calm water: soften reflections and streaks
water = plate_cool[SHORE:]
calm = cv2.GaussianBlur(water, (0, 0), sigmaX=18, sigmaY=4)
plate_cool[SHORE:] = water * 0.35 + calm * 0.65

bld_cool = cool(img, 0.35)

# sky between the towers: sky-like pixels flood-connected to the open sky above the city.
# It leaves the skyline layer (no hard-edged boxes during the reveal) and becomes the
# golden light that brightens between the buildings from 3 s.
skylike = ((sd < 4) & (lum > 165)) | ((dist < 18) & ~inside5) | (inside5 & (lum > 125) & (sd < 6))
skylike &= ~(yy >= SHORE)
n, lab = cv2.connectedComponents(skylike.astype(np.uint8), connectivity=4)
open_ids = np.unique(lab[ZONE_TOP - 20, :])
gap = np.isin(lab, open_ids[open_ids > 0]) & bld
gap = cv2.morphologyEx(gap.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(np.float32)
gap = cv2.GaussianBlur(gap, (0, 0), 1.0)
balpha = bmask * (1 - gap)
# drop hairlines left along the edges of the removed gaps
solid = cv2.morphologyEx((balpha > 0.5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
wide = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((1, 6), np.uint8))
near_gap = cv2.dilate((gap > 0.3).astype(np.uint8), np.ones((1, 9), np.uint8)) > 0
solid[(solid > 0) & (wide == 0) & near_gap] = 0
balpha *= cv2.GaussianBlur(cv2.dilate(solid, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 0.6)
glow_a = np.clip(gap * bmask * 1.0, 0, 1)

# ---------------------------------------------------------------- reveal map
# strips: split columns where the skyline top jumps; merge slivers into neighbours
x0 = int(np.where(top < SHORE)[0].min())
bounds = [x0]
for x in range(x0 + 1, W):
    if abs(int(top[x]) - int(top[x - 1])) > 22:
        bounds.append(x)
bounds.append(W)
segs = [[bounds[i], bounds[i + 1]] for i in range(len(bounds) - 1)]
changed = True
while changed:
    changed = False
    for i, (s, e) in enumerate(segs):
        if e - s < 18 and len(segs) > 1:
            j = i - 1 if i > 0 else i + 1
            if 0 < i < len(segs) - 1:
                # merge into the taller neighbour so spires join their tower
                lt = top[segs[i - 1][0]:segs[i - 1][1]].min()
                rt = top[segs[i + 1][0]:segs[i + 1][1]].min()
                j = i - 1 if lt <= rt else i + 1
            a_, b_ = min(i, j), max(i, j)
            segs[a_] = [segs[a_][0], segs[b_][1]]
            del segs[b_]
            changed = True
            break

strips = []
sid = np.zeros((H, W), np.uint8)
hfrac = np.zeros((H, W), np.float32)
heights = [SHORE - int(top[s:e].min()) for s, e in segs]
hmin, hmax = min(heights), max(heights)
for k, ((s, e), h) in enumerate(zip(segs, heights)):
    hn = (h - hmin) / max(1, hmax - hmin)
    delay = 0.25 + 0.55 * hn ** 0.85
    dur = 0.95 + 1.25 * hn
    strips.append({"x0": s, "x1": e, "height": h, "delay": round(delay, 3), "dur": round(dur, 3)})
    sid[:, s:e] = k + 1
    ysel = np.arange(H, dtype=np.float32)[:, None]
    hfrac[:, s:e] = np.clip((SHORE - ysel) / (h + 4), 0, 1)
# feathered edge pixels outside a column's own fill take the timing of the
# neighbouring column they were feathered from
for dx in (1, -1):
    src = np.roll(bld, -dx, axis=1)
    take = ~bld & src
    sid[take] = np.roll(sid, -dx, axis=1)[take]
    hfrac[take] = np.roll(hfrac, -dx, axis=1)[take]
reveal = np.zeros((H, W, 3), np.uint8)  # opaque: canvas premultiplies alpha, which would corrupt the ids
reveal[..., 2] = sid             # R (cv2 stores BGR)
reveal[..., 1] = np.round(hfrac * 255).astype(np.uint8)  # G
reveal[..., 0] = np.round(balpha * 255).astype(np.uint8)  # B: skyline alpha

# ---------------------------------------------------------------- write
def rgba(x, alpha):
    out = np.dstack([np.clip(x, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    return out

cv2.imwrite(os.path.join(ASSETS, "plate_warm.jpg"), np.clip(plate, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(os.path.join(ASSETS, "plate_cool.jpg"), np.clip(plate_cool, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(os.path.join(ASSETS, "five.png"), rgba(img, m5))
cv2.imwrite(os.path.join(ASSETS, "glow.png"), rgba(img, glow_a)[BLD_TOP:])
cv2.imwrite(os.path.join(ASSETS, "bld_warm.png"), rgba(img, balpha)[BLD_TOP:])
cv2.imwrite(os.path.join(ASSETS, "bld_cool.png"), rgba(bld_cool, balpha)[BLD_TOP:])
cv2.imwrite(os.path.join(ASSETS, "reveal.png"), reveal[BLD_TOP:])
with open(os.path.join(ASSETS, "strips.js"), "w") as f:
    f.write("// generated by tools/build_layers.py: [delay s, duration s, height px] per strip id 1..n\n")
    f.write("window.SKYLINE = " + json.dumps({"shore": SHORE, "top": BLD_TOP,
            "strips": [[s["delay"], s["dur"], s["height"]] for s in strips]}) + ";\n")
print(len(strips), "strips; city starts at x", x_city)
