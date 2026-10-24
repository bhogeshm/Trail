"""Split assets/source.png into the layers the composition animates.

Run tools/trace_line.py first (it writes tools/line.json). Outputs into ../assets:
  final.png        the source with the curve, ticks and dots removed (the hold frame
                   underneath the redrawn curve)
  plate.jpg        sky and waterfront with the skyline removed, water calmed
  plate_water.jpg  the same plate with the source's water and reflections
  bld.png          the skyline as in the source, alpha-masked (cropped to BLD_TOP)
  reveal.png       opaque per-pixel reveal data (R strip id, G height fraction, B alpha)
  occluder.png     the Gherkin silhouette: the curve and balls pass behind it
  strips.js        timing per strip, and the traced curve and ticks
"""
import json
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
BLD_TOP = 120          # nothing in the skyline reaches above this row
GAP = 10               # vertical gap a tower may have and still count as one column
MBS_X = (30, 500)      # Marina Bay Sands: its deck overhangs open sky, so allow long gaps
MBS_GAP = 220

src = cv2.imread(os.path.join(ASSETS, "source.png"))
H, W = src.shape[:2]
line = json.load(open(os.path.join(HERE, "line.json")))
curve = np.array(line["points"], np.float32)

# ---------------------------------------------------------------- remove the curve, ticks, dots
GHERKIN_HIDDEN = (1163, 1289)  # the curve runs behind the Gherkin here: leave those pixels alone
lmask = np.zeros((H, W), np.uint8)
pts = np.round(curve).astype(np.int32)
cv2.polylines(lmask, [pts], False, 255, 11, cv2.LINE_AA)
lmask[:, GHERKIN_HIDDEN[0]:GHERKIN_HIDDEN[1]] = 0
for t in line["ticks"]:
    x = int(round(t["x"]))
    cv2.line(lmask, (x, t["top"] - 4), (x, t["bottom"]), 255, 9)
lmask[:, GHERKIN_HIDDEN[0]:GHERKIN_HIDDEN[1]][:, :] = np.where(
    np.arange(H)[:, None] < 600, lmask[:, GHERKIN_HIDDEN[0]:GHERKIN_HIDDEN[1]], 0)
for t in line["ticks"]:
    x = int(round(t["x"]))
    if abs(x - 1287) < 3:  # tick beside the Gherkin: its top part is in open sky
        cv2.line(lmask, (x, t["top"] - 4), (x, 600), 255, 9)
for (cx, cy) in [(328, 576), (880, 750), (1768, 468)]:  # the dots in the source
    cv2.circle(lmask, (cx, cy), 18, 255, -1)
lmask = (lmask > 0).astype(np.uint8) * 255
clean = cv2.inpaint(src, lmask, 6, cv2.INPAINT_TELEA)
img = clean.astype(np.float32)
lum = img.mean(2)

# ---------------------------------------------------------------- ground line
# Everything below G(x) is waterfront and stays put; the skyline above it rises.
G_PTS = [(0, 965), (250, 965), (262, 900), (480, 900), (495, 850), (620, 852), (800, 880),
         (1000, 905), (1015, 970), (1050, 940), (1100, 925), (1140, 940), (1150, 975), (1320, 975),
         (1330, 885), (1340, 870), (1380, 880), (1420, 895), (1460, 870),
         (1500, 870), (1540, 900), (1560, 945), (1920, 945)]
gx, gy = zip(*G_PTS)
ground = np.round(np.interp(np.arange(W), gx, gy)).astype(np.int32)
yy = np.arange(H)[:, None]
above = yy < ground[None, :]


# ---------------------------------------------------------------- skyline mask
def fill_from(known, srcimg):
    """Smooth fill of srcimg where ~known (push-pull over an image pyramid)."""
    k = known.astype(np.float32)
    v = srcimg * k[..., None]
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
        kk = np.clip(k * 4, 0, 1)[..., None]
        c = (v / np.maximum(k, 1e-6)[..., None]) * kk + up * (1 - kk)
    return c


mu = cv2.blur(lum, (5, 5))
sd = np.sqrt(np.maximum(cv2.blur(lum * lum, (5, 5)) - mu * mu, 0))
sky = (lum > 170) & (sd < 5)
sky_ref = fill_from(sky & above, img)
dist = np.abs(img - sky_ref).max(2)
cand = (~sky | (dist > 22)) & above
cand[560:, MBS_X[0]:MBS_X[1]] |= (dist[560:, MBS_X[0]:MBS_X[1]] > 12)
cand &= above
cand[:BLD_TOP] = False
cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)) > 0
# the ground row itself always belongs to the skyline where something stands on it
for x in range(W):
    cand[ground[x] - 3:ground[x], x] = True
cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((1, 9), np.uint8)) > 0
# keep what stands on the ground through an unbroken column (drops clouds)
grounded = np.zeros_like(cand)
for x in range(W):
    gap = 0
    for y in range(ground[x] - 1, BLD_TOP - 1, -1):
        if cand[y, x]:
            grounded[y, x] = True
            gap = 0
        else:
            gap += 1
            if gap > (MBS_GAP if MBS_X[0] <= x < MBS_X[1] else GAP):
                break
top = np.full(W, H, np.int32)
for x in range(W):
    ys = np.where(grounded[:, x])[0]
    top[x] = ys[0] if len(ys) else ground[x]
height = (ground - top).astype(np.float32).reshape(1, -1)
height = cv2.erode(cv2.dilate(height, np.ones((1, 15), np.uint8)), np.ones((1, 15), np.uint8))
top = np.minimum(top, ground - height.ravel().astype(np.int32))
bld = (yy >= top[None, :]) & above
# lit faces beside a tower read almost like sky: take anything off-sky right next to it
near = cv2.dilate(bld.astype(np.uint8), np.ones((1, 31), np.uint8)) > 0
bld |= near & (dist > 14) & above & (yy >= BLD_TOP)
bld = cv2.morphologyEx(bld.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) > 0
bmask = cv2.GaussianBlur(bld.astype(np.float32), (0, 0), 0.7) * above

# ---------------------------------------------------------------- plate
hole_d = cv2.dilate((bmask > 0.02).astype(np.uint8), np.ones((15, 15), np.uint8))
known = (hole_d == 0) & above
sky_est = fill_from(known, img)
smooth = cv2.GaussianBlur(sky_est, (0, 0), 8)
inner = cv2.GaussianBlur((~known).astype(np.float32), (0, 0), 4)[..., None]
sky_est = sky_est * (1 - inner) + smooth * inner
a = np.maximum(cv2.GaussianBlur(hole_d.astype(np.float32), (0, 0), 2), bmask)[..., None]
a = a * above[..., None]
plate = img * (1 - a) + sky_est * a
# horizon behind the cities: a clean soft gradient, no leftover haze shapes
hz = np.zeros((H, W), np.float32)
for x in range(W):
    hz[max(BLD_TOP, ground[x] - 260):ground[x], x] = 1
hz = cv2.GaussianBlur(hz, (0, 0), 25) * above
plate_s = cv2.GaussianBlur(plate, (0, 0), sigmaX=60, sigmaY=10)
plate = plate * (1 - hz[..., None]) + plate_s * hz[..., None]
plate = np.where(above[..., None], plate, img)
plate_water = plate.copy()

# calm water: soften reflections of the city in the open water
WATER_TOP = 975
water_m = np.zeros((H, W), np.float32)
water_m[WATER_TOP:] = 1
water_m[:1052, 1010:1565] = 0      # the island quay
water_m[:, :] *= ~above
water_m = cv2.GaussianBlur(water_m, (0, 0), 3)
calm = cv2.GaussianBlur(plate, (0, 0), sigmaX=22, sigmaY=5)
plate = plate * (1 - 0.7 * water_m[..., None]) + calm * (0.7 * water_m[..., None])

# ---------------------------------------------------------------- reveal map
# strips: split columns where the skyline top jumps; merge slivers into the taller neighbour
x0 = int(np.where(top < ground)[0].min())
bounds = [x0]
for x in range(x0 + 1, W):
    if abs(int(top[x]) - int(top[x - 1])) > 22 or abs(int(ground[x]) - int(ground[x - 1])) > 20:
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
                lt = top[segs[i - 1][0]:segs[i - 1][1]].min()
                rt = top[segs[i + 1][0]:segs[i + 1][1]].min()
                j = i - 1 if lt <= rt else i + 1
            a_, b_ = min(i, j), max(i, j)
            segs[a_] = [segs[a_][0], segs[b_][1]]
            del segs[b_]
            changed = True
            break

# clusters, left to right; each landmark leads its cluster, its neighbours follow
CLUSTERS = [  # x from, x to, cluster start (s), landmark x-range
    (0, 495, 0.15, (50, 490)),        # Singapore: Marina Bay Sands
    (495, 1110, 1.05, (775, 865)),    # Dubai: Burj Khalifa
    (1110, 1560, 1.95, (1150, 1320)), # London: the Gherkin
    (1560, 1921, 2.75, (1645, 1730)), # New York: One World Trade Center
]
strips = []
sid = np.zeros((H, W), np.uint8)
hfrac = np.zeros((H, W), np.float32)
for k, (s, e) in enumerate(segs):
    xc = (s + e) / 2
    h = int((ground[s:e] - top[s:e]).max())
    for cx0, cx1, start, (lx0, lx1) in CLUSTERS:
        if cx0 <= xc < cx1:
            break
    landmark = lx0 <= xc < lx1 and h > 200
    order = (xc - cx0) / (cx1 - cx0)  # position inside the cluster, left to right
    delay = start + (0.0 if landmark else 0.3 + 0.45 * order)
    dur = 1.0 + 0.9 * min(1.0, h / 700)
    strips.append([round(delay, 3), round(dur, 3), h, int(landmark)])
    sid[:, s:e] = k + 1
    gcol = ground[s:e][None, :].astype(np.float32)
    hfrac[:, s:e] = np.clip((gcol - yy) / (h + 4), 0, 1)
for dx in (1, -1):  # feathered edge pixels take the timing of the column they came from
    src_b = np.roll(bld, -dx, axis=1)
    take = ~bld & src_b
    sid[take] = np.roll(sid, -dx, axis=1)[take]
    hfrac[take] = np.roll(hfrac, -dx, axis=1)[take]
assert max(d + u for d, u, _, _ in strips) <= 5.0, "skyline must be up by 5 s"
assert len(strips) < 255

reveal = np.zeros((H, W, 3), np.uint8)  # opaque: a canvas premultiplies alpha
reveal[..., 2] = sid
reveal[..., 1] = np.round(hfrac * 255).astype(np.uint8)
reveal[..., 0] = np.round(bmask * 255).astype(np.uint8)

# the Gherkin: the curve and the balls pass behind it
occ = np.zeros((H, W), np.float32)
# the tower body only: the skyline mask also holds a few pixels of lit sky at its edge
body = (bld & (dist > 45)).astype(np.uint8)
body = cv2.morphologyEx(body, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
body = cv2.morphologyEx(body, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(np.float32)
occ[:, 1150:1330] = cv2.GaussianBlur(body, (0, 0), 0.8)[:, 1150:1330]
occ[:500] = 0
occ[700:] = 0

# ---------------------------------------------------------------- write
def rgba(x, alpha):
    return np.dstack([np.clip(x, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)

cv2.imwrite(os.path.join(ASSETS, "final.png"), clean)
cv2.imwrite(os.path.join(ASSETS, "plate.jpg"), np.clip(plate, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(os.path.join(ASSETS, "plate_water.jpg"), np.clip(plate_water, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(os.path.join(ASSETS, "bld.png"), rgba(img, bmask)[BLD_TOP:])
cv2.imwrite(os.path.join(ASSETS, "reveal.png"), reveal[BLD_TOP:])
cv2.imwrite(os.path.join(ASSETS, "occluder.png"), rgba(np.zeros_like(img), occ))
with open(os.path.join(ASSETS, "strips.js"), "w") as f:
    f.write("// generated by tools/build_layers.py\n")
    f.write("window.SKYLINE = " + json.dumps({
        "top": BLD_TOP,
        "strips": strips,  # [delay s, duration s, height px, landmark]
        "curve": line["points"],
        "stroke": line["stroke"],
        "ticks": line["ticks"],
    }) + ";\n")
print(len(strips), "strips; last lands at", max(d + u for d, u, _, _ in strips))
